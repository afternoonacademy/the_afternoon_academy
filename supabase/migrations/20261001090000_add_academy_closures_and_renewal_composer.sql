-- Academy-wide closure dates and a human-reviewed renewal email composer.
-- These records are internal operational data and are not exposed through the Data API.

create table if not exists public.academy_closures (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  reason text not null check (char_length(trim(reason)) between 2 and 160),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists academy_closures_dates_idx on public.academy_closures (starts_on, ends_on);
create trigger academy_closures_set_updated_at before update on public.academy_closures for each row execute function public.set_updated_at();
alter table public.academy_closures enable row level security;
revoke all on table public.academy_closures from anon, authenticated;
grant all on table public.academy_closures to service_role;

create table if not exists public.academy_email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique check (template_key in ('renewal_reminder')),
  subject_template text not null check (char_length(subject_template) between 2 and 200),
  body_template text not null check (char_length(body_template) between 2 and 12000),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger academy_email_templates_set_updated_at before update on public.academy_email_templates for each row execute function public.set_updated_at();
alter table public.academy_email_templates enable row level security;
revoke all on table public.academy_email_templates from anon, authenticated;
grant all on table public.academy_email_templates to service_role;

alter table public.renewal_cases
  add column if not exists proposed_period_start date,
  add column if not exists proposed_period_end date,
  add column if not exists proposed_amount_cents integer check (proposed_amount_cents is null or proposed_amount_cents >= 0),
  add column if not exists proposed_service_dates jsonb,
  add column if not exists draft_subject text check (draft_subject is null or char_length(draft_subject) between 2 and 200),
  add column if not exists draft_body text check (draft_body is null or char_length(draft_body) between 2 and 12000),
  add column if not exists provisional_delivery_until date,
  add column if not exists provisional_delivery_enabled_at timestamptz,
  add column if not exists provisional_delivery_enabled_by uuid references auth.users(id) on delete set null;

alter table public.email_delivery_log
  add column if not exists subject text,
  add column if not exists body_text text;

alter table public.email_delivery_log drop constraint if exists email_delivery_log_email_kind_check;
alter table public.email_delivery_log add constraint email_delivery_log_email_kind_check
  check (email_kind in ('place_offer','payment_confirmed','portal_access','learning_update','renewal_reminder'));

alter table public.delivery_seats drop constraint if exists delivery_seats_status_check;
alter table public.delivery_seats add constraint delivery_seats_status_check
  check (status in ('scheduled', 'payment_pending', 'not_attending', 'cancelled'));

drop index if exists public.delivery_seats_active_seat_unique;
create unique index delivery_seats_active_seat_unique
  on public.delivery_seats (delivery_session_id, seat_number)
  where status in ('scheduled', 'payment_pending');

drop index if exists public.delivery_seats_active_learner_unique;
create unique index delivery_seats_active_learner_unique
  on public.delivery_seats (delivery_session_id, learner_id)
  where status in ('scheduled', 'payment_pending');
