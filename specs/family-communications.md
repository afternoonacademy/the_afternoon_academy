# Family communications delivery tracking

_Status: implemented release slice — founder accepted 2 October 2026._

## Goal

Give admins one parent/family communication history across the enquiry → learner → renewal lifecycle and show whether each tracked outbound email was sent, delivered, delayed, bounced or failed.

The permanent anchor is `parent_lead_id`. Child/learner/renewal references are optional context, so communications exist before a learner record is created and remain visible after conversion.

## Non-goals

- No email open tracking.
- No click tracking.
- No direct learner/child communication.
- No inbound-email/reply handling in this slice.
- No parent portal communication surface.
- No automatic resend after bounce/failure.

## Data model

`email_delivery_log` remains the canonical outbound-message record and now also stores:

- optional `child_lead_id`
- optional `learner_id`
- optional `renewal_case_id`
- `delivered_at`, `bounced_at`, `failed_at`, `last_event_at`
- concise `delivery_detail`

`email_delivery_events` retains verified Resend delivery lifecycle events for idempotency/audit. It stores only the event id/type, linked delivery-log id, Resend email id, timestamp and concise failure/bounce detail. The full webhook payload is not retained.

Both tables are service-role only under RLS; no browser write path is introduced.

## Delivery status

TAA listens only to operational delivery outcomes:

- `email.sent` → Sent
- `email.delivered` → Delivered
- `email.delivery_delayed` → Delivery delayed
- `email.bounced` → Bounced
- `email.failed` → Failed
- `email.suppressed` → Suppressed

Open/click events are intentionally ignored even if Resend sends them.

Webhook requests must pass Resend/Svix signature verification using the server-only `RESEND_WEBHOOK_SECRET`.

## UI

### Lead stage

Family Pipeline → Lead → Details includes **Family communications**. Parent-wide messages appear immediately after enquiry submission, before a learner exists.

### Learner stage

Learner Workspace includes **Family communications** using the same parent/family history. Messages linked to a child/learner show the relevant child context; genuinely family-wide messages are labelled family-wide.

### Renewal stage

The active renewal workflow surfaces the current renewal email delivery result so bounced/failed delivery is immediately actionable.

Each communication can be expanded to review the exact retained subject/body that was sent.

## Privacy / safeguarding

- Parent-facing operational email content is retained for audit/support.
- No open/click tracking is enabled by TAA.
- Webhook payloads are not stored wholesale.
- Resend webhook secret remains server-only.
- No safeguarding or learning-profile data is added to the communication log by this slice beyond the existing message content staff explicitly send.

## Failure modes

- Missing webhook secret: endpoint returns 503 and does not trust/process the event.
- Invalid signature: rejected with 400.
- Unknown Resend email id: acknowledged without mutating unrelated records.
- Duplicate webhook delivery: ignored using the Svix event id primary key.
- Bounce/failure: message remains historically visible and is clearly marked; no automatic resend.
- Out-of-order events: a later lower-priority event must not downgrade a delivered/bounced/failed state.

## Acceptance criteria

1. Enquiry acknowledgement is retained against the family before a learner exists.
2. Planned-place and legacy place-offer emails retain child context.
3. Renewal emails retain learner and renewal-case context.
4. Family Pipeline lead Details shows chronological parent communications.
5. Learner Workspace shows the same family communication timeline after conversion.
6. Sent/delivered/delayed/bounced/failed states are visible.
7. Bounce/failure details are visible where Resend supplies them.
8. Open/click status is never displayed or persisted.
9. Webhook endpoint rejects unsigned/invalid events.
10. RLS remains enabled with no public policies on communication event storage.

## Environment / release

Create a Resend webhook pointing to:

`/api/resend/webhook`

Subscribe only to:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.bounced`
- `email.failed`

Store the Resend signing secret as server-only `RESEND_WEBHOOK_SECRET` in the relevant Vercel environment(s).

## Rollback

Application/UI commits can be reverted without deleting communication history. The additive nullable columns and event table can safely remain unused. Do not delete historical delivery logs/events during rollback.
