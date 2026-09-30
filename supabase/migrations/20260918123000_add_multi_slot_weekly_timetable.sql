-- Two bookable daily slots per physical TAA1 table.
alter table public.delivery_sessions drop constraint if exists delivery_sessions_service_date_table_number_key;
alter table public.delivery_sessions add constraint delivery_sessions_service_date_table_number_starts_at_key
  unique (service_date, table_number, starts_at);

drop index if exists public.accepted_bookings_schedule_idx;
create index accepted_bookings_schedule_idx on public.accepted_bookings (weekday, table_number, starts_at, seat_number)
  where status in ('accepted_awaiting_payment','paid_active');

drop index if exists public.standing_placements_weekly_seat_idx;
create index standing_placements_weekly_seat_idx on public.standing_placements (weekday, table_number, starts_at, seat_number)
  where status = 'active';

insert into public.weekly_table_templates (room_code, weekday, table_number, starts_at, duration_minutes, teacher_name, focus, status, effective_from)
select 'TAA1', d.weekday, t.table_number, s.starts_at::time, 50, null, 'General homework support', 'active', current_date
from (values (1),(2),(4),(5)) as d(weekday)
cross join (values (1),(2)) as t(table_number)
cross join (values ('17:00'),('18:00')) as s(starts_at)
where not exists (
  select 1 from public.weekly_table_templates x
  where x.weekday=d.weekday and x.table_number=t.table_number and x.starts_at=s.starts_at::time and x.status='active'
);