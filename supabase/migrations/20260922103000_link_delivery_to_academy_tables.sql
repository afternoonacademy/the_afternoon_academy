-- Make the Academy setup records the operational source of truth.
-- Existing TAA1 Table 1/2 records are preserved and backfilled below.

alter table public.weekly_table_templates add column if not exists academy_table_id uuid references public.academy_tables(id) on delete restrict;
alter table public.accepted_bookings add column if not exists academy_table_id uuid references public.academy_tables(id) on delete restrict;
alter table public.standing_placements add column if not exists academy_table_id uuid references public.academy_tables(id) on delete restrict;
alter table public.delivery_sessions add column if not exists academy_table_id uuid references public.academy_tables(id) on delete restrict;

with taa1_tables as (
  select t.id, t.table_number
  from public.academy_tables t
  join public.academy_rooms r on r.id = t.room_id
  where r.name = 'TAA1'
)
update public.weekly_table_templates w set academy_table_id = t.id
from taa1_tables t where w.academy_table_id is null and w.table_number = t.table_number;
with taa1_tables as (
  select t.id, t.table_number from public.academy_tables t join public.academy_rooms r on r.id=t.room_id where r.name='TAA1'
)
update public.accepted_bookings b set academy_table_id=t.id from taa1_tables t where b.academy_table_id is null and b.table_number=t.table_number;
with taa1_tables as (
  select t.id, t.table_number from public.academy_tables t join public.academy_rooms r on r.id=t.room_id where r.name='TAA1'
)
update public.standing_placements p set academy_table_id=t.id from taa1_tables t where p.academy_table_id is null and p.table_number=t.table_number;
with taa1_tables as (
  select t.id, t.table_number from public.academy_tables t join public.academy_rooms r on r.id=t.room_id where r.name='TAA1'
)
update public.delivery_sessions s set academy_table_id=t.id from taa1_tables t where s.academy_table_id is null and s.table_number=t.table_number;

alter table public.weekly_table_templates alter column academy_table_id set not null;
alter table public.accepted_bookings alter column academy_table_id set not null;
alter table public.standing_placements alter column academy_table_id set not null;
alter table public.delivery_sessions alter column academy_table_id set not null;

drop index if exists public.accepted_bookings_schedule_idx;
create index accepted_bookings_academy_schedule_idx on public.accepted_bookings (weekday, academy_table_id, starts_at, seat_number)
  where status in ('accepted_awaiting_payment','paid_active');
drop index if exists public.standing_placements_weekly_seat_idx;
create index standing_placements_academy_schedule_idx on public.standing_placements (weekday, academy_table_id, starts_at, seat_number)
  where status = 'active';
alter table public.delivery_sessions drop constraint if exists delivery_sessions_service_date_table_number_starts_at_key;
alter table public.delivery_sessions add constraint delivery_sessions_service_date_academy_table_starts_at_key
  unique (service_date, academy_table_id, starts_at);

create or replace function public.enforce_delivery_seat_capacity()
returns trigger language plpgsql as $$
declare capacity smallint;
begin
  select t.seat_capacity into capacity
  from public.delivery_sessions s join public.academy_tables t on t.id=s.academy_table_id
  where s.id=new.delivery_session_id;
  if capacity is null or new.seat_number > capacity then
    raise exception 'seat number exceeds configured table capacity';
  end if;
  return new;
end;
$$;
drop trigger if exists delivery_seats_capacity_guard on public.delivery_seats;
create trigger delivery_seats_capacity_guard before insert or update of delivery_session_id, seat_number
  on public.delivery_seats for each row execute function public.enforce_delivery_seat_capacity();

create or replace function public.prevent_operational_config_archive()
returns trigger language plpgsql as $$
begin
  if new.status = 'inactive' and old.status = 'active' then
    if tg_table_name = 'academy_tables' and exists (
      select 1 from public.weekly_table_templates where academy_table_id=old.id and status='active'
    ) then raise exception 'archive the active timetable slots before archiving this table'; end if;
    if tg_table_name = 'academy_rooms' and exists (
      select 1 from public.academy_tables where room_id=old.id and status='active'
    ) then raise exception 'archive active tables before archiving this room'; end if;
    if tg_table_name = 'academy_buildings' and exists (
      select 1 from public.academy_rooms where building_id=old.id and status='active'
    ) then raise exception 'archive active rooms before archiving this building'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists academy_tables_archive_guard on public.academy_tables;
create trigger academy_tables_archive_guard before update of status on public.academy_tables for each row execute function public.prevent_operational_config_archive();
drop trigger if exists academy_rooms_archive_guard on public.academy_rooms;
create trigger academy_rooms_archive_guard before update of status on public.academy_rooms for each row execute function public.prevent_operational_config_archive();
drop trigger if exists academy_buildings_archive_guard on public.academy_buildings;
create trigger academy_buildings_archive_guard before update of status on public.academy_buildings for each row execute function public.prevent_operational_config_archive();
