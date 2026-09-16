-- Parent and child enquiry data is only accessed by trusted server-side code.
revoke all on table public.parent_leads from anon, authenticated;
revoke all on table public.child_leads from anon, authenticated;
revoke all on table public.timetable_preferences from anon, authenticated;
revoke all on table public.contact_messages from anon, authenticated;

-- Ensure reporting views use the caller's permissions rather than their owner.
alter view public.lead_overview_view set (security_invoker = true);
alter view public.timetable_demand_view set (security_invoker = true);
revoke all on table public.lead_overview_view from anon, authenticated;
revoke all on table public.timetable_demand_view from anon, authenticated;

-- Keep trigger function lookup deterministic.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
