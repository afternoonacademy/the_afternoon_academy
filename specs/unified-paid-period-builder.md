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
