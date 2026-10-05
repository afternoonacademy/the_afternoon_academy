alter table public.child_leads
  add column if not exists planned_email_draft_subject text,
  add column if not exists planned_email_draft_body text,
  add column if not exists planned_email_draft_booking_version text,
  add column if not exists planned_email_draft_saved_at timestamptz,
  add column if not exists planned_email_draft_regeneration_notice boolean not null default false,
  add column if not exists planned_email_draft_regenerated_at timestamptz;
