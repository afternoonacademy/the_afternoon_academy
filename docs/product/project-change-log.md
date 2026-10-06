# The Afternoon Academy — Project Change Log

## 6 October 2026 — Lightweight parent registration & authorisation tracking

### Release candidate

- Added a family-level **Documents & authorisations** panel for the existing Parent Registration & Authorisation Form.
- Admin can send the existing Adobe Web Form link through TAA's Resend transactional-email path, see the latest delivery state, resend while outstanding, open the Adobe form, and manually record a verified signed date.
- Existing externally completed forms can be marked signed without sending a new request, preserving the current Anastasia-style historical workflow.
- Reusable registration-email subject/body is editable in Academy Setup alongside the existing planned-place and renewal templates.
- TAA records only the operational request/signature status; Adobe remains responsible for the actual electronic-signature ceremony.
- Added a dedicated family-document record so a future signing-provider API can automate the same state instead of introducing a second document workflow.
- Paid Adobe/PandaDoc API integration remains deferred until Academy volume justifies it.

## 6 October 2026 — Role-aware operations, family pipeline and finance dashboard

### Production release

- Capability-based authorization now supports Admin, Teacher and Parent roles. There is no Child role.
- Admin retains the full internal capability set. Teacher is restricted to Operations and Learner Records teaching workflows; Parent has no internal `/admin` access.
- `/admin` is now role-aware: Admin lands on **Finance & metrics** and Teacher lands on **Operations Hub**.
- Commercial KPI data moved out of Operations Hub into the Admin-only **Finance & metrics** page.
- Finance & metrics includes paid cash revenue, active family/learner counts, paid-session and recurring-capacity measures, renewal/pending-value signals, monthly revenue, lifetime revenue, average customer lifetime value and revenue-by-family lifetime history.
- Family Pipeline now groups lead children under one parent/family row. Lead counts therefore represent unique parent/family records rather than child records.
- Customers are unique active families with current or upcoming recurring places. Families remain Customers while in renewal; Renewals is an overlapping action subset, not a mutually exclusive customer state.
- Customer rows visibly flag learners in renewal using the paid-through status badge.
- Pre-conversion lead details can be corrected from Family Pipeline. Shared parent/contact details and eligible child/timetable details may change, but lifecycle, payment, booking and sent-communication history are preserved.
- A family/lead record is not the same thing as an authenticated parent portal account. Parent portal access remains a separate concern.
- Production data cleanup consolidated duplicate family lead records for multi-child families and removed orphan renewal artifacts without changing legitimate paid history.
- Release verification: final preview passed 69/69 automated tests, Next.js production compilation and TypeScript, then production deployed successfully from `main`.

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


## 2 October 2026 — Child-specific reusable public lead form

- Replaced the legacy abbreviated “another child” section with a reusable full child block.
- Families can add/remove children before one final submission.
- Each child now carries independent support needs, curriculum, school/year, preferred days/times/frequency and notes.
- Added IGCSE Chemistry as a child-specific support option with optional course/exam-board context.
- Added child-level `school_name` storage while retaining parent-level `school_name` only for legacy compatibility.
- Confirmation/admin enquiry emails now summarise every child separately instead of copying the first child’s requirements across siblings.


## 2 October 2026 — Child-first Family Pipeline

- Moved the Family follow-up queue ahead of payment activation so staff review the child request before recording funds.
- Added child name, support requirement and requested sessions-per-week directly to the follow-up table.
- Added **Add payment & dates** beside **Details** on each child row and removed the separate active family-level payment table.
- Initial payment activation is now explicitly child-scoped; siblings can be offered and activated separately.
- Recording payment for one child no longer marks the whole family converted. The parent lead converts only after all children on that family enquiry have at least one paid child entitlement.


- Compacted the Family follow-up table so the visible row shows only contact, child/age and support. Availability, weekly frequency, school/curriculum, notes, follow-up actions and **Add payment & dates** now sit inside the expanded Details row, removing the page-level horizontal scrollbar and forcing detail review before payment activation.


## 2 October 2026 — Separate place planning, parent contact and payment

- Replaced the combined initial “record payment + activate place” interaction with a child-level staged lifecycle: **Lead received → Session planned → Contacted / awaiting payment → Paid**.
- Added child-level pipeline status so siblings can be at different operational stages.
- Added an explicit planned recurring-capacity record using `accepted_bookings`; planning stores table/time, price plan, capacity seat and proposed exact service dates but creates no payment entitlement and no dated Operations attendance.
- Added a visible seat-capacity map showing paid/planned/contacted child names and available capacity positions. Seat numbers remain capacity markers rather than fixed physical chairs.
- Added **Record planned place**, **Email planned place to parent**, **Release place**, and separate **Confirm payment & activate paid dates** actions.
- Planned-place email success advances only that child to contacted; send failure leaves the child at session planned.
- Payment confirmation now requires a saved contacted planned place, then creates the paid entitlement, learner/standing placement as needed, dated Operations places, marks the recurring capacity record paid-active and advances the child to paid.
- Parent/family conversion still occurs only after every child in that enquiry is paid.
- Added additive schema fields for child pipeline state and planned-place quote/session metadata; existing historical booking/payment records remain readable.


- Added the initial planned-place/payment-request email to Academy Setup → Email templates. The Family Pipeline now renders the actual outgoing subject/body from the stored `planned_place_offer` template; a successful send still advances only that child from **Session planned** to **Contacted — awaiting payment**.


- Simplified the cleared-payment step for initial child activation. After the place has been planned and the parent contacted, the admin now sees a read-only summary of child, table/time, price plan, planned dates, session count and total, plus payment received date and one cleared-payment confirmation checkbox. The planning calendar/selectors are no longer repeated at payment confirmation.


## 2 October 2026 — Renewals unified into Family Pipeline

- Added **3 · Needs renewal** to Family Pipeline and moved the active renewal workflow there; `/admin/renewals` now routes to that section instead of maintaining a parallel admin process.
- Renewals are now child/learner-specific rather than family-wide, so siblings can renew independently.
- Renewal stages mirror initial booking: **Needs renewal → Renewal planned → Contacted — awaiting payment → Paid**.
- The learner's recurring capacity remains reserved after the final paid date through the existing paid-active recurring booking/standing placement. Expiry of the paid period alone does not free capacity.
- Added an explicit **Release recurring place** action with a required reason. It cancels the recurring capacity booking and ends the active standing placement; this is the only normal route for returning that recurring capacity to availability after cancellation or non-payment.
- Renewal planning reuses the current table/time and price plan by default, applies Academy closures, saves exact proposed dates, and prepares the existing Academy Setup renewal email template.
- Renewal email success advances the case to awaiting payment; cleared payment uses a compact summary/confirmation and activates the exact dated Operations seats.
- Existing historical family-level renewal rows remain readable in the database; new renewal cases are learner-scoped using additive learner_id / standing_placement_id metadata.


## 2 October 2026 — Four-queue Family Pipeline

- Removed **Renewals** from the admin sidebar; the historical `/admin/renewals` route remains only as a redirect into Family Pipeline.
- Reframed Family Pipeline as four mutually exclusive operational queues: **Leads**, **Customers**, **Renewals**, and **Closed / archived**.
- Leads now exclude any child already represented by an active learner or current renewal, preventing duplicate appearances with stale/different statuses.
- Customers shows active recurring learners outside the renewal window with parent/email, recurring place and current paid-through date.
- Renewals shows active learners whose paid period is due/overdue and preserves their recurring capacity until paid or explicitly released.
- Closed / archived preserves closed lead history plus learners whose renewal place was explicitly released/cancelled; historical learner records remain accessible.
- Renewal discovery now includes all overdue active learners, not only those whose previous paid period ended within the prior 120 days.

<!-- Preview rebuild trigger: 2026-10-02 -->


## 2 October 2026 — Renewal-due learners remain visible in Operations

- Operations now surfaces active recurring learners on matching future service dates even when their latest paid entitlement has expired, provided their standing placement has not been released.
- Renewal-due learners are labelled **Renewal due · place held**, count against table capacity, and remain available for Present/Absent attendance so teachers see the real expected room.
- Viewing a day does not create fake payment records. A renewal-due seat is only materialised as `payment_pending` when attendance is recorded; the payment entitlement remains unpaid.
- Dated capacity validation now counts active standing placements as reserved capacity and avoids allocating a new paid learner into capacity held by a recurring learner.
- New initial standing placements retain the planned capacity-seat marker so future renewal capacity can be represented consistently.
- Releasing a recurring place cancels future `payment_pending` Operations seats while preserving historical attendance/payment records.

<!-- Operations renewal expectation preview trigger -->


- Added a read-only **Current booking & payment** summary at the top of each Learner Workspace. It shows learner/year, active recurring place(s), current price plan/session price, payment/renewal status, paid-through date and exact booked paid dates where available. Renewal-due/payment-pending learners also show that their recurring place remains held until explicitly released.

<!-- Vercel preview rebuild trigger after learner workspace JSON typing fix -->

<!-- Vercel preview rebuild retry after verified Operations iso helper fix -->


## 2 October 2026 — One calendar per learner across multiple recurring days

- The shared paid-period builder now combines every recurring place for one learner into a single calendar. A learner attending Tuesday and Thursday sees both sets of expected dates preselected in the same calendar.
- Each selected date still retains its exact recurring place, table, time, price plan and replacement status; the selected-date table labels those details explicitly.
- Open-date replacements require an explicit recurring place. A replacement can also be added by date even when that date is already selected for another recurring day.
- Initial Family Pipeline planning now supports multiple recurring days for one child before the parent is contacted. Staff can add/remove recurring place rows, choose capacity seats and price plans per place, then review one combined date calendar and total.
- The initial planned-place email now combines all recurring places and exact service dates in one message. The default template wording is multi-day aware; existing admin-customized templates are not overwritten.
- Cleared initial payment activates every saved recurring place for the child in one payment action, creates one standing placement per recurring day and creates the exact dated Operations seats from the combined selected-session set.
- Renewals use the same one-calendar interaction across all of the learner's active standing places. Renewal email date lines include the table and time so multi-day attendance is unambiguous.

<!-- Multi-day learner planner preview trigger -->

<!-- Multi-day learner planner final preview retry -->


## 2 October 2026 — Safer multi-day paid-period editing

- Replaced the fragile multi-day replacement selector with a recurring-place switcher at the learner level.
- For a learner attending multiple days, admin now chooses the active weekday/time/table first; the calendar only permits edits to that recurring place.
- Each switcher button shows its selected-date count, making missing dates easier to spot.
- Replacement dates are automatically assigned to the active recurring place, eliminating the separate “replacement applies to” selector.
- The complete selected-date table remains visible across all recurring places and supports explicit removal of individual dates.
- The same interaction is used by initial Family Pipeline offers and renewals through the shared paid-period builder.


## 2 October 2026 — Saved plan collapses to next-step summary

- After **Record renewal plan** succeeds, the date editor now collapses automatically and the saved renewal summary remains visible with the next action to contact the parent.
- **Edit renewal plan** reopens the planner explicitly; saving again collapses it back to the summary.
- Initial Family Pipeline place planning follows the same save → collapse → summary → next-action interaction.
- Shared save actions now refresh server data after success while preserving visible success feedback and duplicate-submit protection.


## 2 October 2026 — Operations seat labels clarified

- Occupied Operations tiles now show the actual capacity marker explicitly as **Seat N**.
- Learner year group is labelled as **Year N** (or “Year group not recorded”) instead of appearing as a bare number underneath the learner name.
- This removes the ambiguity where a year-group value such as `3` or `4` could be mistaken for the learner's seat number, while available tiles continue to show the same Seat N numbering.


## 2 October 2026 — Admin helper text moved to contextual info tips

- Introduced a reusable admin information control using the existing shadcn/Radix popover pattern and a circled information icon.
- Desktop users can reveal explanatory helper copy by hovering the icon; touch/mobile users can tap the icon to open the same explanation.
- Removed persistent descriptive paragraphs from the main Operations room header, Family Pipeline section headers, renewal workflow steps, initial booking next-step panels and the shared paid-period calendar introduction.
- Operational state labels, warnings, errors, empty states and data required to make a decision remain visible rather than being hidden in tooltips.


## 2 October 2026 — Learner workspace seat and year labels

- The learner workspace now displays the retained recurring **Seat N** alongside each weekday, time and table in Current booking & payment.
- Year groups in the learner workspace are rendered explicitly as **Year N** rather than a bare number, matching the clarified Operations convention.

<!-- Combined admin UX preview retry after rate-limit window -->


## 2 October 2026 — Renewal email review before send

- The Renewal **Contact parent** step now shows the exact current email that will be sent, including recipient, subject and fully rendered message.
- The preview is generated from the current Academy Setup renewal template plus the learner's saved exact renewal sessions, so stale previously generated draft wording is not shown to staff.
- Admin can choose **Edit email** to change the subject or body for that individual send. Cancelling the edit restores the current template-generated version.
- Per-send edits do not overwrite the Academy Setup template.
- The send action receives exactly the subject/body displayed in the preview, reducing the chance of silently sending an older draft.

<!-- Retry preview after renewal email parser fix -->

<!-- Retry preview after Vercel build-rate window -->

## 2 October 2026 — Renewal bank-transfer details

- Renewal parent emails now render bank-transfer details from server-side Vercel environment variables: `TAA_BUSINESS_NAME`, `TAA_BANK_ACCOUNT_NAME` and `TAA_BANK_IBAN`.
- The payment reference is the learner name shown on the renewal.
- Academy Setup's renewal template now includes the `{{payment_details}}` placeholder, so admins see the exact bank details in the Contact parent preview before sending.

<!-- Trigger preview build for renewal bank-details email review -->


## 2 October 2026 — Renewal recurring-day labels

- The renewal capacity summary now includes the learner's recurring weekday(s) directly in the **Recurring place remains reserved** heading, for example **Recurring place remains reserved · Tuesday & Thursday**.
- Each recurring-place card also includes its weekday alongside table and time so the held capacity is immediately identifiable.

## 2 October 2026 — Saved renewal weekday recall

- Saved renewal-plan date chips now include the weekday before each date, alongside table and start time, matching the recurring-place summary for faster admin recall.

<!-- Trigger Vercel preview for renewal weekday quick-recall changes -->


## 2 October 2026 — Family communications delivery tracking

- Extended the existing `email_delivery_log` rather than introducing a parallel communications system. Every communication remains anchored to `parent_lead_id`, with optional child, learner and renewal-case context.
- Added a service-role-only `email_delivery_events` audit table and a signed Resend webhook endpoint for sent, delivered, delayed, bounced and failed outcomes.
- TAA explicitly ignores open/click webhook events; no parent engagement tracking was added.
- Public enquiry acknowledgement emails are now retained as family communications before a learner exists.
- Planned-place, legacy place-offer and renewal emails retain child/learner context and exact subject/body where available.
- Family Pipeline lead Details now includes a chronological **Family communications** history.
- Learner Workspace now includes the same parent/family communication history after conversion.
- Renewal rows surface the active renewal email delivery result so bounced/failed delivery is immediately visible to admin.
- Delivery webhook verification requires server-only `RESEND_WEBHOOK_SECRET`; the endpoint does not process unsigned events.

<!-- Trigger family communications preview build -->

<!-- Retry family communications preview after Resend integration -->

- Suppressed delivery is also tracked as an actionable failure state, alongside bounce/failed/delayed outcomes.


## 2 October 2026 — Controlled Restart release closure

### Release decision

Founder acceptance has been given for the unified Family Pipeline / renewal / communications work as one completed release slice. The release baseline is the unified family operations and communications implementation now on `main`.

### Production preparation

- The connected production Supabase project has been advanced through the remaining additive 2 October migrations for child place planning, planned-place email templates, child-level renewal capacity, multi-day offer wording and family communication delivery tracking.
- Those migrations preserve the existing manual payment-confirmation boundary and historical records.
- The newest Vercel build for `main` is currently blocked by the account build-rate limit rather than an application build error.
- The latest READY preview at runtime commit `8ead2a5` contains the same application code as the release baseline; later differences were documentation-only at the time of release review.
- Production application promotion therefore remains a release-operation step once Vercel permits the promotion/rebuild. Do not describe the application release as live until the production alias/deployment is confirmed.

### Documentation close-out

- Restored `AGENTS.md` as the permanent repository engineering/agent rules file.
- Marked the controlled-restart launch-operations work as completed in the roadmap.
- Left the next Phase 1 work explicit rather than treating the whole product roadmap as complete.


## 3 October 2026 — Renewal payment can bypass reminder email

- Added **Payment already received** to the saved renewal-plan stage for parents who pay before a reminder is sent.
- The action deliberately skips Resend and creates no renewal email history; it runs the same cleared-payment activation against the saved exact dates.
- Successful payment closes the expanded renewal row and returns the learner to the paid customer state after refresh.
- Hardened family-level payment entitlement handling for sibling renewals that cover the same period: each learner keeps an independent child entitlement while the family payment audit now combines both learners' exact sessions and total instead of being overwritten by the second payment confirmation.


## 3 October 2026 — Renewal queue uses true latest paid period

- Fixed Family Pipeline renewal discovery so it chooses each learner's latest paid child entitlement before applying the renewal-window cutoff.
- Previously, the query discarded paid periods beyond the 21-day renewal horizon first. A learner renewed through a later date could therefore fall back to an older expired entitlement and immediately remain in the Renewals queue.
- After cleared renewal payment, a learner whose new paid-through date is outside the renewal window now leaves Renewals and returns to Customers with the new paid-through date visible.


## 3 October 2026 — English/Spanish Focus Group parity

- Brought the Spanish homepage into product parity with the English homepage for the IGCSE Chemistry Focus Group.
- Added the Spanish public route `/es/focus-groups/igcse-chemistry` with equivalent pricing, suitability, benefits, location and interest-registration content.
- Paired the English and Spanish Focus Group pages with direct locale switching and language alternates.
- Localized the Focus Group interest form, validation feedback, parent acknowledgement email and Spanish thank-you routing while retaining the same existing lead/family data model.
- Clarified on both homepages that the Homework Club serves ages 4–12 while the IGCSE Chemistry Focus Group serves Years 10–11.
- Confirmed both main homepages continue to use the same multi-child family enquiry form, so siblings can be included in one submission with independent requirements.


## 5 October 2026 — Admin family lead entry matches public multi-child model

- Upgraded **Add family lead** so staff can record multiple children under one parent/family enquiry.
- Each child is written as an independent `child_leads` record with its own support needs, curriculum, school context and timetable preferences, matching the public family-enquiry data model.
- Added the same support-type choices used on the public enquiry form, including General Homework Support, IGCSE Chemistry and 1-to-1 support.
- Added **Add another child** / remove-child controls for admin entry.
- Added a visible pending state with spinner and disabled controls while the family lead is being saved, then returns the admin to Family Pipeline on success.
- Confirmed the public English and Spanish landing-page forms already create one parent lead plus a separate child lead and timetable-preference record for each child submitted in the same family form.


## 5 October 2026 — Remove 21-day early renewal window

- Changed Family Pipeline renewal eligibility from 21 days before paid-through to the learner's final paid date.
- Fully paid learners now remain in **Customers** until their current paid period reaches its final date.
- On the final paid date they enter **Renewals → Needs renewal**; after the paid period ends, Operations can continue to show the recurring capacity as **Renewal due · place held** until payment is recorded or the place is released.
- Added an automated regression test for before / on / after the final paid date, and made the test suite run before production builds.


## 5 October 2026 — Price plan names can repeat

- Removed the database uniqueness rule on `session_price_plans.name`.
- Price plan identity is now the plan ID; the display name is a reusable label.
- This allows plans such as **Private tuition · €30/session** and **Private tuition · €40/session** to coexist as separate commercial rates.
- Existing plan selectors already show the plan name together with the per-session price, so same-name plans remain distinguishable to admins.
- Updated Academy Setup guidance to explain that each rate should be created as its own plan.


## 5 October 2026 — Pre-agreed first-period exceptions

- Kept the recurring place as the long-term source of truth for new leads while allowing the initial planned paid period to contain explicitly agreed one-off dates.
- Initial off-pattern dates are now recorded as `pre_agreed_exception` rather than customer-facing replacements.
- Planned-place emails list the agreed first-period dates without the word **replacement**.
- The initial planning UI now says **Add agreed first-period date** and explains that the date affects only the first paid period and does not alter the recurring schedule.
- Payment activation preserves the pre-agreed exception in the exact paid-session history while the standing placement remains the selected recurring weekday/time.
- Future renewals continue to regenerate from the standing recurring place, so first-period exceptions do not repeat automatically.


## 5 October 2026 — Planned-place email review and compact formatting

- Added an explicit **Review email** step after a planned place is saved, so admins can inspect the generated recipient, subject and full email body before sending.
- Previewing the email does not send anything, create a communication log or change pipeline status.
- Preview and send now use the same shared email builder to prevent content drift.
- Planned service dates are grouped under the session/price-plan name and no longer repeat table number, session type or per-session price on every line.
- Pre-agreed first-period exceptions continue to display as normal dates; genuine later replacements can still show `· replacement`.


## 5 October 2026 — Initial and renewal email attendance alignment

- Added the session start time to every service-date line in both initial planned-place and renewal emails.
- Added the child/learner name to the period heading so parents can see exactly whose schedule is being confirmed.
- Standardised bank-transfer references as child name plus the month/year covered by the period, for example `Mya October 2026`; multi-month periods use an explicit month range.
- Kept the terminology distinction: pre-agreed first-period exceptions are shown as normal dates, while genuine renewal replacements continue to show `· replacement`.
- Initial and renewal emails now share the same compact attendance-information conventions while retaining their different first-period/next-period wording.


## 5 October 2026 — Flexible prepaid session changes and family account

- Added effective-dated future-session changes while retaining upfront payment as the default commercial model.
- Admin may change one future paid session or change the recurring place from an effective date; past/attended sessions remain historical and are not rewritten.
- Cheaper future-session changes create family credit; dearer changes create family balance due.
- Family balances are deliberately managed from the parent/family account and may be applied to either child in the same family only through an explicit admin action.
- Credit/debt does not itself make an otherwise paid learner operationally unpaid and is not silently consumed by a later bill.
- Learner Workspace no longer owns the financial adjustment workflow; it links to the family account.
- Standing placements are interpreted by `effective_from` / `effective_to` so an old and new recurring place are not simultaneously treated as current.
- Current family adjustment history is retained append-only in `parent_leads.account_adjustments`; this is an operational audit store, not permission for future code to overwrite prior entries.

## 5 October 2026 — Academy closure form hardening

- Traced a production `/admin/setup` 500 to an invalid closure date range being thrown through an unguarded server-action form.
- Academy closure entry now uses the standard guarded save form so validation errors are shown to the admin rather than crashing the page.
- Start/end fields are labelled; a blank end date means a one-day closure.
- Reversed ranges are rejected explicitly and regression-tested.

## 5 October 2026 — Parent communication template contract

- Re-established `academy_email_templates` as the source of truth for editable planned-place and renewal wording.
- Added one shared template contract that defines default subject/body text and the complete supported placeholder set used by the renderer and Academy Setup editor.
- Both initial and renewal templates expose `{{period_heading}}`, `{{service_dates}}`, `{{session_count}}`, `{{amount_due}}`, `{{payment_details}}` and `{{payment_reference}}` as appropriate.
- `{{service_dates}}` contains the grouped session name plus each date and start time. Initial pre-agreed exceptions remain unlabelled; genuine later replacements may show `· replacement`.
- `{{payment_details}}` now means bank/business details only; `{{payment_reference}}` is separately editable in template layout and resolves to child/learner name plus the covered month/year.
- Academy Setup now derives its placeholder help and default template text from the same contract as the send renderers, preventing the editor from drifting behind code changes.


## 5 October 2026 — Planned Operations seats and one-off email editing

_Release note: PR #20 merged to the production branch._

- Planned lead places now appear in the Operations Hub on their exact planned service dates before payment, using the saved table, time and seat from the planned-period session list.
- Planned lead seats count against visible room capacity and are labelled **Planned · awaiting payment**. They are not treated as paid learners and do not expose attendance controls until activation creates the learner/delivery seat.
- Actual dated delivery seats remain authoritative; renewal-held and planned lead expectations are supporting occupancy states rather than duplicate paid seats.
- The initial planned-place email review is now editable. The subject/body submitted from Family Pipeline are the exact values sent through Resend and written to the delivery log for that one communication.
- One-off edits do not modify the reusable Academy Setup → Parent communication template.
- Parent payment details now render with explicit semantics: **Bank name: Santander**, **Account name: JADIS SL**, then **IBAN**. The payment reference remains a separate template placeholder.


## 5 October 2026 — Persistent planned-place email drafts

- One-off planned-place email edits in Family Pipeline are now persisted against the child lead and restored when an admin leaves and returns to the page.
- Editing the subject or body auto-saves the draft without changing the reusable Parent Communication template.
- If a saved planned booking is changed after a draft exists, the draft is regenerated from the latest booking information and marked with an admin-visible **Email updated** notice.
- The notice explains that the booking changed and requires the admin to review the regenerated email before sending.
- Sending still uses the exact subject/body shown in Family Pipeline and logs that sent copy in the communication history.


## 5 October 2026 — Mobile admin navigation

- Replaced the compressed mobile admin sidebar with a compact sticky Operations header and a dedicated Menu drawer.
- Mobile navigation now exposes the full admin destination list vertically and closes after a destination is selected.
- Mobile admin scrolling preserves native touch/momentum behaviour while visual scrollbars are hidden at phone widths.
- The desktop left sidebar remains unchanged.
- Reduced the mobile content-shell padding so Operations content starts closer to the header.
- Fixed a Family Pipeline lifecycle gap: paid active learners with an upcoming standing placement now appear in Customers immediately, even before the placement effective date. Operations/attendance still respects the actual placement start date.


## 6 October 2026 — Planning corrections preserve lifecycle

- Editing planned dates or recurring places no longer moves a contacted family backwards to Session planned.
- A contacted child remains Contacted — awaiting payment after booking corrections.
- Parent email is optional before payment: admins may agree dates by phone, WhatsApp, in person or email and then record cleared payment from a valid planned booking.
- Correcting booking information still regenerates the one-off email draft for optional review/resend, without rewriting historical sent-email records.
- Sending a corrected email while already Contacted leaves the lifecycle at Contacted.
