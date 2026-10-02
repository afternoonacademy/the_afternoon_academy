# Unified Paid-Period Builder

_Status: implementation slice — 2 October 2026._

## Goal

Use one exact-date paid-period workflow for Family Pipeline payment activation and Renewals. Exact selected service sessions are the operational source of truth for price calculation, renewal communication, payment entitlement metadata, dated delivery sessions and dated Operations seats.

## Non-goals

- No automated payment reconciliation.
- No new enquiry, learner, payment or delivery subsystem.
- No automatic learner-group reassignment when a specialist price plan is chosen.
- No rewriting of historical attendance, payment or renewal records.
- No change to the explicit, date-bounded `payment_pending` renewal-continuity workflow.

## Existing implementation inspected

The slice builds on the existing manual lead → payment → learner lifecycle, `standing_placements`, reusable `session_price_plans`, `academy_closures`, `renewal_cases.selected_sessions`, `payment_entitlements`, `child_payment_entitlements`, `delivery_sessions` and `delivery_seats`.

## Implementation

- Shared domain model: `lib/paid-period.ts`.
- Shared calendar/session builder: `components/admin/paid-period-builder.tsx`.
- Shared server validation/activation actions: `actions/paid-period.ts`.
- Family Pipeline chooses child + recurring table/time + seat + price plan, then exact paid dates.
- Renewals preload each learner's active standing place and next expected recurring dates, with visible Academy closures and explicit replacement dates.
- Selected sessions retain learner, placement, date, table, time, seat, delivery metadata, copied price and recurring/replacement status.
- `period_start` and `period_end` are derived from the selected sessions.

## Data / migration impact

Migration `20261001154500_add_exact_paid_period_sessions.sql` adds nullable JSONB selected-session metadata and counts to family and child payment entitlements. Existing rows are untouched. Existing renewal JSON remains readable; legacy date/time/price selections are displayed and are replaced only when staff explicitly resave the working renewal through the new builder.

## Authorization

All mutations remain protected by `requireAdmin()` and use the existing trusted server Supabase service path. No new browser-level write access or RLS bypass is introduced.

## Privacy / safeguarding

The builder displays only operational learner identity, placement and billing data already available to admins. No data is sent to an AI provider or external system by this slice.

## Failure modes

- Academy closure selected: rejected with the date and closure reason.
- Dated seat occupied: rejected with table/seat/date/time context.
- Duplicate learner/session selection: rejected.
- Recurring seat already held during initial activation: rejected.
- Price plan archived or placement changed between selection and submit: rejected.
- Payment remains manual; dated paid Operations seats are not intentionally created before confirmation.
- Existing payment-pending continuation remains the only explicit unpaid exception.

## Acceptance criteria

1. Family Pipeline no longer asks the admin to type/select a separate weekday as the primary paid-period interaction.
2. Expected recurring dates preload from the chosen place.
3. Academy closures are blocked and visibly named with their reasons.
4. Admin may deselect recurring dates and add an open-date replacement.
5. Selected dates are grouped by learner and show table, time, seat, type and copied per-session price.
6. Total is calculated from exact selected sessions.
7. Renewals show the last paid service date and next suggested period.
8. Changing a renewal price plan does not move table/time/seat.
9. Server validation re-checks closures, placement/plan identity, duplicate allocation and dated seat availability.
10. Submit actions show pending state and visible success/error feedback.
11. Legacy renewal selections remain readable.
12. Main/production is not merged or released before founder preview acceptance.

## Tests

- Typecheck and production build.
- ESLint.
- Manual desktop/mobile Family Pipeline and Renewal rendering.
- Closure blocked-date behavior.
- Recurring deselection and replacement selection.
- Occupied-seat error behavior.
- Renewal email draft generated from exact sessions.
- Cleared-payment activation uses the same selected sessions.
- Existing `payment_pending` continuation remains operational.
- Supabase security advisors checked separately from pre-existing findings.

## Rollback

The UI/action commits can be reverted independently. The migration is additive and nullable; if already applied, the new columns can safely remain unused during rollback. No historical rows are rewritten.


## Seat / capacity semantics — 2 October 2026

Seats are operational capacity markers, not learner-owned recurring reservations.

- A standing placement preserves learner, table, time, focus and price-plan defaults, but does not reserve a numbered seat for an unpaid future period.
- Renewal drafts must not display an inherited seat as though it were reserved.
- Capacity is validated per exact dated table/time.
- When cleared payment is recorded, the system assigns the first available numbered Operations seat for each selected date. The number may differ from date to date.
- Unpaid renewal cases reserve no Operations capacity.
- The existing explicit, date-bounded `payment_pending` continuation remains the only unpaid exception and dynamically allocates an available dated seat.
- Existing historical standing-placement seat numbers remain readable for compatibility but are not used as a reservation by the unified paid-period flow.


## Renewal capacity continuity — 2 October 2026

The earlier rule that an unpaid renewal reserves no recurring capacity has been superseded for existing recurring learners.

- A paid learner's explicit recurring capacity hold persists after their last paid service date while the standing placement remains active.
- The expiry of a payment entitlement does not by itself free the recurring place.
- A renewal uses the same exact-date planning, email and cleared-payment pattern as an initial booking, but starts from the already-reserved recurring place.
- New-family place planning must treat those recurring holds as occupied capacity.
- Capacity is returned only when an admin explicitly releases the recurring place for cancellation/non-payment/timetable exit. The release reason is retained on the renewal case.
- Dated Operations attendance is still created only for paid dates (or the existing explicit date-bounded payment-pending continuation exception). Recurring capacity reservation and dated paid attendance remain distinct concepts.


## Operations expectation while renewal is unpaid — 2 October 2026

Recurring capacity continuity also governs the dated Operations view:

- An active standing placement remains an expected learner on its matching weekday/table/time after the last paid date, until staff explicitly release the recurring place.
- Operations must show that learner as **Renewal due · place held** and count them against capacity.
- This expected appearance must not create or imply a paid entitlement.
- If a teacher records attendance before payment clears, the system may materialise the dated seat as `payment_pending` so attendance has a real delivery-session reference.
- When payment later clears, the existing dated learner seat is upgraded to `scheduled` rather than duplicated.
- Capacity validation for any new paid/planned learner must include active standing placements, not only already-created dated seats.
- Releasing the recurring place removes future renewal-due expectations and cancels future `payment_pending` seats, while preserving historical attendance.


## Multi-day learner interaction — 2 October 2026

A learner with more than one recurring place must not receive one independent date picker per weekday.

- The paid-period builder groups all active/agreed recurring places for the learner into one calendar.
- Expected dates from every recurring place are preselected.
- Each selected session retains its own placement ID, date, table, time, price plan, copied price and recurring/replacement flag.
- The selected-session list must identify the exact table/time for every date.
- An open-date replacement must identify which recurring place it replaces. The UI must also support a replacement on a date already selected for another recurring place.
- Initial offers and renewals use the same calendar behavior.
- A first-time child may have multiple planned recurring bookings before contact. Those bookings are emailed as one combined offer and activated together only after cleared payment is confirmed.
- Renewal email date lines include the exact table/time so parents and staff can distinguish different recurring days.
