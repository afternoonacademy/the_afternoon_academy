-- Lead-to-Placement Flow v1: auditable, atomic session offers and acceptance.

alter table public.parent_leads
  drop constraint if exists parent_leads_status_check;

alter table public.parent_leads
  add constraint parent_leads_status_check
  check (status in ('new', 'warm', 'priority', 'contacted', 'offer_sent', 'waitlist', 'converted', 'closed'));

alter table public.parent_leads
  add column if not exists offer_sent_at timestamptz,
  add column if not exists offer_sent_by uuid references auth.users(id) on delete set null,
  add column if not exists enrolled_at timestamptz,
  add column if not exists enrolled_by uuid references auth.users(id) on delete set null;

alter table public.session_placements
  add column if not exists offered_at timestamptz,
  add column if not exists offered_by uuid references auth.users(id) on delete set null,
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_by uuid references auth.users(id) on delete set null,
  add column if not exists ended_at timestamptz,
  add column if not exists ended_by uuid references auth.users(id) on delete set null;

create or replace function public.send_session_offer(
  p_placement_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_learner_id uuid;
  v_parent_lead_id uuid;
  v_status text;
begin
  select learner_id, status
    into v_learner_id, v_status
    from public.session_placements
    where id = p_placement_id
    for update;

  if not found then
    raise exception 'Placement not found';
  end if;

  if v_status not in ('proposed', 'offered') then
    raise exception 'Only a proposed placement can be offered to a parent';
  end if;

  select parent_lead_id
    into v_parent_lead_id
    from public.learners
    where id = v_learner_id
    for update;

  if v_parent_lead_id is null then
    raise exception 'This learner is not linked to a parent enquiry';
  end if;

  update public.session_placements
    set status = 'offered',
        offered_at = coalesce(offered_at, now()),
        offered_by = coalesce(offered_by, p_actor_id)
    where id = p_placement_id;

  update public.parent_leads
    set status = 'offer_sent',
        offer_sent_at = coalesce(offer_sent_at, now()),
        offer_sent_by = coalesce(offer_sent_by, p_actor_id)
    where id = v_parent_lead_id;
end;
$$;

create or replace function public.accept_session_offer(
  p_placement_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_learner_id uuid;
  v_parent_lead_id uuid;
  v_status text;
  v_capacity integer;
  v_confirmed_count integer;
begin
  select p.session_id, p.learner_id, p.status, s.capacity
    into v_session_id, v_learner_id, v_status, v_capacity
    from public.session_placements p
    join public.academy_sessions s on s.id = p.session_id
    where p.id = p_placement_id
    for update of p, s;

  if not found then
    raise exception 'Placement not found';
  end if;

  if v_status <> 'offered' then
    raise exception 'Only an offered placement can be confirmed';
  end if;

  select count(*)
    into v_confirmed_count
    from public.session_placements
    where session_id = v_session_id
      and status = 'confirmed'
      and id <> p_placement_id;

  if v_confirmed_count >= v_capacity then
    raise exception 'This session is already at capacity';
  end if;

  select parent_lead_id
    into v_parent_lead_id
    from public.learners
    where id = v_learner_id
    for update;

  update public.session_placements
    set status = 'confirmed',
        accepted_at = now(),
        accepted_by = p_actor_id
    where id = p_placement_id;

  update public.learners
    set status = 'active'
    where id = v_learner_id;

  if v_parent_lead_id is not null then
    update public.parent_leads
      set status = 'converted',
          enrolled_at = now(),
          enrolled_by = p_actor_id
      where id = v_parent_lead_id;
  end if;
end;
$$;

revoke all on function public.send_session_offer(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_session_offer(uuid, uuid) from public, anon, authenticated;
grant execute on function public.send_session_offer(uuid, uuid) to service_role;
grant execute on function public.accept_session_offer(uuid, uuid) to service_role;

create index if not exists session_placements_offered_idx
  on public.session_placements (status, offered_at)
  where status = 'offered';
