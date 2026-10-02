update public.academy_email_templates
set body_template = 'Dear {{parent_name}},

We can offer {{child_name}} the following recurring Academy place(s):
{{recurring_place}}

Price plan(s): {{price_plan_name}} · {{session_price}} per session

Planned service dates:
{{service_dates}}

That is {{session_count}} session(s), totalling {{amount_due}}.

{{payment_details}}

Payment reference: {{payment_reference}}

Once the transfer has cleared, we will confirm the exact paid dates and activate the dated Operations places.

Warmly,
The Afternoon Academy'
where template_key = 'planned_place_offer'
  and body_template = 'Dear {{parent_name}},

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
The Afternoon Academy';
