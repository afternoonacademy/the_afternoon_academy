alter table public.renewal_cases
  add column if not exists proposed_session_price_plan_id uuid references public.session_price_plans(id) on delete restrict;

create index if not exists renewal_cases_proposed_session_price_plan_idx
  on public.renewal_cases(proposed_session_price_plan_id);
