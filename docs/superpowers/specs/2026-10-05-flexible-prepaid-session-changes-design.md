# Flexible Prepaid Session Changes — Design

_Status: proposed architecture for founder review — 5 October 2026._

## Purpose

The Afternoon Academy must remain operationally flexible while preserving its preferred commercial model of charging families upfront.

Parents may begin with one recurring service and later change:

- weekday;
- start time;
- table / delivery group;
- session type;
- price plan;
- or a combination of these.

Examples include moving from Tuesday 18:00 private tuition at €40/session into a lower-priced group, moving from group tuition into a higher-priced private session, or changing only one dated session without changing the learner's normal place.

The system must support these changes without forcing admins to rebuild every attendance date manually, without rewriting historical payment records, and without switching TAA to arrears billing.

## Product decisions

The following founder decisions are locked for this slice.

1. TAA continues to charge upfront by default.
2. Historical dated sessions retain the exact rate originally used. Past or attended sessions are never repriced through this workflow.
3. A learner has one or more recurring places that describe where they normally attend. A recurring place is separate from the exact dated sessions already paid for.
4. Session price plans are reusable commercial rates and do not belong to a specific weekday or time.
5. Admins may change:
   - one future session only; or
   - the learner's recurring place from a chosen effective date onward.
6. Only future, unconsumed sessions are recalculated when a change is made.
7. If the new future sessions cost less than the prepaid sessions they replace, the difference becomes family credit.
8. If the new future sessions cost more, the difference becomes an outstanding family balance due.
9. Family credit and family debt belong to the parent/family account, not exclusively to the child that originated them.
10. Every credit/debt entry retains the originating child and source so the audit trail remains child-specific.
11. Family credit may be applied to any child belonging to the same parent/family.
12. Family debt may likewise be collected against a later payment for any child in that same family.
13. Neither credits nor debts are applied automatically. An admin explicitly chooses when, where and how much to apply.
14. A positive adjustment does not automatically make an otherwise valid dated session operationally unpaid. TAA may allow the changed session to proceed while the additional balance remains outstanding.
15. Admins may request an adjustment payment immediately or carry it forward to a later billing period.
16. Admins may waive or refund an adjustment only through an explicit action with a recorded reason.

## Guiding accounting principle

> Parent/family owns the money. Individual children own the sessions. Exact dated sessions own the historical rate.

The application must therefore keep operational entitlement and family account balance as related but distinct concepts.

## Existing architecture retained

This design extends the existing exact-date paid-period architecture rather than replacing it.

Existing concepts remain authoritative for their current purpose:

- `parent_leads` represents the family / parent account.
- `learners` and `child_leads` preserve the child-specific lifecycle.
- `session_price_plans` contains reusable commercial rates.
- `standing_placements` represents recurring learner capacity / normal attendance.
- `payment_entitlements` and `child_payment_entitlements` represent paid coverage.
- Exact selected-session JSON retains the copied dated price used for quoting, payment and Operations.
- `delivery_sessions` and `delivery_seats` represent dated Operations delivery.
- Academy closures and capacity validation continue to govern eligible dates and seats.

No historical payment, attendance or learner records are replaced by the family-account layer.

## Domain model

### Session rate

A session rate is a reusable commercial option.

Examples:

- General Homework Support · €25/session
- Private Tuition · €30/session
- Private Tuition · €40/session
- IGCSE Chemistry Focus Group · €40/session

The rate record contains commercial identity and price only. Weekday/time/table remain delivery information.

Price-plan display names may repeat. Plan ID is the unique identity.

### Recurring place

A recurring place represents where the learner normally attends from an effective date.

Example:

- Tuesday
- 18:00–18:50
- Tutor Room / selected operational table
- Private Tuition
- €40/session

The existing standing-placement concept remains the base recurring-capacity record.

A permanent change must be effective-dated. Historical recurring-place history must remain readable rather than mutating the old placement into a false representation of the past.

### Exact paid session

Each paid dated session retains:

- learner;
- date;
- table / delivery location;
- start time;
- duration;
- price plan ID;
- copied plan name;
- copied price;
- replacement / recurring context.

Once the session has occurred or is otherwise historical, the copied price is immutable for normal admin workflows.

### Family financial account

A new family-level ledger records monetary adjustments outside the original paid-period amount.

The family account is anchored to `parent_lead_id`.

The balance is derived from immutable ledger entries; it is not maintained as a mutable number that can drift from history.

A family can therefore be:

- settled: €0;
- in credit: TAA owes value to the family;
- outstanding: family owes TAA;
- or have multiple open entries whose net balance is displayed.

Every entry records the child/source that created it even though the balance is family-usable.

## Proposed new data structures

### `family_account_entries`

Append-only ledger table.

Required fields:

- `id uuid primary key`
- `parent_lead_id uuid not null`
- `originating_learner_id uuid null`
- `originating_child_lead_id uuid null`
- `entry_type text not null`
- `amount_cents integer not null`
- `description text not null`
- `source_change_id uuid null`
- `source_payment_entitlement_id uuid null`
- `applied_to_learner_id uuid null`
- `applied_to_child_payment_entitlement_id uuid null`
- `created_by uuid null`
- `created_at timestamptz not null default now()`
- `reason text null`

Signed-value convention:

- positive amount = family owes TAA;
- negative amount = TAA owes / family credit.

Recommended entry types:

- `session_change_charge`
- `session_change_credit`
- `credit_applied`
- `debt_collected`
- `admin_waiver`
- `refund`
- `manual_adjustment`

Entries are never edited to represent later events. Later events append compensating/applying entries.

### `learner_session_changes`

Audit record for a controlled future-session change.

Required fields:

- `id uuid primary key`
- `parent_lead_id uuid not null`
- `learner_id uuid not null`
- `change_scope text not null` — `single_session` or `from_date`
- `effective_date date not null`
- `old_sessions jsonb not null`
- `new_sessions jsonb not null`
- `old_value_cents integer not null`
- `new_value_cents integer not null`
- `difference_cents integer not null`
- `standing_placement_changed boolean not null default false`
- `created_by uuid null`
- `created_at timestamptz not null default now()`
- `reason text null`

This record explains what operational change created the financial adjustment and provides a stable audit source for the ledger.

## Balance derivation

The family account balance is:

`sum(family_account_entries.amount_cents)`

Interpretation:

- `0` = settled;
- greater than `0` = outstanding amount due from family;
- less than `0` = family credit available.

The UI may display credit as an absolute positive value while preserving the signed ledger representation internally.

Example:

1. Alba changes two future €40 sessions into two €25 group sessions.
2. Old value = €80.
3. New value = €50.
4. Difference = `50 - 80 = -30`.
5. Append `session_change_credit` of `-3000`.

Later an admin applies €20 of that credit to Hugo's paid period:

6. Append `credit_applied` of `+2000` linked to Hugo's new child payment entitlement.
7. Remaining family balance = `-1000` = €10 credit.

The original Alba credit entry remains unchanged.

## Change-future-sessions workflow

### Entry point

Learner Workspace receives an explicit **Change future sessions** action.

The admin first chooses one of:

- **This session only**
- **From this date onwards**

### Single-session change

Used for one-off changes such as moving one Tuesday lesson to Thursday.

The admin chooses:

- original future dated session;
- replacement date;
- destination available table/time;
- session rate.

The standing placement is not changed.

The system:

1. verifies the original date is future and not already historically consumed;
2. verifies destination date is not an Academy closure;
3. rechecks destination capacity;
4. calculates the old copied value;
5. calculates the new selected rate;
6. previews the financial difference;
7. on confirmation, records `learner_session_changes`;
8. updates the affected future exact-session representation / Operations booking using the existing safe paid-period allocation path;
9. appends a family-account entry only if the value differs.

### Permanent change from date

Used when the learner's normal service changes.

The admin chooses:

- effective date;
- destination recurring weekday/time/table;
- destination session rate.

The system identifies future, unconsumed paid sessions on or after the effective date that belong to the superseded recurring place.

It then generates equivalent replacement dates for the new recurring place within the already-paid period, subject to:

- Academy closures;
- existing paid-period boundaries;
- date capacity;
- no duplicate learner allocation.

The review screen shows:

- sessions being removed;
- replacement sessions being added;
- old total;
- new total;
- resulting family credit / amount due.

On confirmation:

1. create `learner_session_changes`;
2. end/supersede the old standing placement effective immediately before the new effective date;
3. create a new standing placement effective from the selected date;
4. update only future unconsumed exact sessions;
5. preserve all historical sessions;
6. append the family financial adjustment if non-zero.

## Definition of “future / unconsumed”

A session is eligible for repricing only when all of the following are true:

- service date is on or after the admin's effective date;
- service date has not passed in the Academy's operating timezone;
- attendance has not been recorded as Present or Absent;
- session has not already been otherwise closed as historically delivered.

If attendance history exists, the admin must not be able to reprice it through this workflow.

## Financial handling

### Cheaper replacement

If replacement sessions cost less than the prepaid value they replace:

- changed sessions remain valid;
- difference becomes family credit;
- no automatic refund is issued;
- credit remains available until explicitly applied, refunded or manually adjusted.

### More expensive replacement

If replacement sessions cost more:

- changed sessions may still be confirmed immediately;
- difference becomes family outstanding balance;
- existing prepaid coverage is not relabelled as wholly unpaid;
- admin may:
  - request payment now; or
  - carry balance forward.

The system does not automatically block attendance solely because this adjustment remains outstanding.

### Applying credit

When creating or confirming a future payment, show:

- period subtotal;
- available family credit;
- existing family debt;
- explicit controls to apply selected credit/debt amounts.

Credit may be applied to any child of the same `parent_lead_id`.

Admin must choose the amount.

The action appends an application entry; it does not mutate the original credit entry.

### Collecting outstanding debt

A future billing/payment workflow may include some or all of the family debt.

Admin must explicitly choose the amount.

When payment is confirmed:

- the normal paid-period entitlement records the value attributable to the new child/session period;
- a separate `debt_collected` account entry offsets the historical outstanding balance.

This preserves the difference between “payment for November sessions” and “collection of an October adjustment.”

### Waivers and refunds

Admin may choose:

- waive outstanding debt;
- refund available credit;
- make a manual adjustment.

Each requires:

- explicit amount;
- reason;
- admin identity;
- timestamp.

No silent deletion of account entries.

## UI design

### Learner Workspace

Add a compact section beneath Current booking & payment:

**Family account**

Examples:

- Settled
- €30 credit available
- €30 outstanding

Show a short list of recent account entries with originating child and reason.

Add **Change future sessions**.

### Change review

Before confirmation show an explicit comparison.

Example cheaper change:

> Current future sessions  
> 20 Oct · Private Tuition · €40  
> 27 Oct · Private Tuition · €40  
>
> New future sessions  
> 19 Oct · Group Homework Support · €25  
> 26 Oct · Group Homework Support · €25  
>
> Prepaid value removed: €80  
> New session value: €50  
> **Family credit created: €30**

Example more expensive change:

> Prepaid value removed: €50  
> New session value: €80  
> **Additional family balance due: €30**

No financial entry is created until the admin confirms the change.

### Paid-period / renewal builder

Add a family-account summary near the payment total.

Examples:

> Session subtotal: €160  
> Family credit available: €30  
> [Apply credit]

or:

> Session subtotal: €160  
> Family balance outstanding: €30  
> [Add outstanding balance]

Applying a balance is always explicit.

### Family Pipeline

Family-level summaries may surface a compact financial status without moving the child into a different lifecycle queue.

Examples:

- **Account settled**
- **€30 family credit**
- **€30 family balance due**

The lifecycle label remains based on learner/payment/renewal state, not the existence of an adjustment balance.

## Operational status separation

Operations and financial adjustment status must not be conflated.

Example:

- Learner status: **Active · Paid through 27 October**
- Family account: **€30 outstanding**

This is valid.

A balance adjustment alone must not move an otherwise paid learner into Renewals or mark paid dated seats as unpaid.

Operations continues to answer:

> Is this learner expected / authorised for this dated session?

Family account answers:

> Is there money still owed to or by this family?

## Capacity and timetable rules

A session move must reuse existing capacity validation.

For every destination session:

- Academy closure rules apply;
- dated capacity is checked;
- existing standing-placement reservations are respected;
- learner cannot occupy duplicate places at the same date/time;
- permanent recurring changes create the new recurring capacity only after validation.

If a permanent change fails capacity validation, no standing-placement, paid-session or family-ledger mutation is committed.

The entire change confirmation must be transactional at the application/database boundary where practical.

## Authorization

All change, ledger-application, waiver and refund actions are admin-only and protected server-side using the existing `requireAdmin()` boundary.

No browser client receives service-role credentials.

No parent-facing ability to manipulate account credits/debts is introduced in this slice.

## Privacy and safeguarding

This feature uses existing operational and financial family/learner identifiers.

No data is sent to an AI provider or additional external service.

The new ledger contains financial operational metadata and must remain admin-only.

Descriptions/reasons should be operational and factual; staff should not put sensitive safeguarding or diagnostic information into financial adjustment reasons.

## Failure modes

The system must reject:

- repricing a past or attended session;
- applying a credit/debt to a different `parent_lead_id`;
- applying more credit than remains available;
- collecting more debt than remains outstanding unless the excess is separately recorded as a normal payment;
- applying the same ledger value twice;
- moving into an Academy closure;
- moving into a full destination;
- creating duplicate learner attendance at the same date/time;
- a permanent change whose effective date predates already-delivered history;
- zero-value ledger noise when old/new values are equal.

Partial failures must not leave a standing-placement change without its matching session-change audit/financial adjustment.

## Acceptance criteria

1. Admin can create a permanent future place/rate change without manually rebuilding every dated session.
2. Admin can make a one-off dated session change without altering the learner's recurring place.
3. Past/attended sessions cannot be repriced through the change workflow.
4. Existing exact paid sessions retain their copied historical prices.
5. A cheaper future change creates family credit equal to the exact difference.
6. A more expensive future change creates family outstanding balance equal to the exact difference.
7. Credit/debt origin remains linked to the child that created it.
8. Credit/debt can be manually applied/collected against another child only when that child shares the same parent/family.
9. No credit or debt is automatically consumed.
10. Admin can carry outstanding debt forward without marking the child's already-authorised changed session wholly unpaid.
11. Admin can waive/refund with explicit amount and reason.
12. Family Pipeline / Learner Workspace can display family balance independently of learner lifecycle status.
13. Destination capacity and Academy closures are revalidated on confirmation.
14. Failed change confirmation leaves historical sessions, standing placements and ledger unchanged.
15. All financial mutations retain admin identity and timestamp.
16. Existing initial payment and renewal flows continue to work for families who never change sessions.

## Testing strategy

Automated tests must cover:

- same-rate timetable move produces no ledger entry;
- cheaper future change creates exact negative balance entry;
- more expensive future change creates exact positive balance entry;
- past/attended session rejection;
- one-off change leaves standing placement unchanged;
- permanent change ends old placement and creates new effective-dated placement;
- family credit applied to originating child;
- family credit applied to sibling with same parent;
- cross-family credit application rejected;
- partial credit application leaves correct remaining balance;
- debt carried forward without changing paid dated-session status;
- debt collected later produces offsetting ledger entry;
- double application rejected;
- capacity failure produces no partial data changes.

Release verification must also include:

- typecheck;
- lint;
- test suite;
- production build;
- Supabase security/performance advisors;
- preview flow using synthetic family/learner data;
- founder acceptance before production release.

## Migration strategy

The schema additions are additive.

No existing financial or attendance rows are rewritten during migration.

Migration adds the new audit/ledger structures and supporting indexes/RLS consistent with the existing admin-only server model.

Backfill is not required. Existing families begin with an implicit zero account balance until the first ledger entry is created.

## Rollback

Application rollback:

- remove/hide the new change-session and family-account UI;
- stop writing new session-change/account entries;
- continue using the existing paid-period and renewal workflows.

Database rollback should not delete ledger/history once real financial entries exist. New tables can safely remain unused if the application release is reverted.

Because the ledger is append-only audit history, production rollback must preserve any entries already created.

## Non-goals for this slice

- card/direct-debit collection;
- automatic bank reconciliation;
- parent self-service timetable changes;
- automatic credit application;
- automatic debt collection;
- accounting-system integration;
- tax/VAT accounting;
- automatic refunds;
- cross-family transfers;
- rewriting historical payment entitlement records;
- converting TAA to billing in arrears.
