create function public.move_renewal_recurring_slot(
  p_case_id uuid,
  p_parent_id uuid,
  p_placement_id uuid,
  p_template_id uuid,
  p_effective_date date,
  p_offer_revision integer,
  p_actor_id uuid
) returns void
language plpgsql
set search_path = ''
as $$
declare
  renewal public.renewal_cases%rowtype;
  source public.standing_placements%rowtype;
  destination public.weekly_table_templates%rowtype;
  booking_id uuid;
  booking_ids uuid[];
  next_placement_id uuid := gen_random_uuid();
  v_learner_id uuid;
  capacity integer;
  seat integer;
  offset_days integer;
  proposed jsonb;
  moved_dates date[];
  first_moved_date date;
begin
  perform set_config('lock_timeout', '5s', true);

  select * into renewal from public.renewal_cases
    where id = p_case_id and parent_lead_id = p_parent_id for update;
  if not found or renewal.offer_revision is distinct from p_offer_revision
    or renewal.status not in ('ready_to_send', 'overdue', 'awaiting_payment')
    or renewal.offer_payment_started_at is not null
    or renewal.offer_operation_until >= clock_timestamp()
    or coalesce(jsonb_array_length(renewal.selected_sessions), 0) = 0 then
    raise exception 'Refresh the saved unpaid offer before moving a recurring slot';
  end if;

  if p_effective_date is null
    or p_effective_date < (clock_timestamp() at time zone 'Europe/Madrid')::date then
    raise exception 'Choose today or a future date';
  end if;

  -- Serialize capacity checks with the existing table writers. The active
  -- booking indexes also protect the destination if another request retries.
  lock table public.accepted_bookings, public.standing_placements,
    public.place_offers, public.delivery_seats, public.attendance_records, public.child_payment_entitlements
    in share row exclusive mode;
  lock table public.academy_closures, public.weekly_table_templates,
    public.academy_tables, public.delivery_sessions in share mode;

  select l.id into v_learner_id from public.learners l
    where l.id = renewal.learner_id and l.parent_lead_id = p_parent_id and l.status = 'active'
    for share;
  if v_learner_id is null or p_actor_id is null then
    raise exception 'The learner is no longer available';
  end if;

  if exists (
    select 1 from public.child_payment_entitlements e
    where e.learner_id = v_learner_id and e.status = 'paid'
      and e.period_end >= p_effective_date
  ) then
    raise exception 'The change overlaps an existing paid period';
  end if;

  select s.* into source from public.standing_placements s
    where s.id = p_placement_id and s.learner_id = v_learner_id and s.status = 'active';
  if not found or source.effective_to is not null or p_effective_date <= source.effective_from then
    raise exception 'This recurring place cannot be changed from that date';
  end if;

  select t.* into destination from public.weekly_table_templates t
    where t.id = p_template_id and t.status = 'active' and t.weekday between 1 and 5;
  if not found or destination.weekday = source.weekday then
    raise exception 'Choose an active slot on a different weekday';
  end if;

  if exists (
    select 1 from public.standing_placements s
    where s.learner_id = v_learner_id and s.status = 'active' and s.weekday = destination.weekday
      and s.starts_at < destination.starts_at + make_interval(mins => destination.duration_minutes)
      and destination.starts_at < s.starts_at + make_interval(mins => s.duration_minutes)
      and (s.effective_to is null or s.effective_to >= p_effective_date)
  ) then
    raise exception 'The learner already has an overlapping recurring slot';
  end if;

  if p_effective_date = (clock_timestamp() at time zone 'Europe/Madrid')::date and exists (
    select 1 from jsonb_array_elements(renewal.selected_sessions) as rows(session)
    where session->>'placementId' = p_placement_id::text
      and (session->>'date')::date = p_effective_date
      and not coalesce((session->>'replacement')::boolean, false)
      and coalesce((session->>'actualStartsAt')::time, source.starts_at)
        <= (clock_timestamp() at time zone 'Europe/Madrid')::time
  ) then
    raise exception 'The selected slot has already started today. Choose a later date';
  end if;

  offset_days := (destination.weekday - source.weekday + 7) % 7;

  -- Keep every untouched saved line, including other weekdays and any
  -- explicitly agreed one-off replacements. An Academy closure removes the
  -- corresponding moved date from the proposed renewal.
  with dates as (
    select session,
      (session->>'date')::date as old_date,
      (session->>'placementId' = p_placement_id::text
        and (session->>'date')::date >= p_effective_date
        and not coalesce((session->>'replacement')::boolean, false)
        and extract(dow from (session->>'date')::date) = source.weekday) as moved
    from jsonb_array_elements(renewal.selected_sessions) as rows(session)
  ), revised as (
    select case when moved then
      (session - 'actualStartsAt' - 'timeTbc') || jsonb_build_object(
        'placementId', next_placement_id, 'date', old_date + offset_days,
        'academyTableId', destination.academy_table_id, 'tableNumber', destination.table_number,
        'seatNumber', null, 'startsAt', to_char(destination.starts_at, 'HH24:MI'),
        'durationMinutes', destination.duration_minutes, 'teacherName', destination.teacher_name,
        'focus', destination.focus, 'replacement', false, 'sessionOrigin', 'recurring')
      else session end as session, moved
    from dates
    where not moved or not exists (
      select 1 from public.academy_closures c where old_date + offset_days between c.starts_on and c.ends_on
    )
  )
  select jsonb_agg(session order by session->>'date', session->>'startsAt'),
    array_agg((session->>'date')::date) filter (where moved)
  into proposed, moved_dates from revised;

  if coalesce(cardinality(moved_dates), 0) = 0 then
    raise exception 'No saved recurring dates can move to that slot from the chosen date';
  end if;

  select min(d) into first_moved_date from unnest(moved_dates) d;
  if destination.effective_from > first_moved_date
    or destination.effective_to is not null then
    raise exception 'The destination slot is not available as an ongoing place from those dates';
  end if;

  if exists (
    with times as (
      select idx, session->>'date' as date, session->>'placementId' = next_placement_id::text as moved,
        coalesce((session->>'actualStartsAt')::time, (session->>'startsAt')::time) as begins,
        (session->>'durationMinutes')::int as duration
      from jsonb_array_elements(proposed) with ordinality as rows(session, idx)
    )
    select 1 from times a join times b on a.date = b.date and a.idx < b.idx
    where (a.moved or b.moved)
      and a.begins < b.begins + make_interval(mins => b.duration)
      and b.begins < a.begins + make_interval(mins => a.duration)
  ) then
    raise exception 'The change would overlap another session in this offer';
  end if;

  if exists (
    select 1 from public.attendance_records a
    where a.learner_id = v_learner_id and a.attendance_date >= p_effective_date
      and (extract(dow from a.attendance_date) = source.weekday or a.attendance_date = any(moved_dates))
  ) or exists (
    select 1 from public.delivery_seats s join public.delivery_sessions d on d.id = s.delivery_session_id
    where s.learner_id = v_learner_id and d.service_date >= p_effective_date
      and s.status in ('scheduled', 'payment_pending')
      and ((extract(dow from d.service_date) = source.weekday and d.starts_at = source.starts_at and d.academy_table_id = source.academy_table_id)
        or (d.service_date = any(moved_dates) and d.starts_at = destination.starts_at))
  ) then
    raise exception 'One of these dates already has a delivery or attendance record';
  end if;

  select array_agg(b.id) into booking_ids from public.accepted_bookings b
    where b.learner_id = v_learner_id and b.parent_lead_id = p_parent_id
      and b.weekday = source.weekday and b.academy_table_id = source.academy_table_id
      and b.starts_at = source.starts_at and b.status = 'paid_active'
      and (source.seat_number is null or b.seat_number = source.seat_number);
  if coalesce(cardinality(booking_ids), 0) <> 1 then
    raise exception 'One current capacity booking is required for the selected slot';
  end if;
  booking_id := booking_ids[1];

  select t.seat_capacity into capacity from public.academy_tables t
    where t.id = destination.academy_table_id and t.status = 'active';
  if capacity is null then
    raise exception 'The destination table is no longer available';
  end if;

  if exists (
    select 1 from public.standing_placements s
    where s.weekday = destination.weekday and s.academy_table_id = destination.academy_table_id
      and s.starts_at = destination.starts_at and s.seat_number is null
      and s.status = 'active' and (s.effective_to is null or s.effective_to >= p_effective_date)
      and not exists (
        select 1 from public.accepted_bookings b
        where b.learner_id = s.learner_id and b.weekday = s.weekday
          and b.academy_table_id = s.academy_table_id and b.starts_at = s.starts_at
          and b.status = 'paid_active'
      )
  ) then
    raise exception 'The destination has an unassigned recurring hold. Check the timetable capacity first';
  end if;

  select candidate into seat from generate_series(1, capacity) candidate
  where not exists (
    select 1 from public.accepted_bookings b
    where b.weekday = destination.weekday and b.academy_table_id = destination.academy_table_id
      and b.starts_at = destination.starts_at and b.seat_number = candidate
      and b.status in ('session_planned', 'contacted', 'accepted_awaiting_payment', 'paid_active')
  ) and not exists (
    select 1 from public.place_offers o
    where o.weekday = destination.weekday and o.academy_table_id = destination.academy_table_id
      and o.starts_at = destination.starts_at and o.seat_number = candidate
      and o.status in ('draft', 'sent', 'viewed', 'accepted')
  ) and not exists (
    select 1 from public.standing_placements s
    where s.weekday = destination.weekday and s.academy_table_id = destination.academy_table_id
      and s.starts_at = destination.starts_at and s.seat_number = candidate
      and s.status = 'active' and (s.effective_to is null or s.effective_to >= p_effective_date)
  ) and not exists (
    select 1 from public.delivery_seats s join public.delivery_sessions d on d.id = s.delivery_session_id
    where d.service_date >= first_moved_date
      and extract(dow from d.service_date) = destination.weekday
      and d.academy_table_id = destination.academy_table_id
      and d.starts_at = destination.starts_at and s.seat_number = candidate
      and s.status in ('scheduled', 'payment_pending')
  )
  order by candidate limit 1;

  if seat is null then
    raise exception 'There is no recurring seat available across the proposed dates';
  end if;

  update public.standing_placements
    set effective_to = p_effective_date - 1, updated_by = p_actor_id
    where id = source.id;

  insert into public.standing_placements (
    id, learner_id, weekday, table_number, academy_table_id, seat_number, starts_at,
    duration_minutes, teacher_name, focus, effective_from, status, room_code,
    session_price_plan_id, created_by, updated_by
  ) values (
    next_placement_id, v_learner_id, destination.weekday, destination.table_number,
    destination.academy_table_id, seat, destination.starts_at, destination.duration_minutes,
    destination.teacher_name, destination.focus,
    first_moved_date, 'active', destination.room_code,
    source.session_price_plan_id, p_actor_id, p_actor_id
  );

  update public.accepted_bookings set
    weekly_table_template_id = destination.id, weekday = destination.weekday,
    table_number = destination.table_number, academy_table_id = destination.academy_table_id,
    seat_number = seat, starts_at = destination.starts_at,
    duration_minutes = destination.duration_minutes, updated_at = clock_timestamp()
    where id = booking_id;

  update public.renewal_cases set
    standing_placement_id = case when renewal.standing_placement_id = source.id
      then next_placement_id else renewal.standing_placement_id end,
    offer_revision = renewal.offer_revision + 1,
    selected_sessions = proposed,
    selected_session_count = jsonb_array_length(proposed),
    proposed_period_start = (select min((s->>'date')::date) from jsonb_array_elements(proposed) s),
    proposed_period_end = (select max((s->>'date')::date) from jsonb_array_elements(proposed) s),
    proposed_service_dates = (
      select jsonb_agg(d order by d) from (
        select distinct s->>'date' as d from jsonb_array_elements(proposed) s
      ) dates
    ),
    proposed_session_price_plan_id = (
      select case when count(distinct s->>'pricePlanId') = 1 then min(s->>'pricePlanId')::uuid end
      from jsonb_array_elements(proposed) s
    ),
    proposed_amount_cents = (
      select sum((s->>'priceCents')::integer) from jsonb_array_elements(proposed) s
    ),
    draft_subject = null,
    draft_body = null,
    updated_by = p_actor_id
    where id = renewal.id;
end;
$$;

revoke all on function public.move_renewal_recurring_slot(uuid, uuid, uuid, uuid, date, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.move_renewal_recurring_slot(uuid, uuid, uuid, uuid, date, integer, uuid)
  to service_role;

-- A future-effective switch moves the live booking immediately. Keep the
-- former seat protected for dates before the switch via the end-dated place.
create function public.guard_end_dated_standing_seat() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  starts_on date;
  same_learner uuid;
begin
  if tg_table_name = 'accepted_bookings' then
    if new.status not in ('session_planned', 'contacted', 'accepted_awaiting_payment', 'paid_active') then
      return new;
    end if;
    starts_on := new.planned_period_start;
    same_learner := new.learner_id;
  else
    if new.status not in ('draft', 'sent', 'viewed', 'accepted') then
      return new;
    end if;
    starts_on := new.service_period_start;
    select l.id into same_learner from public.learners l
      where l.child_lead_id = new.child_lead_id and l.status = 'active';
    if exists (
      select 1 from public.accepted_bookings b
      where b.status in ('session_planned', 'contacted', 'accepted_awaiting_payment', 'paid_active')
        and b.child_lead_id is distinct from new.child_lead_id
        and b.academy_table_id = new.academy_table_id and b.weekday = new.weekday
        and b.starts_at = new.starts_at and b.seat_number = new.seat_number
    ) then
      raise exception 'That recurring seat is already held';
    end if;
  end if;

  if exists (
    select 1 from public.standing_placements s
    where s.status = 'active' and s.effective_to is not null
      and s.effective_to >= greatest(coalesce(starts_on, '-infinity'::date),
        (clock_timestamp() at time zone 'Europe/Madrid')::date)
      and s.learner_id is distinct from same_learner
      and s.academy_table_id = new.academy_table_id and s.weekday = new.weekday
      and s.starts_at = new.starts_at and s.seat_number = new.seat_number
  ) then
    raise exception 'That recurring seat is still held until its existing place ends';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_end_dated_standing_seat() from public, anon, authenticated;
create trigger guard_end_dated_standing_seat
before insert or update of weekday, starts_at, academy_table_id, seat_number, status, planned_period_start
on public.accepted_bookings
for each row execute function public.guard_end_dated_standing_seat();

create trigger guard_end_dated_standing_seat
before insert or update of weekday, starts_at, academy_table_id, seat_number, status, service_period_start
on public.place_offers
for each row execute function public.guard_end_dated_standing_seat();
