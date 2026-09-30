-- TAA1 fixed room plan and date-linked attendance.
-- Additive: no parent, learner or attendance records are deleted or rewritten.

alter table public.academy_sessions
  add column if not exists table_number smallint
  check (table_number between 1 and 2);

create unique index if not exists academy_sessions_taa1_weekday_table_unique
  on public.academy_sessions (weekday, table_number)
  where room_name = 'TAA1'
    and table_number is not null
    and status <> 'closed';

alter table public.session_placements
  add column if not exists seat_number smallint
  check (seat_number between 1 and 6);

alter table public.session_offers
  add column if not exists seat_number smallint
  check (seat_number between 1 and 6);

create unique index if not exists session_placements_confirmed_seat_unique
  on public.session_placements (session_id, seat_number)
  where status = 'confirmed' and seat_number is not null;

alter table public.attendance_records
  add column if not exists session_id uuid
  references public.academy_sessions(id) on delete set null;

create unique index if not exists attendance_records_session_learner_date_unique
  on public.attendance_records (session_id, learner_id, attendance_date)
  where session_id is not null;

create index if not exists attendance_records_session_date_idx
  on public.attendance_records (session_id, attendance_date);

create or replace function public.accept_lead_session_offer(p_offer_id uuid, p_actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_parent_lead_id uuid;
  v_first_name text;
  v_year_group text;
  v_status text;
  v_capacity integer;
  v_seat_number smallint;
  v_confirmed integer;
  v_learner_id uuid;
begin
  select o.session_id, o.parent_lead_id, o.learner_first_name, o.learner_year_group,
         o.status, o.seat_number, s.capacity
    into v_session_id, v_parent_lead_id, v_first_name, v_year_group,
         v_status, v_seat_number, v_capacity
    from public.session_offers o
    join public.academy_sessions s on s.id = o.session_id
   where o.id = p_offer_id
   for update of o, s;

  if not found then raise exception 'Offer not found'; end if;
  if v_status <> 'offered' then raise exception 'Only an offered place can be confirmed'; end if;

  select count(*) into v_confirmed
    from public.session_placements
   where session_id = v_session_id and status = 'confirmed';
  if v_confirmed >= v_capacity then raise exception 'This TAA1 slot is already at capacity'; end if;

  if v_seat_number is not null and exists (
    select 1 from public.session_placements
     where session_id = v_session_id
       and status = 'confirmed'
       and seat_number = v_seat_number
  ) then
    raise exception 'That TAA1 seat is no longer available';
  end if;

  select id into v_learner_id
    from public.learners
   where parent_lead_id = v_parent_lead_id
   for update;

  if v_learner_id is null then
    insert into public.learners(parent_lead_id, first_name, year_group, status, parent_information_confirmed)
    values(v_parent_lead_id, v_first_name, v_year_group, 'active', true)
    returning id into v_learner_id;
  else
    update public.learners set status = 'active' where id = v_learner_id;
  end if;

  insert into public.session_placements(
    session_id, learner_id, status, seat_number, created_by, accepted_at, accepted_by
  ) values (
    v_session_id, v_learner_id, 'confirmed', v_seat_number, p_actor_id, now(), p_actor_id
  )
  on conflict (session_id, learner_id) do update
    set status = 'confirmed',
        seat_number = excluded.seat_number,
        accepted_at = excluded.accepted_at,
        accepted_by = excluded.accepted_by;

  update public.session_offers
     set status = 'confirmed', accepted_at = now(), accepted_by = p_actor_id
   where id = p_offer_id;

  update public.parent_leads
     set status = 'converted', enrolled_at = now(), enrolled_by = p_actor_id
   where id = v_parent_lead_id;

  return v_learner_id;
end;
$$;

revoke all on function public.accept_lead_session_offer(uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_lead_session_offer(uuid, uuid) to service_role;