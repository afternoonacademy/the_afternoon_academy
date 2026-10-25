update public.email_delivery_log as log
set
  renewal_case_id = renewal.id,
  learner_id = renewal.learner_id
from public.renewal_cases as renewal
where log.email_kind = 'renewal_reminder'
  and log.idempotency_key = 'renewal-' || renewal.id::text
  and (log.renewal_case_id is null or log.learner_id is null);

update public.email_delivery_log as log
set child_lead_id = offer.child_lead_id
from public.place_offers as offer
where log.place_offer_id = offer.id
  and log.child_lead_id is null;
