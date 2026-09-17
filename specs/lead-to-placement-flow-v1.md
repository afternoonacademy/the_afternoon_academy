# Lead-to-Placement Flow v1

_Status: approved for development — 17 September 2026._

## Problem

The lead and placement statuses currently operate independently. That makes it possible to mark a parent as converted before they have accepted a specific session, and it does not show staff the next real-world action.

## Goal

Create one clear, human-led route from enquiry to a confirmed place while preserving the history of leads, learner records and placements.

## Non-goals

- Taking payments, sending automated email, public booking or a parent portal.
- Automatic matching or AI placement decisions.
- Deleting historical records when a family declines, waits or leaves.

## Workflow

| Stage | Lead status | Placement status | Staff meaning / next action |
| --- | --- | --- | --- |
| Enquiry | New, warm, priority or contacted | None | Qualify the enquiry and consider fit. |
| Considered match | Contacted | Proposed | Staff have identified a possible session; no parent offer exists yet. |
| Session offer sent | Offer sent — awaiting reply | Offered to parent | A specific session has been offered. Await the parent response. |
| Parent accepts | Enrolled | Confirmed | Staff have recorded acceptance of the offered session. |
| No current fit | Waitlist | Waitlisted | Preserve demand and review when capacity changes. |
| Parent declines / engagement ends | Closed | Ended | Preserve the history; do not delete records. |

## Rules and permissions

- A session proposal or offer must never enrol a lead.
- A lead becomes **Enrolled** only through staff confirmation that a parent accepted a specified offered session.
- An offered placement does not consume confirmed session capacity.
- Acceptance is one protected server-side operation: it verifies the offer, checks capacity and updates the placement and linked lead together.
- Only an authenticated TAA admin may create proposals, send offers or record acceptance.
- Audit data records the staff member and time for offers and acceptance. No identifiable learner or parent data is sent to an AI provider.

## Acceptance criteria

1. Staff cannot set a lead to Enrolled directly from the lead table.
2. Staff can propose a session, then explicitly send a session offer to a linked parent lead.
3. Offered places are clearly labelled as awaiting a parent reply and are excluded from confirmed capacity.
4. Confirming acceptance only succeeds for an offered place with capacity; it updates the placement to confirmed, the linked lead to Enrolled and the learner to active in one operation.
5. Waitlisted, ended and left records remain visible historically and are not used as active matching choices.
6. The sessions page makes the next action explicit at every stage.

## Test and recovery

- Test invalid direct enrolment, offer without a linked lead, acceptance without an offer and acceptance at capacity.
- Verify RLS remains enabled and browser roles have no direct access to the operational tables or privileged functions.
- The migration is additive apart from widening the existing lead-status check. Recovery is to stop using the new controls; historical audit fields remain safe to retain.
