alter table public.child_leads
  add column if not exists school_name text;

comment on column public.child_leads.school_name is
  'Child-specific current school captured from the family enquiry. Parent-level school_name remains for legacy compatibility.';
