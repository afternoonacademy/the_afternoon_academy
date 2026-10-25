alter table public.learners
  add column current_school_name text check (char_length(current_school_name) <= 160),
  add column teacher_name text check (char_length(teacher_name) <= 160),
  add column teacher_email text check (char_length(teacher_email) <= 254),
  add column teacher_phone text check (char_length(teacher_phone) <= 50),
  add column school_contact_permission_confirmed boolean not null default false;

create table public.learner_goals (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 300),
  domain text not null check (domain in ('academic', 'confidence', 'independence', 'participation')),
  evidence text check (char_length(evidence) <= 2000),
  status text not null default 'active' check (status in ('active', 'achieved', 'paused')),
  target_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index learner_goals_learner_status_idx on public.learner_goals(learner_id, status);
create index learner_goals_created_by_idx on public.learner_goals(created_by);

create trigger learner_goals_set_updated_at before update on public.learner_goals
for each row execute function public.set_updated_at();

alter table public.learner_goals enable row level security;
revoke all on public.learner_goals from anon, authenticated;