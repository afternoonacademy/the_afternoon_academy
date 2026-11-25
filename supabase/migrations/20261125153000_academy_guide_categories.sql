-- Applied to existing verified TAA Supabase project on 25 November 2026.
-- Additive editorial-only schema; no learner/family records modified.
create table if not exists public.academy_guide_categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  title_en text not null check (length(trim(title_en)) between 3 and 100),
  title_es text not null check (length(trim(title_es)) between 3 and 100),
  kind text not null default 'public' check (kind in ('public','test')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
alter table public.academy_guide_categories enable row level security;
revoke all on table public.academy_guide_categories from anon,authenticated;
grant select,insert,update on table public.academy_guide_categories to service_role;
insert into public.academy_guide_categories (slug,title_en,title_es,kind,sort_order) values
 ('resources','Parent resources','Recursos para familias','public',10),
 ('supports','Academic support','Apoyo académico','public',20),
 ('neighbourhoods','Neighbourhood guides','Guías de barrios','public',30),
 ('test','Test','Pruebas','test',999)
on conflict (slug) do nothing;
alter table public.academy_guide_posts drop constraint if exists academy_guide_posts_category_check;
alter table public.academy_guide_posts add constraint academy_guide_posts_category_fkey
 foreign key (category) references public.academy_guide_categories(slug) on update restrict on delete restrict;
alter table public.academy_guide_posts add constraint academy_guide_posts_test_draft_only
 check (category <> 'test' or status='draft');
