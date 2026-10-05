-- Price plan names are labels, not unique commercial identities.
-- Multiple active plans may share the same name when their per-session rates differ.
alter table public.session_price_plans
  drop constraint if exists session_price_plans_name_key;
