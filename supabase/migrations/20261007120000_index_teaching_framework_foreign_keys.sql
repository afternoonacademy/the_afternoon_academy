create index if not exists teaching_frameworks_current_version_idx
  on public.teaching_frameworks(current_version_id);
create index if not exists teaching_frameworks_created_by_idx
  on public.teaching_frameworks(created_by);
create index if not exists teaching_frameworks_updated_by_idx
  on public.teaching_frameworks(updated_by);
create index if not exists teaching_framework_versions_created_by_idx
  on public.teaching_framework_versions(created_by);
create index if not exists learner_teaching_frameworks_framework_idx
  on public.learner_teaching_frameworks(framework_id);
create index if not exists learner_teaching_frameworks_framework_version_idx
  on public.learner_teaching_frameworks(framework_version_id);
create index if not exists learner_teaching_frameworks_created_by_idx
  on public.learner_teaching_frameworks(created_by);
create index if not exists learner_teaching_frameworks_updated_by_idx
  on public.learner_teaching_frameworks(updated_by);
create index if not exists teacher_updates_framework_version_idx
  on public.teacher_updates(teaching_framework_version_id);
create index if not exists teacher_updates_learner_framework_idx
  on public.teacher_updates(learner_teaching_framework_id);
