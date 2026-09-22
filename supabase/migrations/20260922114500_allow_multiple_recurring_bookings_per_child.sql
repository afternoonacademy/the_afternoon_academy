-- A child may attend more than one recurring weekly slot (for example Monday and Thursday).
drop index if exists public.accepted_bookings_one_current_child_idx;
create unique index accepted_bookings_current_child_slot_idx
  on public.accepted_bookings (child_lead_id, weekday, academy_table_id, starts_at)
  where status in ('accepted_awaiting_payment', 'paid_active');
