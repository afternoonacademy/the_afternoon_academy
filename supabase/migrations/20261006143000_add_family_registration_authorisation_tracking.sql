create table if not exists public.family_documents (
  id uuid primary key default gen_random_uuid(),
  parent_lead_id uuid not null references public.parent_leads(id) on delete cascade,
  document_key text not null,
  provider text not null default 'adobe_web_form',
  status text not null,
  form_url text not null,
  sent_at timestamptz,
  signed_at timestamptz,
  send_count integer not null default 0 check (send_count >= 0),
  last_email_delivery_log_id uuid references public.email_delivery_log(id) on delete set null,
  signed_recorded_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_documents_status_check check (status in ('sent','signed')),
  constraint family_documents_document_key_check check (
    document_key in ('parent_registration_authorisation')
  ),
  unique (parent_lead_id, document_key)
);

alter table public.family_documents enable row level security;

revoke all on table public.family_documents from anon, authenticated;
grant select, insert, update, delete on table public.family_documents to service_role;

alter table public.email_delivery_log
  drop constraint if exists email_delivery_log_email_kind_check;

alter table public.email_delivery_log
  add constraint email_delivery_log_email_kind_check
  check (email_kind in (
    'enquiry_acknowledgement',
    'place_offer',
    'planned_place',
    'payment_confirmed',
    'portal_access',
    'learning_update',
    'renewal_reminder',
    'registration_authorisation'
  ));

comment on table public.family_documents is
  'Family-level document request and manual signature tracking. Signature ceremony remains with the external provider.';

comment on column public.family_documents.status is
  'sent means TAA has requested the form; signed means an administrator has verified the external signature and recorded it here.';
