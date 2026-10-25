-- A renewal is a continuation of an active learner record, never a new sales lead.
create table if not exists public.renewal_cases (
  id uuid primary key default gen_random_uuid(),
  parent_lead_id uuid not null references public.parent_leads(id) on delete restrict,
  source_payment_entitlement_id uuid not null references public.payment_entitlements(id) on delete restrict,
  due_on date not null,
  status text not null default 'ready_to_send' check (status in ('ready_to_send','awaiting_payment','overdue','renewed','not_renewing')),
  email_sent_at timestamptz,
  last_contact_at timestamptz,
  next_action_at timestamptz,
  outcome_note text check (char_length(outcome_note) <= 500),
  renewed_at timestamptz,
  closed_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_lead_id, source_payment_entitlement_id)
);

create index if not exists renewal_cases_queue_idx on public.renewal_cases(status, due_on);
alter table public.renewal_cases enable row level security;
revoke all on table public.renewal_cases from anon, authenticated;
grant all on table public.renewal_cases to service_role;
create trigger renewal_cases_set_updated_at before update on public.renewal_cases for each row execute function public.set_updated_at();

alter table public.email_delivery_log drop constraint if exists email_delivery_log_email_kind_check;
alter table public.email_delivery_log add constraint email_delivery_log_email_kind_check
  check (email_kind in ('place_offer','payment_confirmed','portal_access','learning_update','renewal_reminder'));
