create table public.learner_goal_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  goal_id uuid not null references public.learner_goals(id) on delete cascade,
  occurred_on date not null default current_date,
  progress_state text not null check (progress_state in ('no_change','progressing','achieved','needs_review')),
  note text check (char_length(note) <= 1000),
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index learner_goal_progress_goal_date_idx
  on public.learner_goal_progress(goal_id, occurred_on desc, created_at desc);
create index learner_goal_progress_learner_date_idx
  on public.learner_goal_progress(learner_id, occurred_on desc, created_at desc);
create index learner_goal_progress_recorded_by_idx
  on public.learner_goal_progress(recorded_by);

alter table public.learner_goal_progress enable row level security;
revoke all on public.learner_goal_progress from anon, authenticated;
grant select, insert, update, delete on public.learner_goal_progress to service_role;
