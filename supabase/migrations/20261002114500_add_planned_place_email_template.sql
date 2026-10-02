alter table public.academy_email_templates
  drop constraint if exists academy_email_templates_template_key_check;

alter table public.academy_email_templates
  add constraint academy_email_templates_template_key_check
  check (template_key in ('renewal_reminder','planned_place_offer'));

insert into public.academy_email_templates (
  template_key,
  subject_template,
  body_template
)
values (
  'planned_place_offer',
  'Academy place for {{child_name}}',
  'Hello {{parent_name}},

We can offer {{child_name}} the following Academy place:

{{recurring_place}}

Your first Academy period includes:

{{service_dates}}

That is {{session_count}} session(s), totalling {{amount_due}}.

If you would like to take the place, please make a bank transfer using the details below.

{{payment_details}}

Payment reference: {{payment_reference}}

Warmly,
The Afternoon Academy'
)
on conflict (template_key) do nothing;
