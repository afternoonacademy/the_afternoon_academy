-- Role-aware admin foundation and atomic pre-conversion lead editing.

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role = any (array['admin'::text, 'teacher'::text, 'parent'::text]));

create or replace function public.update_preconversion_lead_details(
  p_parent_lead_id uuid,
  p_child_lead_id uuid,
  p_timetable_preference_id uuid,
  p_parent_name text,
  p_email text,
  p_phone text,
  p_area text,
  p_source text,
  p_child_first_name text,
  p_child_age integer,
  p_school_name text,
  p_school_year text,
  p_curriculum text,
  p_support_needs text[],
  p_notes text,
  p_course_or_exam_board text,
  p_preferred_days text[],
  p_preferred_times text[],
  p_preferred_frequency text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.child_leads c
    where c.id = p_child_lead_id
      and c.parent_lead_id = p_parent_lead_id
  ) then
    raise exception 'Child lead does not belong to this family';
  end if;

  if not exists (
    select 1
    from public.timetable_preferences t
    where t.id = p_timetable_preference_id
      and t.child_lead_id = p_child_lead_id
  ) then
    raise exception 'Timetable preference does not belong to this child';
  end if;

  if exists (
    select 1
    from public.learners l
    where l.child_lead_id = p_child_lead_id
  ) then
    raise exception 'Converted learner details must be edited in Learner Records';
  end if;

  update public.parent_leads
  set parent_name = p_parent_name,
      email = nullif(p_email, ''),
      phone = nullif(p_phone, ''),
      area = nullif(p_area, ''),
      source = nullif(p_source, ''),
      updated_at = now()
  where id = p_parent_lead_id;

  update public.child_leads
  set first_name = p_child_first_name,
      child_age = p_child_age,
      school_name = nullif(p_school_name, ''),
      school_year = nullif(p_school_year, ''),
      curriculum = nullif(p_curriculum, ''),
      support_needs = coalesce(p_support_needs, '{}'::text[]),
      notes = nullif(p_notes, ''),
      course_or_exam_board = nullif(p_course_or_exam_board, ''),
      updated_at = now()
  where id = p_child_lead_id
    and parent_lead_id = p_parent_lead_id;

  update public.timetable_preferences
  set preferred_days = coalesce(p_preferred_days, '{}'::text[]),
      preferred_times = coalesce(p_preferred_times, '{}'::text[]),
      preferred_frequency = nullif(p_preferred_frequency, ''),
      updated_at = now()
  where id = p_timetable_preference_id
    and child_lead_id = p_child_lead_id;
end;
$$;

revoke all on function public.update_preconversion_lead_details(
  uuid, uuid, uuid, text, text, text, text, text, text, integer, text, text,
  text, text[], text, text, text[], text[], text
) from public, anon, authenticated;

grant execute on function public.update_preconversion_lead_details(
  uuid, uuid, uuid, text, text, text, text, text, text, integer, text, text,
  text, text[], text, text, text[], text[], text
) to service_role;
