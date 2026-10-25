alter table public.academy_email_templates
  drop constraint if exists academy_email_templates_template_key_check;

alter table public.academy_email_templates
  add constraint academy_email_templates_template_key_check
  check (template_key in (
    'renewal_reminder',
    'planned_place_offer',
    'registration_authorisation'
  ));
