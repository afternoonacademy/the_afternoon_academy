alter table public.renewal_cases
  add column offer_revision integer not null default 0 check (offer_revision >= 0),
  add column sent_offer_revision integer check (
    sent_offer_revision >= 0 and sent_offer_revision <= offer_revision
  );

alter table public.renewal_cases add column offer_operation_until timestamptz;
alter table public.renewal_cases add column offer_payment_started_at timestamptz;
