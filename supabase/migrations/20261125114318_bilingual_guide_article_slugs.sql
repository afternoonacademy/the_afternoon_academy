-- Migration was applied with the Supabase connector at 20261125114318.
-- Existing legacy slug retained to avoid breakage in older previews.
alter table public.academy_guide_posts
  add column if not exists slug_en text,
  add column if not exists slug_es text;
update public.academy_guide_posts set slug_en=slug where slug_en is null;
alter table public.academy_guide_posts
  add constraint academy_guide_posts_slug_en_format check (slug_en is null or (slug_en ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug_en)<=100)),
  add constraint academy_guide_posts_slug_es_format check (slug_es is null or (slug_es ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug_es)<=100));
create unique index if not exists academy_guide_posts_slug_en_unique on public.academy_guide_posts(slug_en) where slug_en is not null;
create unique index if not exists academy_guide_posts_slug_es_unique on public.academy_guide_posts(slug_es) where slug_es is not null;
