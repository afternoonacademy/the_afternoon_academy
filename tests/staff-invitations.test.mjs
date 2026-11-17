import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { PGlite } from '@electric-sql/pglite'

const migration = fs.readFileSync('supabase/migrations/20261117191220_staff_magic_link_signup.sql', 'utf8')
const uid = '10000000-0000-4000-8000-000000000001'
const other = '10000000-0000-4000-8000-000000000002'
async function fixture() {
  const db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; grant usage on schema public to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create table public.users(id uuid primary key default gen_random_uuid(),auth_user_id uuid unique not null references auth.users(id),email text unique not null,name text,role text not null check(role in ('admin','teacher','parent')));
    create table public.user_roles(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),role text constraint user_roles_role_check check(role in ('admin','parent','tutor')),unique(user_id,role));`)
  await db.exec(migration)
  return db
}
async function seed(db, { status='approved', role='admin', confirmed=true }={}) {
  await db.query('insert into auth.users values($1,$2,$3)', [uid,'staff@example.invalid',confirmed ? new Date() : null])
  await db.query('insert into public.staff_invitations(email,role,status) values($1,$2,$3)', ['staff@example.invalid',role,status])
}
async function claim(db,id=uid) {
  return (await db.query('select public.complete_staff_invitation($1) as role',[id])).rows[0].role
}
test('staff SQL: verified approved email is atomically provisioned, idempotent, and accepted expiry does not block login', async () => {
  const db=await fixture()
  try {
    await seed(db)
    assert.equal(await claim(db),'admin')
    assert.equal(await claim(db),'admin')
    assert.equal((await db.query('select count(*)::int n from public.users')).rows[0].n,1)
    assert.equal((await db.query('select role from public.user_roles')).rows[0].role,'admin')
    await db.exec("update public.staff_invitations set expires_at=now()-interval '1 day'")
    assert.equal(await claim(db),'admin')
    await db.exec('delete from public.user_roles')
    assert.equal(await claim(db),null, 'accepted invitation cannot recreate removed staff access')
  } finally { await db.close() }
})
test('staff SQL: expired, revoked, unverified and unapproved identities receive no role', async () => {
  const db=await fixture()
  try {
    await seed(db,{confirmed:false})
    assert.equal(await claim(db),null)
    await db.exec("update auth.users set email_confirmed_at=now(); update public.staff_invitations set expires_at=now()-interval '1 day'")
    assert.equal(await claim(db),null)
    await db.exec("update public.staff_invitations set expires_at=now()+interval '1 day',status='revoked'")
    assert.equal(await claim(db),null)
    await db.query('insert into auth.users values($1,$2,now())',[other,'other@example.invalid'])
    assert.equal(await claim(db,other),null)
    assert.equal((await db.query('select count(*)::int n from public.users')).rows[0].n,0)
  } finally { await db.close() }
})
test('staff SQL: parent/different role conflicts never elevate, teacher roles supported', async () => {
  const db=await fixture()
  try {
    await seed(db,{role:'teacher'})
    await db.query("insert into public.users(auth_user_id,email,role) values($1,'staff@example.invalid','parent')",[uid])
    assert.equal(await claim(db),null)
    assert.equal((await db.query('select role from public.users')).rows[0].role,'parent')
    await db.exec('delete from public.users')
    await db.query("insert into public.user_roles(user_id,role) values($1,'parent')",[uid])
    assert.equal(await claim(db),null)
    await db.exec('delete from public.user_roles')
    assert.equal(await claim(db),'teacher')
    assert.equal((await db.query('select role from public.user_roles')).rows[0].role,'teacher')
  } finally { await db.close() }
})
test('staff SQL: persistent throttle blocks repeat/eleventh request and unknown email', async () => {
  const db=await fixture()
  try {
    await seed(db)
    const request=async(email='staff@example.invalid') => (await db.query('select public.reserve_staff_signin($1) as id',[email])).rows[0].id
    assert.ok(await request()); assert.equal(await request(),null)
    assert.equal(await request('unknown@example.invalid'),null)
    for(let i=1;i<10;i++) { await db.exec("update public.staff_invitations set last_requested_at=now()-interval '61 seconds'"); assert.ok(await request()) }
    await db.exec("update public.staff_invitations set last_requested_at=now()-interval '61 seconds'")
    assert.equal(await request(),null)
    await db.exec("update public.staff_invitations set request_day=current_date-1")
    assert.ok(await request())
  } finally { await db.close() }
})
test('staff SQL: service-only RPC/table privileges and RLS deny public access',async()=>{
  const db=await fixture()
  try {
    for(const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`)
      await assert.rejects(db.query('select * from public.staff_invitations'),/permission denied/)
      await assert.rejects(db.query("select public.reserve_staff_signin('staff@example.invalid')"),/permission denied/)
      await assert.rejects(claim(db),/permission denied/)
      await db.exec('reset role')
    }
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.staff_invitations'::regclass")).rows[0].relrowsecurity,true)
  } finally { await db.close() }
})
function load(file,modules) {
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const exports={}; new Function('require','exports',js)(name=>{ if (!(name in modules)) throw Error(name); return modules[name] },exports); return exports
}
function deliveryHarness({reserved=true,fail=false,existing=false}={}) {
  const calls=[]
  const db={rpc:async(name,args)=>{calls.push([name,args]);return {data:reserved?'invitation':null}},auth:{admin:{generateLink:async(args)=>{
    calls.push(['generate',args]); if(existing&&args.type==='invite')return {error:{message:'existing'}}
    return {data:{properties:{hashed_token:'a'.repeat(64),verification_type:args.type}}}
  }}},from:()=>({update:value=>({eq:async()=>{calls.push(['status',value])}})})}
  const lib=load('lib/staff-invitations.ts',{'server-only':{},'@/lib/supabase/service':{supabaseService:()=>db},'@/lib/resend':{emailFrom:'test@example.invalid',getResend:()=>({emails:{send:async(value)=>{calls.push(['send',value]);return {error:fail?{message:'failed'}:null}}}})}})
  return {lib,calls}
}
test('delivery uses approved reservation, canonical fragment link, existing-user fallback, no pre-verification profile write',async()=>{
  const old=process.env.NEXT_PUBLIC_SITE_URL;process.env.NEXT_PUBLIC_SITE_URL='https://preview.example.invalid/base'
  try {
    const {lib,calls}=deliveryHarness({existing:true})
    await lib.requestStaffLink('staff@example.invalid')
    assert.equal(calls.filter(x=>x[0]==='generate').length,2)
    const mail=calls.find(x=>x[0]==='send')[1]
    assert.match(mail.text,/https:\/\/preview.example.invalid\/auth\/confirm#token_hash=/)
    assert.match(mail.text,/type=magiclink/)
    assert.deepEqual(calls.at(-1),['status',{delivery_status:'sent'}])
    assert.ok(!calls.some(x=>x[0]==='complete_staff_invitation'))
    const denied=deliveryHarness({reserved:false});await denied.lib.requestStaffLink('unknown@example.invalid');assert.equal(denied.calls.length,1)
    const failed=deliveryHarness({fail:true});await failed.lib.requestStaffLink('staff@example.invalid');assert.deepEqual(failed.calls.at(-1),['status',{delivery_status:'failed'}])
    process.env.NEXT_PUBLIC_SITE_URL='http://unsafe.invalid';assert.throws(()=>lib.staffSiteOrigin())
  } finally { if(old===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=old }
})
test('staff confirmation verifies OTP before claiming and signs out failed admission; Admin mutations require Admin',async()=>{
  const calls=[]
  let accepted=false
  const exports=load('actions/staff-auth.ts',{
    zod:await import('zod'),'next/cache':{revalidatePath:()=>{}},'@/lib/auth/require-admin':{requireAdmin:async()=>{throw Error('denied')}},
    '@/lib/supabase/service':{supabaseService:()=>{throw Error('must not access')}},
    '@/lib/supabase/server':{supabaseAuthServer:async()=>({auth:{verifyOtp:async()=>{calls.push('verify');return {}},getUser:async()=>{calls.push('user');return {data:{user:{id:uid}}}},signOut:async()=>{calls.push('signout')}}})},
    '@/lib/staff-invitations':{staffRequestMessage:'generic',requestStaffLink:async()=>{},claimStaffInvitation:async()=>{calls.push('claim');return accepted?'admin':null}},
  })
  const form=new FormData();form.set('token_hash','a'.repeat(64));form.set('type','invite')
  assert.match(await exports.confirmStaffSignIn('',form),/unavailable/)
  assert.deepEqual(calls,['verify','user','claim','signout'])
  calls.length=0;accepted=true;assert.equal(await exports.confirmStaffSignIn('',form),'signed-in');assert.deepEqual(calls,['verify','user','claim'])
  form.set('type','recovery');calls.length=0;assert.match(await exports.confirmStaffSignIn('',form),/invalid/);assert.equal(calls.length,0)
  await assert.rejects(exports.approveStaffInvitation(new FormData()),/denied/)
  await assert.rejects(exports.withdrawStaffInvitation(new FormData()),/denied/)
  assert.equal(await exports.requestStaffSignIn('',new FormData()),'generic')
})
test('confirmation GET never consumes token; analytics excluded; login admission does not invent parent access',()=>{
  assert.doesNotMatch(fs.readFileSync('app/auth/confirm/page.tsx','utf8'),/verifyOtp|token_hash/)
  const client=fs.readFileSync('components/auth/StaffLinkConfirmation.tsx','utf8')
  assert.match(client,/window.history.replaceState/);assert.match(client,/<form action=\{action\}/)
  const callback=fs.readFileSync('app/auth/callback/route.ts','utf8')
  assert.match(callback,/profile\?\.role === "teacher"/)
  assert.match(callback,/invitation-required/)
  assert.doesNotMatch(fs.readFileSync('app/auth/redirect/route.ts','utf8'),/\.insert\(/)
  assert.match(fs.readFileSync('components/site-analytics.tsx','utf8'),/pathname.startsWith\("\/auth"\)/)
})
