alter table public.parent_leads drop constraint if exists parent_leads_status_check;
alter table public.parent_leads add constraint parent_leads_status_check
  check (status = any (array['new','warm','priority','contacted','offer_sent','accepted_awaiting_payment','waitlist','converted','closed']));