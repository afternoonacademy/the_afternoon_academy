insert into public.academy_email_templates (
  template_key,
  subject_template,
  body_template
)
values (
  'planned_place_offer',
  'Planned Academy place for {{child_name}}',
  'Dear {{parent_name}},

We can offer {{child_name}} the following place at The Afternoon Academy:
{{recurring_place}}
{{price_plan_name}} · {{session_price}} per session

Planned service dates:
{{service_dates}}

That is {{session_count}} session(s), totalling {{amount_due}}.

{{payment_details}}

Payment reference: {{payment_reference}}

Once the transfer has cleared, we will confirm the exact paid dates and activate the dated Operations places.

Warmly,
The Afternoon Academy'
)
on conflict (template_key) do nothing;
