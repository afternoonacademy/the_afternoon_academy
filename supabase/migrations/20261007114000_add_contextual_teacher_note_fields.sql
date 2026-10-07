alter table public.teacher_updates
  add column working_on text check (char_length(working_on) <= 2000),
  add column support_needed text check (char_length(support_needed) <= 2000),
  add column reached text check (char_length(reached) <= 2000),
  add column note_format text not null default 'legacy'
    check (note_format in ('legacy','contextual'));

create index teacher_updates_note_format_idx
  on public.teacher_updates(learner_id, note_format, occurred_on desc);
