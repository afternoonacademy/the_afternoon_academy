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


## Persistent planned-place email drafts

- Initial planned-place email drafts are persisted at child-lead level; they are one-off operational communication state, not template state.
- A persisted draft is valid only for the booking version it was saved against.
- If the underlying planned booking changes, any existing draft is automatically replaced with newly generated content from the current booking and an admin-visible regeneration notice is set.
- Editing the regenerated draft clears the notice because the admin has reviewed/changed the current version.
- Reusable wording remains owned by `academy_email_templates`; persisted child-level drafts must never mutate those templates.


## Customer lifecycle visibility

- Once a learner is active, has paid entitlement and has a current or upcoming active standing placement, the learner belongs in Family Pipeline → Customers unless a renewal or closed-renewal state takes precedence.
- Customer lifecycle visibility must not depend on the standing placement having reached its `effective_from` date. This avoids a gap between payment/activation and the first operational session.
- Operations and attendance continue to respect the actual placement `effective_from` date; lifecycle visibility does not make a future placement operational early.


## Planning corrections and lifecycle

- Booking edits are operational corrections, not lifecycle transitions.
- Saving or correcting planned dates/places preserves Contacted — awaiting payment when that is the child's current lifecycle stage; unsent plans remain Session planned.
- A valid planned booking is sufficient to expose manual payment confirmation. Sending an email is optional and must not be a prerequisite for payment.
- Parent communication history records what was actually sent and is immutable; regenerated drafts represent current proposed wording only.
- Explicit lifecycle actions such as release/cancel may move a child backwards or close the journey; ordinary booking edits must not.


## 6 October 2026 production baseline — role-aware admin, grouped families and finance

### Role-aware application entry

- `/admin` is a role router rather than the Operations page.
- Admin users are redirected to `/admin/finance`.
- Teacher users are redirected to `/admin/operations`.
- Navigation is generated from the central capability map and page routes independently enforce the required capability server-side.

### Admin-only finance surface

- Commercial reporting lives at `/admin/finance`, protected by `view_commercial_kpis`.
- The daily Operations page does not query or render commercial KPI data.
- Current finance reporting combines period KPIs with calendar-year monthly paid revenue and family lifetime revenue.
- Revenue is based on payment records whose status is `paid`; pending planned value remains separate from received revenue.

### Family Pipeline semantics

- Leads are unique parent/family records. Siblings are nested beneath one family row.
- Customers are unique active parent/family records with at least one active learner and a current/upcoming recurring place.
- A family in renewal remains a Customer. Renewals is an overlapping action subset.
- Customer learner rows expose renewal state through the paid-through badge rather than removing the family from Customers.
- Pre-conversion edits update approved parent/child/timetable source fields only and preserve lifecycle, payments, bookings and communication history.
- Once a learner exists, identity/lifecycle edits belong in Learner Records rather than stale lead identity fields.

### Current access model

- Admin: all internal capabilities.
- Teacher: `view_operations`, `operate_sessions`, `view_learners`, `edit_learning_record`, `view_teaching_hub`.
- Parent: supported role with no internal `/admin` capabilities in this baseline.
- Child: no role/login.


## Parent registration document tracking — 6 October 2026 release candidate

- `family_documents` is the family-level operational record for the Parent Registration & Authorisation Form.
- The initial document type is `parent_registration_authorisation` and the initial provider is the existing Adobe Web Form.
- State is deliberately minimal: no row means Not sent; `sent` means TAA has sent/requested the form; `signed` means an Admin has verified the external signature and recorded the signed date.
- Email requests reuse `email_delivery_log` and Resend delivery tracking with the email kind `registration_authorisation`.
- The family account is the control surface. It shows send/signature state and links to the external form.
- Admin-only server actions send/resend and record signed status. Teacher permissions are unchanged.
- The new table has RLS enabled and is accessed server-side with service-role infrastructure; anon/authenticated table privileges are revoked.
- No signing-provider API, webhook, PDF ingestion or automated signature inference is included in this phase.


## Learner teaching architecture — 7 October 2026 release candidate

- Learner Workspace is the default teaching surface. It prioritises active teaching context, active goals, the previous useful handover, helpful strategies and a short session note.
- Learner page tabs separate Workspace, Attendance and Teaching History from Admin-only Family & Place and Communications.
- Stable profile fields are edited at /admin/learners/[id]/edit; lifecycle status remains Admin-only at /admin/learners/[id]/status.
- teaching_frameworks holds stable Academy framework identity; teaching_framework_versions holds versioned guidance and constrained four-field prompt configuration.
- learner_teaching_frameworks links learners to one or more time-bounded support contexts and stores learner-specific course/exam board/topic/objectives. One active default is permitted.
- New contextual teacher_updates retain framework, framework-version, learner-assignment and prompt-snapshot references. Legacy teacher updates remain valid and render without a framework.
- The first contextual note format uses working_on, optional support_needed, reached and next_step; legacy non-null note columns remain populated for compatibility.
- learner_goal_progress is append-only evidence for Progressing / Needs review / Achieved events; No change deliberately creates no unnecessary history row.
- Published Teaching Frameworks are readable by Admin and Teacher. Framework management requires manage_teaching_frameworks and remains Admin-only.
- The redesigned default note path does not call the AI drafting endpoint or send identifiable learner data to an AI provider.


### Family Updates evidence pipeline — 7 October 2026

- `/admin/family-updates` is the Admin-only review/send surface for monthly parent learning updates.
- The family-summary evidence bundle reads monthly `teacher_updates` in both legacy and contextual formats, relevant `learner_goals` and `learner_goal_progress`, overlapping `learner_teaching_frameworks`, framework-version evidence/goal/avoid guidance, and selected `learner_profiles` context.
- Attendance is intentionally not queried or supplied to the monthly family-summary AI prompt in this baseline.
- Admin can preview the evidence without AI. Vercel AI Gateway is invoked only when the Admin requests a draft and remains dependent on the project's paid/approved Gateway configuration.
- The parent-facing draft is editable and never auto-sent. Explicit send uses Resend and writes `email_delivery_log.email_kind = 'learning_update'` with the learner/family linkage so it appears in communications history.
- The routine teacher session-note flow itself remains AI-free; Family Updates is the separate controlled Admin review boundary for monthly synthesis.
