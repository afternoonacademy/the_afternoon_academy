-- Preview-compatible family balance audit storage.
-- This is additive and keeps exact paid-session history in the existing entitlement JSON.
alter table public.parent_leads
  add column if not exists account_adjustments jsonb not null default '[]'::jsonb;

alter table public.parent_leads
  add constraint parent_leads_account_adjustments_array
  check (jsonb_typeof(account_adjustments) = 'array') not valid;
