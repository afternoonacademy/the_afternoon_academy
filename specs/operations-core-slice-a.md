# Operations Core — Slice A: family leads

## Goal

Provide a clear, protected lead workspace and let a parent submit one family enquiry covering more than one child.

## Rules

- One parent lead may have one or more child leads.
- Each child lead has its own timetable preference.
- Staff can create a new lead received by phone, email, referral, walk-in, or another source.
- Staff may update follow-up status to `new`, `contacted`, `offer_sent`, `waitlist`, or `closed` only.
- No Slice A control enrols a child, confirms payment, deletes records, or exposes data to the browser directly from Supabase.

## Acceptance criteria

1. A public parent can add/remove sibling rows before submitting a place enquiry.
2. Missing or invalid sibling details return a clear validation message.
3. A successful enquiry creates one parent lead, one child lead per child, and one timetable preference per child.
4. An authenticated admin can add a manual family lead and update follow-up status.
5. An unauthenticated visitor is redirected from `/admin/leads` by the existing admin guard.
6. The screen is usable at phone width and does not depend on hover-only controls.
