-- Enquiries and enrolments can be created before a child profile is complete.
alter table public.child_leads alter column child_age drop not null;
