alter table public.child_leads
  add column if not exists pipeline_status text not null default 'new';

alter table public.child_leads
  drop constraint if exists child_leads_pipeline_status_check;
alter table public.child_leads
  add constraint child_leads_pipeline_status_check
  check (pipeline_status in ('new','session_planned','contacted','paid','waitlist','closed'));

alter table public.accepted_bookings
  add column if not exists weekly_table_template_id uuid references public.weekly_table_templates(id) on delete restrict,
  add column if not exists session_price_plan_id uuid references public.session_price_plans(id) on delete restrict;

alter table public.accepted_bookings
  drop constraint if exists accepted_bookings_status_check;
alter table public.accepted_bookings
  add constraint accepted_bookings_status_check
  check (status in ('session_planned','contacted','accepted_awaiting_payment','paid_active','cancelled'));

drop index if exists public.accepted_bookings_academy_schedule_idx;
create index accepted_bookings_academy_schedule_idx
  on public.accepted_bookings(weekday,academy_table_id,starts_at,seat_number)
  where status in ('session_planned','contacted','accepted_awaiting_payment','paid_active');

drop index if exists public.accepted_bookings_current_child_slot_idx;
create unique index accepted_bookings_current_child_slot_idx
  on public.accepted_bookings(child_lead_id,weekday,academy_table_id,starts_at)
  where status in ('session_planned','contacted','accepted_awaiting_payment','paid_active');

create unique index if not exists accepted_bookings_active_seat_unique
  on public.accepted_bookings(weekday,academy_table_id,starts_at,seat_number)
  where status in ('session_planned','contacted','accepted_awaiting_payment','paid_active');

update public.child_leads cl
set pipeline_status = case
  when exists (
    select 1
    from public.learners l
    join public.child_payment_entitlements cpe on cpe.learner_id=l.id and cpe.status='paid'
    where l.child_lead_id=cl.id
  ) then 'paid'
  when exists (
    select 1 from public.accepted_bookings ab
    where ab.child_lead_id=cl.id and ab.status in ('contacted','accepted_awaiting_payment')
  ) then 'contacted'
  when exists (
    select 1 from public.accepted_bookings ab
    where ab.child_lead_id=cl.id and ab.status='session_planned'
  ) then 'session_planned'
  when exists (
    select 1 from public.parent_leads pl
    where pl.id=cl.parent_lead_id and pl.status='closed'
  ) then 'closed'
  when exists (
    select 1 from public.parent_leads pl
    where pl.id=cl.parent_lead_id and pl.status='waitlist'
  ) then 'waitlist'
  else 'new'
end;


alter table public.accepted_bookings
  add column if not exists planned_sessions jsonb,
  add column if not exists planned_amount_cents integer check (planned_amount_cents is null or planned_amount_cents >= 0),
  add column if not exists planned_period_start date,
  add column if not exists planned_period_end date,
  add column if not exists contacted_at timestamptz,
  add column if not exists contacted_by uuid references auth.users(id) on delete set null;

alter table public.accepted_bookings
  drop constraint if exists accepted_bookings_planned_sessions_array;
alter table public.accepted_bookings
  add constraint accepted_bookings_planned_sessions_array
  check (planned_sessions is null or jsonb_typeof(planned_sessions)='array') not valid;

alter table public.accepted_bookings
  drop constraint if exists accepted_bookings_planned_period_check;
alter table public.accepted_bookings
  add constraint accepted_bookings_planned_period_check
  check (
    planned_period_start is null or
    planned_period_end is null or
    planned_period_end >= planned_period_start
  ) not valid;


alter table public.email_delivery_log
  drop constraint if exists email_delivery_log_email_kind_check;
alter table public.email_delivery_log
  add constraint email_delivery_log_email_kind_check
  check (email_kind in ('place_offer','planned_place','payment_confirmed','portal_access','learning_update','renewal_reminder'));
