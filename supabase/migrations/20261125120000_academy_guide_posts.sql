-- STAGED FILE ONLY. Do not apply to production without founder release approval.
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
revoke all on public.academy_guide_posts from anon,authenticated;
create index if not exists academy_guide_posts_status_idx on public.academy_guide_posts(status,created_at desc);
