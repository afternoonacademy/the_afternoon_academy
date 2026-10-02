-- Renewal quotations are built from individual dated sessions, not a manually entered total.
alter table public.weekly_table_templates
  add column if not exists session_price_cents integer check (session_price_cents is null or session_price_cents >= 0);

alter table public.renewal_cases
  add column if not exists selected_sessions jsonb,
  add column if not exists selected_session_count integer check (selected_session_count is null or selected_session_count >= 0);
