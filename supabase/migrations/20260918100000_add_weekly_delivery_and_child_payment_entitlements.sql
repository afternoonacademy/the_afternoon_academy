-- Weekly delivery defaults and child-level paid attendance eligibility.
-- Applied to the shared Supabase database on 18 September 2026.

create table if not exists public.child_payment_entitlements (
  id uuid primary key default gen_random_uuid(),
  payment_entitlement_id uuid not null references public.payment_entitlements(id) on delete restrict,
  learner_id uuid not null references public.learners(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  sessions_per_week smallint not null default 1 check (sessions_per_week between 1 and 7),
  status text not null default 'paid' check (status in ('paid','review','overdue','cancelled')),
  note text,
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (learner_id, period_start, period_end)
);
create index if not exists child_payment_entitlements_eligibility_idx on public.child_payment_entitlements (learner_id, status, period_start, period_end);

alter table public.standing_placements
  add column if not exists room_code text not null default 'TAA1' check (room_code in ('TAA1')),
  add column if not exists seat_number smallint check (seat_number between 1 and 6);
create index if not exists standing_placements_weekly_seat_idx on public.standing_placements (weekday, table_number, seat_number) where status = 'active';

create table if not exists public.weekly_table_templates (
  id uuid primary key default gen_random_uuid(),
  room_code text not null default 'TAA1' check (room_code in ('TAA1')),
  weekday smallint not null check (weekday between 0 and 6),
  table_number smallint not null check (table_number between 1 and 2),
  starts_at time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 360),
  teacher_name text,
  focus text not null default 'General homework support',
  status text not null default 'active' check (status in ('active','paused')),
  effective_from date not null default current_date,
  effective_to date,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);
create index if not exists weekly_table_templates_lookup_idx on public.weekly_table_templates (weekday, table_number, effective_from, effective_to) where status = 'active';

alter table public.child_payment_entitlements enable row level security;
alter table public.weekly_table_templates enable row level security;
revoke all on table public.child_payment_entitlements, public.weekly_table_templates from anon, authenticated;
grant all on table public.child_payment_entitlements, public.weekly_table_templates to service_role;
