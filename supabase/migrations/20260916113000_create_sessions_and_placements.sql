create table public.academy_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  focus text check (char_length(focus) <= 500),
  age_range text check (char_length(age_range) <= 80),
  weekday text not null check (weekday in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  starts_at time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 360),
  teacher_name text check (char_length(teacher_name) <= 160),
  room_name text check (char_length(room_name) <= 100),
  capacity integer not null check (capacity between 1 and 40),
  status text not null default 'planning' check (status in ('planning', 'open', 'paused', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_placements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.academy_sessions(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  status text not null default 'proposed' check (status in ('proposed', 'offered', 'confirmed', 'waitlisted', 'paused', 'ended')),
  fit_note text check (char_length(fit_note) <= 1000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, learner_id)
);

create index academy_sessions_status_weekday_idx on public.academy_sessions(status, weekday, starts_at);
create index academy_sessions_created_by_idx on public.academy_sessions(created_by);
create index session_placements_session_status_idx on public.session_placements(session_id, status);
create index session_placements_learner_status_idx on public.session_placements(learner_id, status);
create index session_placements_created_by_idx on public.session_placements(created_by);

create trigger academy_sessions_set_updated_at before update on public.academy_sessions
for each row execute function public.set_updated_at();
create trigger session_placements_set_updated_at before update on public.session_placements
for each row execute function public.set_updated_at();

alter table public.academy_sessions enable row level security;
alter table public.session_placements enable row level security;
revoke all on public.academy_sessions from anon, authenticated;
revoke all on public.session_placements from anon, authenticated;
