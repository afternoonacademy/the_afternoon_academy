-- Standing timetable and manual monthly payment entitlement.
-- Payment authorises a standing place; attendance remains a delivery record.

create table public.payment_entitlements (
  id uuid primary key default gen_random_uuid(),
  parent_lead_id uuid not null references public.parent_leads(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  sessions_per_week smallint not null check (sessions_per_week between 1 and 7),
  status text not null default 'paid' check (status in ('paid', 'review', 'overdue', 'cancelled')),
  amount_cents integer check (amount_cents >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  received_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create unique index payment_entitlements_parent_period_unique
  on public.payment_entitlements(parent_lead_id, period_start, period_end);

create table public.standing_placements (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  table_number smallint not null check (table_number between 1 and 2),
  starts_at time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 360),
  teacher_name text check (char_length(teacher_name) between 1 and 160),
  focus text check (char_length(focus) <= 500),
  effective_from date not null,
  effective_to date,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create index standing_placements_active_idx
  on public.standing_placements(learner_id, weekday, effective_from)
  where status = 'active';

create trigger standing_placements_set_updated_at
before update on public.standing_placements
for each row execute function public.set_updated_at();

alter table public.payment_entitlements enable row level security;
alter table public.standing_placements enable row level security;
revoke all on public.payment_entitlements, public.standing_placements from anon, authenticated;

-- Repair the legacy enrolment path: older child leads may not have a stored first name.
create or replace function public.enrol_paid_children(
  p_parent_lead_id uuid,
  p_child_lead_ids uuid[],
  p_actor_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_child record;
  v_existing record;
  v_count integer := 0;
begin
  if coalesce(array_length(p_child_lead_ids, 1), 0) = 0 then
    raise exception 'Select at least one child to enrol';
  end if;

  for v_child in
    select id, first_name, school_year
    from public.child_leads
    where parent_lead_id = p_parent_lead_id
      and id = any(p_child_lead_ids)
  loop
    if v_child.first_name is null then
      select id, first_name into v_existing
      from public.learners
      where parent_lead_id = p_parent_lead_id
        and child_lead_id is null
      order by created_at
      limit 1
      for update;

      if not found then
        raise exception 'This older enquiry needs the child''s first name before enrolment';
      end if;

      update public.child_leads set first_name = v_existing.first_name where id = v_child.id;
      update public.learners set child_lead_id = v_child.id, status = 'active' where id = v_existing.id;
    else
      insert into public.learners(parent_lead_id, child_lead_id, first_name, year_group, status, parent_information_confirmed)
      values(p_parent_lead_id, v_child.id, v_child.first_name, v_child.school_year, 'active', true)
      on conflict (child_lead_id) where child_lead_id is not null do nothing;
    end if;
    v_count := v_count + 1;
  end loop;

  if v_count <> array_length(p_child_lead_ids, 1) then
    raise exception 'One or more selected children do not belong to this family lead';
  end if;

  update public.parent_leads
  set status = 'converted', payment_confirmed_at = coalesce(payment_confirmed_at, now()),
      payment_confirmed_by = coalesce(payment_confirmed_by, p_actor_id),
      enrolled_at = coalesce(enrolled_at, now()), enrolled_by = coalesce(enrolled_by, p_actor_id)
  where id = p_parent_lead_id;
  return v_count;
end;
$$;