# The Afternoon Academy — Project Change Log

This repository copy records material product/engineering decisions that need to travel with the application. The fuller working project source remains the canonical business/product change log until intentionally consolidated.

## 30 September 2026 — Focus Groups first build

### Decision

Focus Groups are an additional, deliberately composed Academy group type. They do not reposition the core Homework Club proposition or create a separate family, learner, payment or placement system.

## 1 October 2026 — Academy closures and controlled renewal continuity

- Academy-wide closures are now maintained once in Academy Setup and used by Operations and renewal-date calculations.
- Renewals do not disappear when their previous paid period ends. They remain visible as overdue until staff renew or close the case.
- Staff prepare a renewal with the exact open session dates and amount, edit the populated email, then explicitly send it through the existing Resend delivery log.
- A late-paying family may continue only through an explicit staff-selected date. These dated seats are visibly labelled **Payment pending** in Operations; they are not treated as paid seats.
- Closure changes do not silently erase historic attendance, existing payments, or previously prepared delivery records.
- Academy Setup now separates Academy closures, timetable session prices, the renewal email template, and the physical Academy structure. Renewal quotations are calculated from the timetable rate and selected dated sessions, rather than relying on a manually entered renewal amount. The final dated-session selection is the payment activation source of truth.
- Session pricing has moved from repeated per-day rate entry to reusable named price plans. Staff select the appropriate plan on each learner's recurring paid place, including the initial General Homework Support (€25) and IGCSE Chemistry Focus Group (€40) plans; historical renewal selections keep their quoted price.
- Renewals now preselect each learner's current price plan and allow staff to choose the commercial plan for the next paid period before calculating the exact dates and amount. The proposed plan is applied to the recurring place only when cleared payment is confirmed; specialist plan selection does not automatically compose a group or change a seat.
- Renewal session lines now retain the learner and usual table/time. Staff can add an explicit open-date replacement session against that learner’s existing place; it is priced, included in the renewal record, and creates the corresponding dated Operations seat when cleared payment is confirmed. Academy closure dates remain unavailable.

### Interest-registration communication

- A successful IGCSE Chemistry interest registration now uses the established Resend lead-email configuration to send an acknowledgement to the parent and a reply-enabled notification to the internal lead address.
- Both messages make clear that this is not a confirmed place, does not reserve a seat and does not request payment.
- The lead remains the source of truth in the existing admin pipeline; email delivery failure is recorded server-side and does not discard a successfully saved enquiry.

### First launch candidate

- The only public Focus Group is **IGCSE Chemistry**, for Years 10–11, at Calle Asura / Arturo Soria.
- The public page states the maximum of six students, 50-minute TAA time blocks and €40 per session.
- It does not claim a named school affiliation, a specific exam-board guarantee, a confirmed place, or any unapproved teacher credential.
- The dedicated interest form records a normal TAA lead labelled `focus_group` and `igcse_chemistry`, including school, Year 10/11, session preference and support context; group composition and payment confirmation remain deliberate staff decisions.
- The homepage now gives this single launch offer one compact announcement immediately below the core Homework Club hero, while retaining the fuller comparison within “More ways we can help” further down the page. The primary navigation and core hero remain unchanged.

### AI and monthly family updates — deferred, gated work

End-to-end testing of monthly family-update drafting will be scheduled only after Vercel AI Gateway is enabled and approved. A later change may add a reviewed Resend sending action and branded email formatting. It must include data-protection/safeguarding review, a confirmed sender configuration, explicit user confirmation immediately before each external send, audit logging and end-to-end verification. No automatic family email is enabled by this work.

## 30 September 2026 — Controlled Restart baseline completed

### Decision

The current admin and operations build is closed as the production baseline before any Focus Groups work begins. The release is deliberately operational-first and does not change TAA's public core proposition.

### Included operating workflows

- The dated delivery board keeps scheduled tables visible whether booked or empty, with independent table time and session-type controls, named seats, attendance, and ad-hoc learner assignment.
- The family pipeline uses responsive data tables and expandable actions for lead follow-up, manually confirmed payment, dated seat activation, and the existing lead-to-learner lifecycle.
- Learner records provide personal context, goals, attendance, dated internal teacher updates, and visible saving/confirmation feedback for the principal record actions.
- Teacher session notes are internal operational evidence. Management can create a reviewable monthly family-update draft and an internal teaching plan from the verified timeline; this workspace does not send an email automatically.
- Renewals now remain within a dedicated renewal workflow: staff can record contact, payment confirmation, continuation, or a non-renewal without treating a family as a new enquiry.

### Operating safeguards

- Payment confirmation remains an explicit staff action. It creates the paid learner, standing place, entitlement and dated seats; it does not send a parent email automatically.
- AI is limited to human-reviewed drafting from dated teacher evidence. It does not diagnose, make high-stakes learner decisions, or communicate with parents without a separate reviewed send action.
- The live Supabase schema includes the corresponding learner, delivery, payment, placement and renewal migrations.

### Next boundary

Focus Groups is a separate, planned product build. It will extend the existing enquiry/lead model only after architecture review and approval; it must not introduce a parallel parent, payment, learner or placement system.

## 17 September 2026 — Safe Agentic Development architecture

### Decision

TAA will use a controlled AI-assisted engineering workflow rather than direct prompt-to-production development.

### Standard workflow

Discover → Plan → Approve → Build → Test → Independent Review → Preview → Human Acceptance → Release.

### Agent roles

The engineering process distinguishes Product Architect, Developer Agent, QA Agent, Security Reviewer, and Release Reviewer responsibilities. The same underlying AI system may perform multiple roles at different stages, but the implementing agent is not treated as sufficient independent review.

### Repository knowledge architecture

- `AGENTS.md` holds permanent repository engineering/agent rules.
- `docs/engineering/agentic-development.md` holds the engineering workflow and role architecture.
- `docs/security/security-model.md` holds security, data, Supabase, safeguarding, and AI boundaries.
- `specs/` holds testable feature contracts.
- `.github/pull_request_template.md` makes verification/security evidence part of the PR workflow.

### Environment and production boundary

Development should use synthetic data and a local/preview/production separation. Production learner data is not a convenience test fixture. Destructive production data changes, material RLS/authorization changes, authentication changes, and AI processing of identifiable learner data require explicit human approval and appropriate safeguards.

### Founder workflow

“Start the next slice” means product/architecture discovery and planning first. “Dev it” means implement the approved plan on a branch and perform tests/review. “Release it” means verify checks, preview acceptance, migration/config implications, and rollback readiness before production.

### Rationale

The founder is using AI to build software without relying on manual line-by-line expert code review. TAA also handles child/family information. The system therefore shifts assurance toward explicit specifications, least privilege, database/server authorization, automated tests, independent review, preview deployments, and human product acceptance.

## 17 September 2026 — Operations model direction

The launch timetable will distinguish TAA1 recurring group slots from dated Tutor Room one-to-one bookings. Future development will introduce a formal Buildings → Rooms → Teachers hierarchy when additional staff or sites make that structure operationally necessary.

## 22 September 2026 — Academy-linked delivery recovery

### Decision

The operational model now links recurring timetable slots, accepted bookings, standing places and dated delivery sessions to real Academy table records. Table capacity is enforced in the database, and active Academy configuration cannot be archived while active timetable records depend on it.

### Delivery and enrolment

- Payment activation prepares dated delivery sessions and seats for the covered paid dates.
- A learner may hold more than one recurring booking when the day/time/table slot differs.
- Child age is optional at enquiry/enrolment and can be completed later by the parent or staff.
- Existing family records were backfilled only with founder-supplied operational details.

### Recovery note

These production migrations were applied before the matching source branch was committed. This recovery commit reconciles source control with the live schema; preview verification and review are required before release.

## 22 September 2026 — Operations-first admin flow

### Decision

The primary admin route is now a teacher-facing dated delivery board rather than launch-demand analytics. It presents sessions in chronological order with the assigned teacher, session type, start/end time, named paid seats and attendance controls.

### Navigation

The active launch flow is Today, Leads, Learners and Academy Setup. Operations and Trends are removed from active navigation because they overlap the delivery board/learner records or depend on analytics not yet mature enough to drive decisions.

### Payment and booking

Payment activation of an accepted family place remains the operational source of truth. It creates dated paid seats; a generic "set paid weekly place" form is not part of the frontline workflow. Admins may make an explicit last-minute paid booking from a dated session where capacity remains.

### Data-integrity follow-up

The source migration for this slice changes attendance uniqueness from learner/date to delivery-session/learner/date. It is required before a production release because a learner can correctly attend more than one booked session on a day.


## 23 September 2026 — Enrolment workflow simplified to founder-led manual communication

### Decision

TAA will not require prospective families to use an automated place-offer or bank-transfer email flow at launch. A founder or staff member communicates personally, confirms the transfer manually, then records the paid recurring seat, payment date and service start/end dates in one admin action.

### Product and operational effect

- The primary Leads workflow is now **Record payment and activate a seat**.
- Leads is the single operational payment-entry point. The Payments route is deliberately removed from active navigation until it is redesigned as a read-only audit view.
- Seat choices show only the selected table's configured capacity; occupied recurring seats remain visible as disabled **taken** choices.
- Each occupied seat identifies the learner holding it, so capacity decisions are auditable without leaving the enrolment form.
- Dated seats are created with an explicit insert-or-update check rather than an invalid partial-index upsert, preventing payment activation from failing after the payment record has been created.
- Recording payment creates the learner, standing place, payment entitlement and dated delivery seats; no parent email is sent automatically.
- Automated offers and secure onboarding are retained as optional future infrastructure, but removed from the active admin navigation.
- Parent portal access will be granted deliberately when the evidence-led parent surface is ready, rather than being coupled to payment activation.

### Rationale

At launch, personal communication is a premium part of the service and manual reconciliation is proportionate to expected lead volume. TAA needs a dependable internal record more than a complex sales funnel.

## 23 September 2026 — Parent place offer, manual payment and secure onboarding

### Superseded decision

TAA will use a manual bank-transfer flow in the first release rather than Stripe. Resend is the transactional-email provider. An offered place is not activated by sending an email or by a parent clicking a link; it is activated only after a staff member reconciles the payment.

### Workflow

1. Staff create a time-limited offer containing the specific recurring seat, service period, price and unique bank-transfer reference.
2. Resend sends the parent branded payment instructions and a secure offer link.
3. The place remains held while payment awaits manual reconciliation.
4. After staff confirm payment, TAA activates the learner/place and sends a one-time Supabase magic login link through Resend.
5. The parent can access only their own family’s records. Future learning updates remain human-reviewed before any notification is sent.

### Safeguarding and data boundary

- No password or sensitive learning content is sent by email.
- Offer links use stored hashes, expire, and are not enumerable.
- Parent access is an explicit family-email-to-auth-user mapping; arbitrary sign-in must not create access to a learner.
- All offer, payment and email events retain timestamps and staff attribution.
- The first parent surface is intentionally minimal: secure access and operational reassurance. It is not a scored performance dashboard or an AI assessment feature.

### Historical roadmap effect

This is Phase 1 operating infrastructure that prepares, but does not replace, Phase 2’s evidence-led parent experience.

## 2 October 2026 — Unified exact-date paid-period builder

- Family Pipeline payment activation and Renewals now share one exact-date paid-period interaction.
- Expected recurring service dates preload from the learner's agreed/active standing place; Academy closures are visibly blocked with their reasons, while open-date replacements are explicit.
- Selected sessions retain learner, placement, date, table, time, seat, delivery metadata, copied per-session price and recurring/replacement status.
- Renewal quotes and editable parent renewal drafts are calculated from the exact selected sessions.
- Cleared-payment activation revalidates closures and dated seat availability before creating Operations seats; the existing explicit date-bounded `payment_pending` continuation remains the only unpaid exception.
- Existing renewal JSON remains readable; historical payment and attendance records are not rewritten.
- Payment entitlement exact-session storage is introduced additively; period start/end remain derived audit/compatibility fields.

- Applied the additive exact-paid-period entitlement migration to the connected Supabase project so `payment_entitlements` and `child_payment_entitlements` can store the selected-session payload used by the preview.
- Removed the single orphan `accepted_awaiting_payment` booking created by the failed preview submission.
- Hardened manual payment activation so a temporary recurring-seat hold is automatically rolled back if the payment entitlement write fails, preventing the same partial-record state from being left behind.

- Fixed dated Operations-seat creation to avoid PostgREST `ON CONFLICT` against partial unique indexes. The paid-period activation path now reuses an existing active learner/session seat when present, otherwise performs a normal insert and relies on the existing partial uniqueness constraints for race-safe conflict detection.
- Reset the affected test family back to its pre-payment baseline after the failed preview activation: no accepted booking, learner, payment entitlement or standing placement remains for the test attempt; the parent lead remains `contacted`.


## 2 October 2026 — First-come-first-served dated capacity

- Corrected the paid-period model so numbered seats are no longer treated as learner-owned recurring reservations.
- Family Pipeline no longer asks staff to choose a recurring seat before payment.
- Renewal drafts no longer inherit/display a standing-placement seat as reserved.
- Capacity is checked against actual dated Operations seats for the selected table/time.
- Cleared payment assigns the first available seat independently on each paid date; unpaid renewals reserve nothing.
- Payment-pending continuation remains an explicit date-bounded exception and now allocates available dated capacity dynamically instead of relying on a standing seat number.
- Existing standing-placement seat values are retained as compatibility/history data for now and are ignored by the new paid-period allocation path.
