-- Founder-approved additive migration applied to the existing TAA Supabase production project on 25 November 2026. No learner/family tables affected.
create table if not exists public.academy_guide_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=100),
  category text not null check (category in ('resources','supports','neighbourhoods')),
  status text not null default 'draft' check (status in ('draft','published')),
  title_en text not null, title_es text not null,
  summary_en text not null, summary_es text not null,
  body_en text not null, body_es text not null,
  image_path text, source_url text,
  created_at timestamptz not null default now()
);
alter table public.academy_guide_posts enable row level security;
revoke all on table public.academy_guide_posts from anon, authenticated;
grant select, insert, update on table public.academy_guide_posts to service_role;
create index if not exists academy_guide_posts_status_idx on public.academy_guide_posts(status,created_at desc);
