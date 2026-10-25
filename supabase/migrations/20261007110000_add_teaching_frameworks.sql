create table public.teaching_frameworks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  slug text not null unique check (char_length(slug) between 2 and 160),
  short_description text,
  stage_guidance text,
  provision_type text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  current_version_id uuid,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teaching_framework_versions (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.teaching_frameworks(id) on delete restrict,
  version_number integer not null check (version_number >= 1),
  preparation_guidance text,
  during_session_guidance text,
  goal_guidance text,
  evidence_guidance text,
  avoid_guidance text,
  reference_resources jsonb not null default '[]'::jsonb,
  prompt_config jsonb not null default '[]'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (framework_id, version_number)
);

alter table public.teaching_frameworks
  add constraint teaching_frameworks_current_version_fk
  foreign key (current_version_id) references public.teaching_framework_versions(id) on delete set null;

create table public.learner_teaching_frameworks (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  framework_id uuid not null references public.teaching_frameworks(id) on delete restrict,
  framework_version_id uuid not null references public.teaching_framework_versions(id) on delete restrict,
  status text not null default 'active' check (status in ('active','paused','ended')),
  starts_on date not null default current_date,
  ends_on date,
  is_default boolean not null default false,
  curriculum_course text,
  exam_board text,
  current_unit_topic text,
  learner_objectives text,
  teacher_context text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create unique index learner_teaching_frameworks_one_active_default_idx
  on public.learner_teaching_frameworks(learner_id)
  where status = 'active' and is_default = true;

create index learner_teaching_frameworks_learner_status_idx
  on public.learner_teaching_frameworks(learner_id, status, starts_on desc);

create index teaching_frameworks_status_idx
  on public.teaching_frameworks(status, title);

alter table public.teacher_updates
  add column teaching_framework_id uuid references public.teaching_frameworks(id) on delete set null,
  add column teaching_framework_version_id uuid references public.teaching_framework_versions(id) on delete set null,
  add column learner_teaching_framework_id uuid references public.learner_teaching_frameworks(id) on delete set null,
  add column prompt_snapshot jsonb;

alter table public.learner_goals
  add column learner_teaching_framework_id uuid references public.learner_teaching_frameworks(id) on delete set null;

create index teacher_updates_framework_idx on public.teacher_updates(teaching_framework_id, occurred_on desc);
create index learner_goals_framework_assignment_idx on public.learner_goals(learner_teaching_framework_id);

create trigger teaching_frameworks_set_updated_at
before update on public.teaching_frameworks
for each row execute function public.set_updated_at();

create trigger learner_teaching_frameworks_set_updated_at
before update on public.learner_teaching_frameworks
for each row execute function public.set_updated_at();

alter table public.teaching_frameworks enable row level security;
alter table public.teaching_framework_versions enable row level security;
alter table public.learner_teaching_frameworks enable row level security;

revoke all on public.teaching_frameworks from anon, authenticated;
revoke all on public.teaching_framework_versions from anon, authenticated;
revoke all on public.learner_teaching_frameworks from anon, authenticated;

grant select, insert, update, delete on public.teaching_frameworks to service_role;
grant select, insert, update, delete on public.teaching_framework_versions to service_role;
grant select, insert, update, delete on public.learner_teaching_frameworks to service_role;
