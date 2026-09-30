-- Attendance belongs to a learner's dated delivery session, not merely a date.
-- This permits legitimate multiple booked sessions for the same learner on one day.

drop index if exists public.attendance_records_learner_id_attendance_date_key;

create unique index if not exists attendance_records_delivery_session_learner_date_unique
  on public.attendance_records (delivery_session_id, learner_id, attendance_date);
