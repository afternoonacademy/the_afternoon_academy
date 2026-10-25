-- Focus Groups are a product classification within the existing lead pipeline.
-- Existing family enquiries remain Homework Club by default.
alter table public.parent_leads
  add column if not exists enquiry_type text not null default 'homework_club';

alter table public.parent_leads
  drop constraint if exists parent_leads_enquiry_type_check;
alter table public.parent_leads
  add constraint parent_leads_enquiry_type_check
  check (enquiry_type in ('homework_club', 'one_to_one', 'focus_group'));

alter table public.child_leads
  add column if not exists focus_group_code text,
  add column if not exists focus_group_preferred_session text,
  add column if not exists course_or_exam_board text;

alter table public.child_leads
  drop constraint if exists child_leads_focus_group_preferred_session_check;
alter table public.child_leads
  add constraint child_leads_focus_group_preferred_session_check
  check (focus_group_preferred_session is null or focus_group_preferred_session in ('17:00-17:50', '18:00-18:50', 'either'));

create index if not exists parent_leads_enquiry_type_status_idx
  on public.parent_leads (enquiry_type, status, created_at desc);
create index if not exists child_leads_focus_group_code_idx
  on public.child_leads (focus_group_code) where focus_group_code is not null;

create or replace view public.lead_overview_view as
select
  pl.id as parent_lead_id,
  cl.id as child_lead_id,
  tp.id as timetable_preference_id,
  pl.parent_name,
  pl.email,
  pl.phone,
  pl.area,
  pl.school_name,
  pl.interest_level,
  pl.status,
  pl.source,
  cl.child_age,
  cl.school_year,
  cl.curriculum,
  cl.support_needs,
  cl.notes,
  tp.preferred_days,
  tp.preferred_times,
  tp.preferred_frequency,
  pl.created_at,
  pl.enquiry_type,
  cl.focus_group_code,
  cl.focus_group_preferred_session,
  cl.course_or_exam_board
from public.parent_leads pl
join public.child_leads cl on cl.parent_lead_id = pl.id
join public.timetable_preferences tp on tp.child_lead_id = cl.id;

alter view public.lead_overview_view set (security_invoker = true);
revoke all on table public.lead_overview_view from anon, authenticated;
