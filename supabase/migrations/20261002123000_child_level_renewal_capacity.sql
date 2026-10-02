alter table public.renewal_cases
  add column if not exists learner_id uuid references public.learners(id) on delete restrict,
  add column if not exists standing_placement_id uuid references public.standing_placements(id) on delete restrict,
  add column if not exists capacity_released_at timestamptz,
  add column if not exists capacity_released_by uuid references auth.users(id) on delete set null,
  add column if not exists capacity_release_reason text;

alter table public.renewal_cases
  drop constraint if exists renewal_cases_capacity_release_reason_check;
alter table public.renewal_cases
  add constraint renewal_cases_capacity_release_reason_check
  check (capacity_release_reason is null or char_length(capacity_release_reason) <= 500);

alter table public.renewal_cases
  drop constraint if exists renewal_cases_parent_lead_id_source_payment_entitlement_id_key;

drop index if exists public.renewal_cases_parent_lead_id_source_payment_entitlement_id_key;

create unique index if not exists renewal_cases_legacy_source_unique
  on public.renewal_cases(parent_lead_id,source_payment_entitlement_id)
  where learner_id is null;

create unique index if not exists renewal_cases_learner_source_unique
  on public.renewal_cases(learner_id,source_payment_entitlement_id)
  where learner_id is not null;

create index if not exists renewal_cases_learner_status_idx
  on public.renewal_cases(learner_id,status,due_on);
