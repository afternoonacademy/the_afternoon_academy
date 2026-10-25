-- Per-child dated teaching time, never a new Academy-wide table session.
create table public.delivery_seat_time_overrides (
  delivery_seat_id uuid primary key references public.delivery_seats(id) on delete cascade,
  allocated_starts_at time not null,
  actual_starts_at time,
  time_tbc boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint time_override_not_both check (not (time_tbc and actual_starts_at is not null))
);
create table public.delivery_seat_time_override_audit (
  id uuid primary key default gen_random_uuid(),
  delivery_seat_id uuid not null references public.delivery_seats(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  previous_starts_at time,
  new_starts_at time,
  previous_tbc boolean not null,
  new_tbc boolean not null,
  changed_at timestamptz not null default now()
);
create index delivery_seat_time_audit_seat_idx on public.delivery_seat_time_override_audit(delivery_seat_id,changed_at desc);
alter table public.delivery_seat_time_overrides enable row level security;
alter table public.delivery_seat_time_override_audit enable row level security;
revoke all on public.delivery_seat_time_overrides from anon, authenticated;
revoke all on public.delivery_seat_time_override_audit from anon, authenticated;
