create table public.learners (
  id uuid primary key default gen_random_uuid(),
  parent_lead_id uuid unique references public.parent_leads(id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 80),
  year_group text,
  status text not null default 'active' check (status in ('active', 'paused', 'left')),
  parent_information_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.learner_profiles (
  learner_id uuid primary key references public.learners(id) on delete cascade,
  strengths text[] not null default '{}',
  interests text[] not null default '{}',
  barriers text[] not null default '{}',
  parent_priorities text,
  helpful_strategies text,
  ai_processing_status text not null default 'disabled' check (ai_processing_status = 'disabled'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'late', 'absent', 'authorised_absence')),
  note text check (char_length(note) <= 500),
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (learner_id, attendance_date)
);
create table public.teacher_updates (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  occurred_on date not null default current_date,
  what_happened text not null check (char_length(what_happened) between 2 and 2000),
  why_it_mattered text not null check (char_length(why_it_mattered) between 2 and 2000),
  next_step text not null check (char_length(next_step) between 2 and 2000),
  parent_visible boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index learners_status_idx on public.learners(status);
create index attendance_records_learner_date_idx on public.attendance_records(learner_id, attendance_date desc);
create index teacher_updates_learner_date_idx on public.teacher_updates(learner_id, occurred_on desc);
create trigger learners_set_updated_at before update on public.learners for each row execute function public.set_updated_at();
create trigger learner_profiles_set_updated_at before update on public.learner_profiles for each row execute function public.set_updated_at();
alter table public.learners enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.attendance_records enable row level security;
alter table public.teacher_updates enable row level security;
revoke all on public.learners from anon, authenticated;
revoke all on public.learner_profiles from anon, authenticated;
revoke all on public.attendance_records from anon, authenticated;
revoke all on public.teacher_updates from anon, authenticated;
