import Link from "next/link"
import { requireCapability } from "@/lib/auth/require-capability"
import { guidePosts } from "@/lib/content/guide-posts"
import { saveGuidePost,publishGuidePost } from "@/actions/guide-posts"
export const dynamic="force-dynamic"
export default async function Page({searchParams}:{searchParams:Promise<{edit?:string;saved?:string}>}){
  await requireCapability("manage_setup")
  const params=await searchParams
  let posts:Awaited<ReturnType<typeof guidePosts>>=[]
  let unavailable=false
  try{posts=await guidePosts()}catch{unavailable=true}
  const current=posts.find(p=>p.id===params.edit)
  const cls="block w-full rounded-xl border bg-white px-3 py-2 text-sm"
  const item=(name:string,label:string,kind:"input"|"textarea"="input",required=true)=>(
    <label key={name} className="block space-y-1 text-sm font-semibold"><span>{label}</span>
      {kind==="textarea"?<textarea name={name} defaultValue={String(current?.[name as keyof typeof current]||"")} rows={name.startsWith("body")?10:3} className={cls} required={required}/>:
      <input name={name} defaultValue={String(current?.[name as keyof typeof current]||"")} className={cls} required={required}/>}
    </label>)
  return <div className="mx-auto max-w-5xl space-y-6 pb-12">
    <header className="brand-hero p-6"><p className="brand-kicker">Editorial workspace</p><h1 className="mt-2 text-3xl font-bold">Content Manager</h1><p className="mt-3 text-sm">Write, review and publish parent resources in English and Spanish. Publication is always a separate action. This preview uses the existing Academy database, so do not publish experimental content.</p></header>
    {unavailable?<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5"><b>Editorial database not yet configured.</b><p className="mt-2 text-sm">The additive migration is awaiting an isolated test environment and release approval. Existing Guides remain available.</p></div>:<>
    {params.saved&&<p role="status" className="rounded-xl border bg-green-50 p-3">Content saved successfully.</p>}
    <section className="brand-card p-5"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">Articles</h2><Link href="/admin/content" className="text-sm underline">New article</Link></div>
      <div className="mt-4 space-y-2">{posts.length===0?<p className="text-sm text-muted-foreground">No articles added through Content Manager yet.</p>:posts.map(p=><Link key={p.id} href={"/admin/content?edit="+p.id} className="block rounded-xl border p-3 hover:bg-slate-50"><b>{p.title_en}</b><span className="ml-3 text-xs text-muted-foreground">{p.category} · {p.status}</span></Link>)}</div>
    </section>
    <form action={saveGuidePost} className="brand-card space-y-4 p-5">
      <h2 className="text-xl font-bold">{current?"Edit article":"New article"}</h2>
      <input name="id" type="hidden" value={current?.id||""}/>
      {item("slug","URL slug")}
      <label className="block space-y-1 text-sm font-semibold"><span>Category</span><select name="category" defaultValue={current?.category||"resources"} className={cls}><option value="resources">Parent resources</option><option value="supports">Academic support</option><option value="neighbourhoods">Neighbourhood guides</option></select></label>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4"><h3 className="font-bold">English</h3>{item("title_en","Title")}{item("summary_en","Summary","textarea")}{item("body_en","Article text","textarea")}</div>
        <div className="space-y-4"><h3 className="font-bold">Español</h3>{item("title_es","Título")}{item("summary_es","Resumen","textarea")}{item("body_es","Texto del artículo","textarea")}</div>
      </div>
      {item("image_path","Approved image path (optional)","input",false)}
      {item("source_url","Research/source HTTPS URL (optional)","input",false)}
      <p className="text-xs text-muted-foreground">Use plain text and paragraph breaks. HTML is never interpreted. Image path must refer to an existing approved /images/ asset. Saving a published article returns it to draft and removes it from the public pages until you explicitly publish again. Existing article slugs cannot be changed. Save, then use publication controls below.</p>
      <button className="rounded-xl bg-[#26345f] px-5 py-3 font-semibold text-white">Save article</button>
    </form>
    {current&&<section className="brand-card space-y-4 p-5"><h2 className="text-xl font-bold">Review & publish</h2>
      <details><summary className="cursor-pointer font-semibold">English preview</summary><article className="mt-4 space-y-4 rounded-xl border p-4"><h3 className="text-2xl font-bold">{current.title_en}</h3><p>{current.summary_en}</p><p className="whitespace-pre-wrap leading-7">{current.body_en}</p></article></details>
      <details><summary className="cursor-pointer font-semibold">Vista previa en español</summary><article className="mt-4 space-y-4 rounded-xl border p-4"><h3 className="text-2xl font-bold">{current.title_es}</h3><p>{current.summary_es}</p><p className="whitespace-pre-wrap leading-7">{current.body_es}</p></article></details>
      <form action={publishGuidePost}><input name="id" type="hidden" value={current.id}/><input name="status" type="hidden" value={current.status==="published"?"draft":"published"}/><button className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">{current.status==="published"?"Unpublish article":"Publish both languages"}</button></form>
      {current.status==="published"&&<Link className="text-sm underline" href={"/guide/posts/"+current.slug}>View published article</Link>}
    </section>}
    </>}
  </div>
}
