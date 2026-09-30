-- Daily delivery overrides keep the recurring timetable as a default.
-- All fields are optional so a date only stores what is different.

create table public.session_date_overrides (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.academy_sessions(id) on delete cascade,
  service_date date not null,
  teacher_name text check (char_length(teacher_name) between 1 and 160),
  focus text check (char_length(focus) <= 500),
  starts_at time,
  duration_minutes integer check (duration_minutes between 15 and 360),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, service_date)
);

create index session_date_overrides_date_idx
  on public.session_date_overrides (service_date);

create trigger session_date_overrides_set_updated_at
before update on public.session_date_overrides
for each row execute function public.set_updated_at();

alter table public.session_date_overrides enable row level security;
revoke all on public.session_date_overrides from anon, authenticated;