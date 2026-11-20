-- Provide a compact optimistic concurrency token for family payments shared by siblings.
alter table public.payment_entitlements
  add column session_revision bigint not null default 0;

create function public.advance_family_payment_session_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.session_revision := old.session_revision + 1;
  return new;
end;
$$;

revoke execute on function public.advance_family_payment_session_revision() from public, anon, authenticated;

create trigger advance_family_payment_session_revision
before update on public.payment_entitlements
for each row execute function public.advance_family_payment_session_revision();

-- Serialize competing admin offer/payment and credit/debt actions for one family.
alter table public.parent_leads
  add column family_booking_operation_until timestamptz;
