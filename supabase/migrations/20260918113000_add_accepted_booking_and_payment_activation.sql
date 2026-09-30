-- Accepted parent place, then paid activation.
create table if not exists public.accepted_bookings (
  id uuid primary key default gen_random_uuid(),
  session_offer_id uuid unique references public.session_offers(id) on delete restrict,
  parent_lead_id uuid not null references public.parent_leads(id) on delete restrict,
  child_lead_id uuid not null references public.child_leads(id) on delete restrict,
  learner_id uuid references public.learners(id) on delete set null,
  room_code text not null default 'TAA1' check (room_code in ('TAA1')),
  table_number smallint not null check (table_number between 1 and 2),
  seat_number smallint not null check (seat_number between 1 and 6),
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 360),
  status text not null default 'accepted_awaiting_payment'
    check (status in ('accepted_awaiting_payment','paid_active','cancelled')),
  accepted_at timestamptz not null default now(),
  accepted_by uuid,
  payment_entitlement_id uuid references public.payment_entitlements(id) on delete set null,
  paid_at timestamptz,
  paid_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accepted_bookings_parent_status_idx on public.accepted_bookings (parent_lead_id, status);
create index if not exists accepted_bookings_schedule_idx on public.accepted_bookings (weekday, table_number, seat_number)
  where status in ('accepted_awaiting_payment','paid_active');
create unique index if not exists accepted_bookings_one_current_child_idx
  on public.accepted_bookings (child_lead_id)
  where status in ('accepted_awaiting_payment','paid_active');
alter table public.accepted_bookings enable row level security;
revoke all on table public.accepted_bookings from anon, authenticated;
grant all on table public.accepted_bookings to service_role;