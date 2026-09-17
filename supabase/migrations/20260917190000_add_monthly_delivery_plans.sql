-- Monthly delivery planning with date-specific TAA1 sessions and seats.
-- Existing recurring sessions and learner records remain untouched.

create table public.monthly_delivery_plans (
  id uuid primary key default gen_random_uuid(),
  month_start date not null check (month_start = date_trunc('month', month_start)::date),
  weekday smallint not null check (weekday between 0 and 6),
  table_number smallint not null check (table_number between 1 and 2),
  starts_at time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 360),
  teacher_name text check (char_length(teacher_name) between 1 and 160),
  focus text check (char_length(focus) <= 500),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (month_start, weekday, table_number)
);

create table public.delivery_sessions (
  id uuid primary key default gen_random_uuid(),
  monthly_plan_id uuid references public.monthly_delivery_plans(id) on delete set null,
  service_date date not null,
  table_number smallint not null check (table_number between 1 and 2),
  starts_at time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 360),
  teacher_name text check (char_length(teacher_name) between 1 and 160),
  focus text check (char_length(focus) <= 500),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  cancellation_note text check (char_length(cancellation_note) <= 500),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_date, table_number)
);

create table public.delivery_seats (
  id uuid primary key default gen_random_uuid(),
  delivery_session_id uuid not null references public.delivery_sessions(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete restrict,
  seat_number smallint not null check (seat_number between 1 and 6),
  status text not null default 'scheduled' check (status in ('scheduled', 'not_attending', 'cancelled')),
  note text check (char_length(note) <= 500),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index delivery_sessions_date_table_unique
  on public.delivery_sessions (service_date, table_number);
create unique index delivery_seats_active_seat_unique
  on public.delivery_seats (delivery_session_id, seat_number)
  where status = 'scheduled';
create unique index delivery_seats_active_learner_unique
  on public.delivery_seats (delivery_session_id, learner_id)
  where status = 'scheduled';
create index delivery_sessions_date_idx on public.delivery_sessions (service_date);
create index delivery_seats_session_idx on public.delivery_seats (delivery_session_id, status);

create trigger monthly_delivery_plans_set_updated_at before update on public.monthly_delivery_plans
for each row execute function public.set_updated_at();
create trigger delivery_sessions_set_updated_at before update on public.delivery_sessions
for each row execute function public.set_updated_at();
create trigger delivery_seats_set_updated_at before update on public.delivery_seats
for each row execute function public.set_updated_at();

alter table public.monthly_delivery_plans enable row level security;
alter table public.delivery_sessions enable row level security;
alter table public.delivery_seats enable row level security;
revoke all on public.monthly_delivery_plans, public.delivery_sessions, public.delivery_seats from anon, authenticated;

alter table public.attendance_records
  add column if not exists delivery_session_id uuid
  references public.delivery_sessions(id) on delete set null;

create index if not exists attendance_records_delivery_session_idx
  on public.attendance_records (delivery_session_id, learner_id);