-- A commercial plan belongs to a learner's recurring place, not to a room, table or time.
-- The earlier timetable column is retained but unused, avoiding destructive shared-schema work.
alter table public.standing_placements
  add column if not exists session_price_plan_id uuid references public.session_price_plans(id) on delete restrict;

update public.standing_placements
set session_price_plan_id = (select id from public.session_price_plans where name = 'General Homework Support')
where session_price_plan_id is null and status = 'active';
