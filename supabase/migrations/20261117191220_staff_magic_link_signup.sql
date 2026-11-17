-- Service-only staff invitations. Auth ownership is verified before any role write.
create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email))),
  name text,
  role text not null check (role in ('admin','teacher')),
  status text not null default 'approved' check (status in ('approved','accepted','revoked')),
  approved_by uuid references auth.users(id) on delete set null,
  approval_source text not null default 'admin' check (approval_source in ('admin','founder')),
  approved_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  last_requested_at timestamptz,
  request_day date,
  request_count integer not null default 0,
  delivery_status text check (delivery_status in ('sent','failed'))
);
alter table public.staff_invitations enable row level security;
revoke all on public.staff_invitations from anon, authenticated;
grant all on public.staff_invitations to service_role;
create index staff_invitations_approved_by_idx on public.staff_invitations(approved_by);
create index staff_invitations_revoked_by_idx on public.staff_invitations(revoked_by);
create index staff_invitations_accepted_by_idx on public.staff_invitations(accepted_by);
-- Teacher is the application role; retain legacy tutor values rather than rewriting them.
alter table public.user_roles drop constraint user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check check (role in ('admin','teacher','parent','tutor'));

create function public.reserve_staff_signin(p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invitation public.staff_invitations; today date := (now() at time zone 'UTC')::date;
begin
  select * into invitation from public.staff_invitations where email = p_email for update;
  if not found or invitation.status = 'revoked' then return null; end if;
  if invitation.status = 'approved' and invitation.expires_at <= now() then return null; end if;
  if invitation.status = 'accepted' and not exists (
    select 1 from public.users u join public.user_roles r on r.user_id=u.auth_user_id and r.role=u.role
    where u.auth_user_id=invitation.accepted_by and lower(u.email)=p_email and u.role=invitation.role
  ) then return null; end if;
  if invitation.last_requested_at > now() - interval '60 seconds' then return null; end if;
  if invitation.request_day = today and invitation.request_count >= 10 then return null; end if;
  update public.staff_invitations set last_requested_at=now(), request_day=today,
    request_count=case when request_day=today then request_count+1 else 1 end
    where id=invitation.id;
  return invitation.id;
end $$;

create function public.complete_staff_invitation(p_user_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare invitation public.staff_invitations; verified_email text; existing_role text;
begin
  select lower(email) into verified_email from auth.users
    where id=p_user_id and email_confirmed_at is not null;
  if verified_email is null then return null; end if;
  select * into invitation from public.staff_invitations where email=verified_email for update;
  if not found or invitation.status='revoked' then return null; end if;
  if invitation.status='approved' and invitation.expires_at <= now() then return null; end if;
  -- Serialize profile creation against another identity with the same email.
  perform pg_advisory_xact_lock(hashtextextended(verified_email,0));
  select role into existing_role from public.users where auth_user_id=p_user_id for update;
  if existing_role is not null and existing_role <> invitation.role then return null; end if;
  if exists(select 1 from public.users where lower(email)=verified_email and auth_user_id<>p_user_id)
    or exists(select 1 from public.user_roles where user_id=p_user_id and role<>invitation.role)
    then return null; end if;
  if invitation.status='accepted' then
    if invitation.accepted_by is distinct from p_user_id or existing_role is distinct from invitation.role
      or not exists(select 1 from public.user_roles where user_id=p_user_id and role=invitation.role)
      then return null; end if;
    return invitation.role;
  end if;
  insert into public.users(auth_user_id,email,name,role)
    values(p_user_id,verified_email,invitation.name,invitation.role)
    on conflict(auth_user_id) do update set auth_user_id=excluded.auth_user_id
      where public.users.role=excluded.role returning role into existing_role;
  if existing_role is distinct from invitation.role then raise exception 'Conflicting account role'; end if;
  insert into public.user_roles(user_id,role) values(p_user_id,invitation.role)
    on conflict(user_id,role) do nothing;
  update public.staff_invitations set status='accepted',accepted_by=p_user_id,accepted_at=now() where id=invitation.id;
  return invitation.role;
end $$;
revoke all on function public.reserve_staff_signin(text) from public, anon, authenticated;
revoke all on function public.complete_staff_invitation(uuid) from public, anon, authenticated;
grant execute on function public.reserve_staff_signin(text) to service_role;
grant execute on function public.complete_staff_invitation(uuid) to service_role;
