alter table public.email_delivery_log
  drop constraint if exists email_delivery_log_email_kind_check;

alter table public.email_delivery_log
  add constraint email_delivery_log_email_kind_check
  check (email_kind in (
    'enquiry_acknowledgement',
    'place_offer',
    'planned_place',
    'payment_confirmed',
    'portal_access',
    'learning_update',
    'renewal_reminder'
  ));
