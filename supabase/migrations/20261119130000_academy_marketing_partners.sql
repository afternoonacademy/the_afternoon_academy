create table public.academy_marketing_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 90),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index academy_marketing_partners_name_key
  on public.academy_marketing_partners (lower(name));

alter table public.academy_marketing_partners enable row level security;

revoke all on table public.academy_marketing_partners from public, anon, authenticated, service_role;
grant select, insert, update on table public.academy_marketing_partners to service_role;
