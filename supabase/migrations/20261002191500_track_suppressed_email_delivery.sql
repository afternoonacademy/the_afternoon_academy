alter table public.email_delivery_log
  drop constraint if exists email_delivery_log_status_check;

alter table public.email_delivery_log
  add constraint email_delivery_log_status_check
  check (status in ('pending','sent','delivered','delayed','bounced','failed','suppressed'));
