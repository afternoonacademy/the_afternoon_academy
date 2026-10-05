-- Keep existing admin-edited wording, but expose payment reference as its own
-- template placeholder instead of embedding it inside payment_details.
update public.academy_email_templates
set body_template = replace(
      body_template,
      '{{payment_details}}',
      '{{payment_details}}' || E'\n\nPayment reference: {{payment_reference}}'
    ),
    updated_at = now()
where template_key in ('planned_place_offer', 'renewal_reminder')
  and body_template like '%{{payment_details}}%'
  and body_template not like '%{{payment_reference}}%';
