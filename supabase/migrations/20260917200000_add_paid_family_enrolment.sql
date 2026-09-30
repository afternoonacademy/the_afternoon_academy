-- Paid-family enrolment: multiple learners can belong to one family lead.

alter table public.learners
  drop constraint if exists learners_parent_lead_id_key;

alter table public.learners
  add column if not exists child_lead_id uuid
  references public.child_leads(id) on delete set null;

create unique index if not exists learners_child_lead_unique
  on public.learners (child_lead_id)
  where child_lead_id is not null;

alter table public.parent_leads
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references auth.users(id) on delete set null;

create or replace function public.enrol_paid_children(
  p_parent_lead_id uuid,
  p_child_lead_ids uuid[],
  p_actor_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_child record;
  v_count integer := 0;
begin
  if coalesce(array_length(p_child_lead_ids, 1), 0) = 0 then
    raise exception 'Select at least one child to enrol';
  end if;

  for v_child in
    select id, first_name, school_year
    from public.child_leads
    where parent_lead_id = p_parent_lead_id
      and id = any(p_child_lead_ids)
  loop
    insert into public.learners (
      parent_lead_id, child_lead_id, first_name, year_group, status, parent_information_confirmed
    ) values (
      p_parent_lead_id, v_child.id, v_child.first_name, v_child.school_year, 'active', true
    )
    on conflict (child_lead_id) where child_lead_id is not null do nothing;
    v_count := v_count + 1;
  end loop;

  if v_count <> array_length(p_child_lead_ids, 1) then
    raise exception 'One or more selected children do not belong to this family lead';
  end if;

  update public.parent_leads
  set status = 'converted',
      payment_confirmed_at = coalesce(payment_confirmed_at, now()),
      payment_confirmed_by = coalesce(payment_confirmed_by, p_actor_id),
      enrolled_at = coalesce(enrolled_at, now()),
      enrolled_by = coalesce(enrolled_by, p_actor_id)
  where id = p_parent_lead_id;

  return v_count;
end;
$$;

revoke all on function public.enrol_paid_children(uuid, uuid[], uuid) from public, anon, authenticated;
grant execute on function public.enrol_paid_children(uuid, uuid[], uuid) to service_role;