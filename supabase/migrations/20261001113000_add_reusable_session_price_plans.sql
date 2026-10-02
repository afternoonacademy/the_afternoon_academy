-- Reusable commercial price plans. Timetable entries reference a plan; final renewal
-- selections retain their own copied price so historic communications remain stable.

create table if not exists public.session_price_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create trigger session_price_plans_set_updated_at before update on public.session_price_plans for each row execute function public.set_updated_at();
alter table public.session_price_plans enable row level security;
revoke all on table public.session_price_plans from anon, authenticated;
grant all on table public.session_price_plans to service_role;

alter table public.weekly_table_templates
  add column if not exists session_price_plan_id uuid references public.session_price_plans(id) on delete restrict;

insert into public.session_price_plans (name, price_cents, description)
values
  ('General Homework Support', 2500, 'Standard Homework Club session'),
  ('IGCSE Chemistry Focus Group', 4000, 'Specialist Chemistry Focus Group session')
on conflict (name) do nothing;

update public.weekly_table_templates
set session_price_plan_id = (select id from public.session_price_plans where name = 'General Homework Support')
where session_price_plan_id is null and coalesce(session_price_cents, 2500) = 2500;

update public.weekly_table_templates
set session_price_plan_id = (select id from public.session_price_plans where name = 'IGCSE Chemistry Focus Group')
where session_price_plan_id is null and session_price_cents = 4000;
