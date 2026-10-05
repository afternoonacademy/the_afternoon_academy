# The Afternoon Academy — Current Engineering Baseline

_Status: consolidated 5 October 2026. Read this before starting the next feature slice._

This document is the concise engineering handoff for the current TAA application. It does not replace the product roadmap, change log, security model or feature specifications; it links the operational decisions that future work must preserve.

## Platform

- Next.js 16 App Router application.
- Vercel deployment and runtime.
- Supabase/Postgres for operational data and authentication.
- Resend for transactional parent email and delivery outcomes.
- Server-side privileged database access is used for admin workflows; privileged keys remain server-only.

## Admin lifecycle

Family Pipeline is the single lifecycle surface:

1. Lead received.
2. Recurring place and exact first-period dates planned.
3. Parent email reviewed and explicitly sent.
4. Cleared payment manually confirmed.
5. Learner activated with exact dated paid sessions and Operations seats.
6. Learner remains a paid customer until the final paid service date.
7. Renewal becomes due on the final paid date and stays due until renewed or deliberately closed/released.

Sibling children remain independent learners/payment entitlements even when they share one parent/family account.

## Timetable and payment invariants

- Standing placements describe the long-term recurring arrangement.
- Exact selected dated sessions are the source of truth for quoted value, payment entitlement and dated Operations delivery.
- Session price plans are reusable records identified by ID; display names may repeat at different rates.
- Academy closures remove dates from generated first-period/renewal schedules.
- A blank closure end date is one day.
- Cleared payment is always an explicit human/admin decision.

## First-period exceptions

A family may agree an exceptional date before starting while still signing up to a recurring place.

- The exception is stored only in the first exact-date period.
- It does not change the recurring standing placement.
- It does not recur automatically next month.
- Parent wording does not call it a replacement.

## Future paid-session changes

Post-payment changes are managed from the family account.

- One-off change: changes only the affected dated session.
- From-date change: effective-dates the recurring standing placement.
- Past/attended sessions are preserved.
- Price differences create an auditable family credit or balance due.
- Family balances are never silently applied; the admin explicitly chooses application, collection, refund or waiver.
- Family balance may be deliberately applied to another child in the same family, but never across families.

Current adjustment history is retained append-only in `parent_leads.account_adjustments`. Do not overwrite or recalculate historical entries client-side.

## Parent communication

Academy Setup → Parent communication / Email templates is the reusable wording source of truth.

Template keys:

- `planned_place_offer`
- `renewal_reminder`

The shared template contract lives in `lib/email/parent-template-contract.mjs`. The admin editor, fallback/default templates and renderers must all use that contract.

Key current placeholder semantics:

- `{{period_heading}}` — child-specific first/next-period heading.
- `{{service_dates}}` — grouped session name plus each date and start time.
- `{{session_count}}` — number of exact sessions.
- `{{amount_due}}` — total copied session value.
- `{{payment_details}}` — configured business/account/IBAN only.
- `{{payment_reference}}` — child/learner name plus covered month/year.

Initial first-period exceptions are not labelled replacement. Genuine later replacement sessions may be.

Preview and send must use the same renderer. Reviewing an email must not send, mutate pipeline state or create a delivery-log event.

## Communications audit

Parent communications remain anchored to the family/parent record and may retain child, learner and renewal context.

Resend delivery states retained operationally include sent, delivered, delayed, bounced, failed and suppressed. TAA does not use open/click tracking for this workflow.

## Authorization and security

- Admin mutations require server-side admin authorization.
- RLS remains enabled on operational tables.
- Current operational tables generally expose no browser RLS policies; trusted server/service-role actions are the access path.
- Never move privileged database or Resend secrets to browser code.
- Real learner/family data must not be copied into development fixtures or external AI tools.
- AI may not receive identifiable learner/family data under the current approved architecture.

See `docs/security/security-model.md` for the current advisor review and known hardening items.

## Release/testing baseline

For a material future slice:

1. Discover existing behavior and docs.
2. Write/update tests first for behavior changes.
3. Build on a feature branch.
4. Run the full automated suite and production build.
5. Review authorization, data history, privacy and failure states.
6. Verify a Vercel preview with synthetic data where feasible.
7. Update roadmap/change log/spec/security docs if architecture or operational behavior changes.
8. Merge/release only after acceptance and then check production runtime health.

## Known deferred / next work

The operational foundation is intentionally ahead of the parent-facing product surface. Future work should prioritize the existing Phase 1 roadmap: richer learner profiles, group matching, consent/safeguarding workflow and reliable learning evidence before expanding the parent portal.

Database-security hardening items identified by the 5 October Supabase advisor review are documented in the security model and should be handled as deliberate infrastructure slices rather than incidental feature edits.


## Planned lead capacity and one-off communication edits

- A saved lead plan reserves its exact planned Operations seat before payment. Operations must show that seat on the exact planned service date as **Planned · awaiting payment** and count it against visible capacity.
- Planned lead occupancy comes from `accepted_bookings.planned_sessions`, not from inventing recurring dates. This preserves pre-agreed first-period exceptions.
- Planned lead seats do not permit attendance until payment/activation has created the real learner/delivery seat.
- In Family Pipeline, generated planned-place email subject/body may be edited for one family. The submitted edited values are the values sent and logged; they do not update the reusable parent-communication template.
- Bank detail semantics are: `TAA_BANK_ACCOUNT_NAME` is currently used as the displayed bank name, `TAA_BUSINESS_NAME` as the account name, and `TAA_BANK_IBAN` as the IBAN.
