-- Revised launch operations: lead-first offers, TAA1 timetable and Tutor Room bookings.

alter table public.child_leads
  add column if not exists first_name text check (char_length(first_name) between 1 and 80);

create table public.session_offers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.academy_sessions(id) on delete cascade,
  parent_lead_id uuid not null references public.parent_leads(id) on delete cascade,
  learner_first_name text not null check (char_length(learner_first_name) between 1 and 80),
  learner_year_group text check (char_length(learner_year_group) <= 80),
  status text not null default 'proposed' check (status in ('proposed', 'offered', 'confirmed', 'waitlisted', 'ended')),
  fit_note text check (char_length(fit_note) <= 1000),
  created_by uuid references auth.users(id) on delete set null,
  offered_at timestamptz,
  offered_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, parent_lead_id)
);

create index session_offers_session_status_idx on public.session_offers(session_id, status);
create index session_offers_parent_lead_idx on public.session_offers(parent_lead_id, status);
create trigger session_offers_set_updated_at before update on public.session_offers
for each row execute function public.set_updated_at();
alter table public.session_offers enable row level security;
revoke all on public.session_offers from anon, authenticated;

create extension if not exists btree_gist;
create table public.tutor_room_bookings (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references public.learners(id) on delete set null,
  parent_lead_id uuid references public.parent_leads(id) on delete set null,
  teacher_name text not null check (char_length(teacher_name) between 1 and 160),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text check (char_length(note) <= 1000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (learner_id is not null or parent_lead_id is not null),
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
);

create index tutor_room_bookings_starts_at_idx on public.tutor_room_bookings(starts_at);
create trigger tutor_room_bookings_set_updated_at before update on public.tutor_room_bookings
for each row execute function public.set_updated_at();
alter table public.tutor_room_bookings enable row level security;
revoke all on public.tutor_room_bookings from anon, authenticated;

create or replace function public.send_lead_session_offer(p_offer_id uuid, p_actor_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_parent_lead_id uuid; v_status text;
begin
  select parent_lead_id, status into v_parent_lead_id, v_status from public.session_offers where id = p_offer_id for update;
  if not found then raise exception 'Offer not found'; end if;
  if v_status not in ('proposed', 'offered') then raise exception 'Only a proposed offer can be sent'; end if;
  update public.session_offers set status = 'offered', offered_at = coalesce(offered_at, now()), offered_by = coalesce(offered_by, p_actor_id) where id = p_offer_id;
  update public.parent_leads set status = 'offer_sent', offer_sent_at = coalesce(offer_sent_at, now()), offer_sent_by = coalesce(offer_sent_by, p_actor_id) where id = v_parent_lead_id;
end; $$;

create or replace function public.accept_lead_session_offer(p_offer_id uuid, p_actor_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session_id uuid; v_parent_lead_id uuid; v_first_name text; v_year_group text; v_status text; v_capacity integer; v_confirmed integer; v_learner_id uuid;
begin
  select o.session_id, o.parent_lead_id, o.learner_first_name, o.learner_year_group, o.status, s.capacity into v_session_id, v_parent_lead_id, v_first_name, v_year_group, v_status, v_capacity from public.session_offers o join public.academy_sessions s on s.id=o.session_id where o.id=p_offer_id for update of o, s;
  if not found then raise exception 'Offer not found'; end if;
  if v_status <> 'offered' then raise exception 'Only an offered place can be confirmed'; end if;
  select count(*) into v_confirmed from public.session_placements where session_id=v_session_id and status='confirmed';
  if v_confirmed >= v_capacity then raise exception 'This TAA1 slot is already at capacity'; end if;
  select id into v_learner_id from public.learners where parent_lead_id=v_parent_lead_id for update;
  if v_learner_id is null then
    insert into public.learners(parent_lead_id, first_name, year_group, status, parent_information_confirmed) values(v_parent_lead_id, v_first_name, v_year_group, 'active', true) returning id into v_learner_id;
  else
    update public.learners set status='active' where id=v_learner_id;
  end if;
  insert into public.session_placements(session_id, learner_id, status, created_by, accepted_at, accepted_by) values(v_session_id, v_learner_id, 'confirmed', p_actor_id, now(), p_actor_id) on conflict (session_id, learner_id) do update set status='confirmed', accepted_at=excluded.accepted_at, accepted_by=excluded.accepted_by;
  update public.session_offers set status='confirmed', accepted_at=now(), accepted_by=p_actor_id where id=p_offer_id;
  update public.parent_leads set status='converted', enrolled_at=now(), enrolled_by=p_actor_id where id=v_parent_lead_id;
  return v_learner_id;
end; $$;

revoke all on function public.send_lead_session_offer(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_lead_session_offer(uuid, uuid) from public, anon, authenticated;
grant execute on function public.send_lead_session_offer(uuid, uuid) to service_role;
grant execute on function public.accept_lead_session_offer(uuid, uuid) to service_role;
