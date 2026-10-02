alter table public.email_delivery_log
  add column if not exists child_lead_id uuid references public.child_leads(id) on delete set null,
  add column if not exists learner_id uuid references public.learners(id) on delete set null,
  add column if not exists renewal_case_id uuid references public.renewal_cases(id) on delete set null,
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists last_event_at timestamptz,
  add column if not exists delivery_detail text;

alter table public.email_delivery_log
  drop constraint if exists email_delivery_log_status_check;

alter table public.email_delivery_log
  add constraint email_delivery_log_status_check
  check (status in ('pending','sent','delivered','delayed','bounced','failed'));

create index if not exists email_delivery_log_child_created_idx
  on public.email_delivery_log(child_lead_id, created_at desc);

create index if not exists email_delivery_log_learner_created_idx
  on public.email_delivery_log(learner_id, created_at desc);

create index if not exists email_delivery_log_renewal_created_idx
  on public.email_delivery_log(renewal_case_id, created_at desc);

create index if not exists email_delivery_log_resend_email_idx
  on public.email_delivery_log(resend_email_id)
  where resend_email_id is not null;

create table if not exists public.email_delivery_events (
  id text primary key,
  email_delivery_log_id uuid not null references public.email_delivery_log(id) on delete cascade,
  resend_email_id text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.email_delivery_events enable row level security;

create index if not exists email_delivery_events_log_idx
  on public.email_delivery_events(email_delivery_log_id, occurred_at desc);

create index if not exists email_delivery_events_resend_idx
  on public.email_delivery_events(resend_email_id, occurred_at desc);

comment on table public.email_delivery_events is
  'Verified Resend delivery lifecycle events. Service-role only; no open/click tracking is used by TAA.';
