# Lead-to-Placement Flow v1

_Status: revised for the current correction cycle — 17 September 2026._

## Problem

The lead and placement statuses currently operate independently. That makes it possible to mark a parent as converted before they have accepted a specific session, and it does not show staff the next real-world action.

## Goal

Create one clear, human-led route from enquiry to a confirmed place while preserving the history of leads, learner records and placements. Give TAA an operationally simple room timetable rather than a premature themed-group matching system.

## Non-goals

- Taking payments, sending automated email, public booking or a parent portal.
- Automatic matching or AI placement decisions.
- Deleting historical records when a family declines, waits or leaves.
- A full teacher/staff profile system.

## Workflow

| Stage | Lead status | Placement status | Staff meaning / next action |
| --- | --- | --- | --- |
| Enquiry | New or contacted | None | Qualify the enquiry and consider fit. |
| Considered match | Contacted | Proposed | Staff have identified a possible session; no parent offer exists yet. |
| Session offer sent | Offer sent — awaiting reply | Offered to parent | A specific session has been offered. Await the parent response. |
| Parent accepts | Enrolled | Confirmed | Staff have recorded acceptance of the offered session. |
| No current fit | Waitlist | Waitlisted | Preserve demand and review when capacity changes. |
| Parent declines / engagement ends | Closed | Ended | Preserve the history; do not delete records. |

## Rules and permissions

- A session proposal or offer must never enrol a lead.
- A lead becomes **Enrolled** only through staff confirmation that a parent accepted a specified offered session.
- A website enquiry starts as **New**. A phone, referral, walk-in or email enquiry can be entered by staff and also starts as **New**. **Contacted** means staff have made the first meaningful call, email or WhatsApp contact.
- “Warm” and “priority” are retired from the working lifecycle; historical records retain their existing value until staff update them.
- An offered placement does not consume confirmed session capacity.
- Acceptance is one protected server-side operation: it verifies the offer, checks capacity, creates the learner from the approved enquiry details when needed, and updates the linked lead together.
- Only an authenticated TAA admin may create proposals, send offers or record acceptance.
- Audit data records the staff member and time for offers and acceptance. No identifiable learner or parent data is sent to an AI provider.

## Acceptance criteria

1. Staff cannot set a lead to Enrolled directly from the lead table.
2. Staff can propose a session, then explicitly send a session offer to a linked parent lead.
3. Offered places are clearly labelled as awaiting a parent reply and are excluded from confirmed capacity.
4. Confirming acceptance only succeeds for an offered place with capacity; it updates the placement to confirmed, the linked lead to Enrolled and the learner to active in one operation.
5. Waitlisted, ended and left records remain visible historically and are not used as active matching choices.
6. The sessions page makes the next action explicit at every stage.
7. A parent acceptance creates a linked learner record automatically; staff can then enrich its profile.
8. The weekly timetable shows TAA1 capacity and filled seats. Tutor Room bookings can be created for any date/time and cannot overlap.

## Revised operations scope

- **TAA1 (main room):** a simple weekly timetable across Monday–Sunday. Staff can add recurring general homework-support slots, assign a teacher, and see six visible seats with learner names for each confirmed place. Wednesday, Saturday and Sunday remain available for future sessions.
- **Tutor Room:** a separate dated one-to-one booking calendar. It has no pre-set opening hours; a staff member can book any chosen date/time, duration, learner and teacher. A protected overlap check prevents two bookings in the same room at the same time.
- A full teacher profile is deliberately deferred. Teacher assignment remains a simple named field until the Academy has multiple staff and needs availability, cover, qualifications and safeguarding records.

## Test and recovery

- Test invalid direct enrolment, offer without a linked lead, acceptance without an offer and acceptance at capacity.
- Verify RLS remains enabled and browser roles have no direct access to the operational tables or privileged functions.
- The migration is additive apart from widening the existing lead-status check. Recovery is to stop using the new controls; historical audit fields remain safe to retain.


## Room-board correction cycle

### Goal

Make the daily TAA1 delivery view mobile-first. Two permanent tables of six seats are configured through recurring weekly sessions. Staff select a date to see the relevant day’s two table plans, learner information and attendance state.

### Rules

- TAA1 has exactly two configured table positions, each with six seats.
- A confirmed placement may reserve one seat per session; an offer only reserves a seat once accepted.
- Learner information must be available by tap/click, never hover only.
- Attendance is stored with both the learner and the session/date. It is an operational record, not a billing trigger.
- Tutor Room remains a separate dated one-to-one booking flow.

### Acceptance criteria

1. On a phone, staff can select today or another date and see both TAA1 tables without horizontal scrolling.
2. A table shows its scheduled time, teacher, session type, six seats and clear available/occupied states.
3. A filled seat opens a concise learner detail panel and lets staff mark the learner present for that dated session.
4. Duplicate confirmed seat assignments are rejected by the database.
5. The recurring setup is not recreated each day; it is configured by weekday and fixed table number.


## Daily-override and family-enquiry correction

- The weekly timetable is a default, not a lock. A table can be changed for one selected date without changing future weeks; staff can restore its weekly default.
- Each daily table card exposes teacher, session type, time and duration with plain-language labels. Teacher is a free-text/datalist field until a teacher-profile slice is approved.
- A session offer is created from a selected parent lead and then one of that parent's recorded children; staff do not retype child details.
- The public lead form can record additional siblings. Each child gets a separate protected child-lead and timetable-preference record under the same parent enquiry.
- Tutor Room labels explain that Start and End mean the beginning and end of the one-to-one appointment.


## Monthly delivery-plan correction

- Staff create a month plan for one weekday/table, including teacher, general support type, time, duration and up to six enrolled learners.
- The system creates a dated Table 1/2 session and dated seats for every matching day in that month.
- Any date can be created directly, edited, cancelled or restored without changing the monthly plan or other dates.
- A learner can be marked “not attending today” without changing their standing enrolment. A cancelled table has no expected attendance.
- Attendance is mobile-first and records delivery evidence only; it does not create or amend a charge, credit or payment.


## Paid-family enrolment correction

- A family lead is converted to Enrolled only through a protected staff action after staff has manually confirmed payment.
- Staff select one or more recorded children; the action creates one active learner per child, each linked to its own child enquiry and the common parent lead.
- The action records who confirmed payment and when. It does not collect payment, create a charge, or automate billing.
- Direct editing of a lead status remains disabled for enrolment.


## Weekly delivery and paid-seat correction

- A **weekly table default** sets the usual teacher, session type, start time and duration for one weekday/table. It is a default, never a permanent lock.
- Opening a date creates a dated copy of that default. Staff may edit or cancel that date without changing future weeks.
- A family payment is recorded once, but each learner receives their own paid entitlement with a specific paid period.
- A learner’s standing placement records their weekday, TAA1 table and seat. When a dated table is opened, only children both paid for that date and assigned to that table/day are automatically seated.
- The ad-hoc **Add eligible learner** control remains for a planned exception; it only lists learners paid for the selected date.
- Attendance is delivery evidence only. It does not automatically refund, credit, invoice or amend payment status.


## Accepted place then payment activation correction

- An offer records the specific TAA1 room, table, seat, weekday and time agreed with a family. Table session type remains operational configuration, not part of a child booking.
- Parent acceptance creates a held booking and moves the lead to **Accepted — awaiting payment**; the child is not yet active for delivery.
- Recording a family payment records both the received date and the covered service period. It activates all the parent’s held child bookings, creates/activates their learner records and assigns their paid recurring seats.
- The parent lead becomes **Enrolled / paid** only after staff records payment.
- One-off trials and genuine exceptions are added on the dated room board; they do not overwrite the normal booking.
