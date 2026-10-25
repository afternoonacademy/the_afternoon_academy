-- Exact dated service sessions become the paid-period source of truth.
-- period_start / period_end remain derived summary fields for compatibility and audit.

alter table public.payment_entitlements
  add column if not exists selected_sessions jsonb,
  add column if not exists selected_session_count integer
    check (selected_session_count is null or selected_session_count >= 0);

alter table public.child_payment_entitlements
  add column if not exists selected_sessions jsonb,
  add column if not exists selected_session_count integer
    check (selected_session_count is null or selected_session_count >= 0);

alter table public.payment_entitlements
  add constraint payment_entitlements_selected_sessions_array
  check (selected_sessions is null or jsonb_typeof(selected_sessions) = 'array') not valid;

alter table public.child_payment_entitlements
  add constraint child_payment_entitlements_selected_sessions_array
  check (selected_sessions is null or jsonb_typeof(selected_sessions) = 'array') not valid;
