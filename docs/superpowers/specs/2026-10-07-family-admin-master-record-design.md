# Family Administrative Master Record Design

**Date:** 2026-10-07  
**Status:** Approved and implemented on feature branch; pending founder preview acceptance  
**Project:** The Afternoon Academy

## 1. Purpose

Make the Family profile the canonical administrative record for each household.

The learner profile remains teaching-first. Household administration, money, documents and the complete parent-facing communications trail move to the Family profile so information is not duplicated across learner records.

Success means an Admin can open one family record and understand the household's operational state without scrolling through one long page or opening multiple learner records.

## 2. Product ownership rules

### Family profile owns

- parent/family contact identity
- household-level customer/admin status
- family balance and account adjustments
- payment and renewal administration
- child places and future session arrangements
- family documents and authorisations
- complete parent-facing Academy email history
- links to each learner's teaching record

### Learner profile owns

- teaching workspace
- attendance
- teaching history
- learner profile
- goals and goal progress
- teaching frameworks/context
- concise admin-only link back to the Family profile

The learner record must not become a second source of truth for household communications, payments, renewals or documents.

## 3. Family profile information architecture

Use the same horizontal tab pattern as the Learner profile.

### Header

Show:

- family/parent name
- email
- phone when present
- concise current family/customer state when available
- Back to Family Pipeline action

The header remains compact and does not contain long histories or forms.

### Tab: Overview

Purpose: fast household summary.

Show concise cards for:

- children in the family, each linking to the learner record
- current family balance
- registration/authorisation status
- current place/payment/renewal warnings that need Admin attention

Do not duplicate full payment, email or document histories in Overview.

### Tab: Children & places

Show each learner/child with:

- name and year group
- learner record link
- current recurring place(s)
- paid-through date
- future recurring-place changes
- relevant timetable/session-change actions

Existing session-change business logic remains unchanged.

### Tab: Payments & renewals

This is the household financial/admin source of truth.

Show:

- current family balance
- account adjustment history
- relevant paid-period information
- current renewal state per learner
- existing renewal/payment actions

No learner page should maintain an independent full financial history.

### Tab: Email history

This is the canonical parent-facing communications audit trail.

It must include all records in `email_delivery_log` for the family, including:

- enquiry acknowledgements
- place offers
- planned-place emails
- payment confirmations/reminders when logged
- renewal emails
- registration/authorisation emails
- learning updates
- future parent-facing Academy email kinds

The UI must:

- show newest first
- render compact rows with type, subject, recipient, related child when known, delivery status and timestamp
- expand a row on demand to show full retained message body and delivery/error detail
- use a fixed-height scrollable history panel so the page height does not grow indefinitely
- fetch 25 messages initially
- load older messages server-side in pages of 25
- avoid loading the family's full historical email log into the initial page render
- not add category filters in the first version

If no messages exist, show a clear empty state.

The screen must not claim to contain emails that were never captured in `email_delivery_log`. The copy should describe it as the Academy's recorded email history.

### Tab: Documents

Show family-level administrative documents, beginning with Parent Registration & Authorisation.

Existing send/mark-signed behaviour remains unchanged.

The layout must leave room for additional document types later without requiring another Family page redesign.

## 4. Email-history pagination architecture

The current synchronous query that loads all family emails must be replaced for the Family profile.

The first Family page request loads only the latest 25 `email_delivery_log` rows for that `parent_lead_id`, ordered by `created_at desc, id desc`.

Pagination must use a stable server-side cursor rather than client-only slicing. The cursor must contain enough information to continue after the last loaded record without skipping or duplicating rows when two emails share a timestamp.

A dedicated Admin-only server endpoint or server action will request the next page using the same family ID and cursor. It returns:

- the next message page
- whether more history exists
- the next cursor when applicable

The UI appends results inside the existing scrollable history panel.

No new email-history table is introduced. `email_delivery_log` remains the source of truth.

## 5. Learner profile simplification

Remove the duplicated full Family & place and Communications surfaces from the learner workspace.

For Admin users, replace them with a concise family reference area that provides:

- family name when available
- concise payment/paid-through context where useful
- Open family account action

Teacher users continue to see only teaching-related learner surfaces.

This change must not reduce Admin access to household information; it changes where that information is canonically displayed.

## 6. Permissions

The Family profile remains Admin-only through the existing `view_family_pipeline` capability.

Teachers must not gain access to:

- family payments
- renewals
- email history
- documents
- household administration

Learner teaching capabilities remain unchanged.

## 7. Existing business logic to preserve

This redesign must not alter:

- Customers including renewal-due families
- Leads remaining family/parent records rather than children
- renewal capacity semantics
- current payment/renewal calculations
- standing placement ownership
- session-change behaviour
- family balance semantics
- registration/authorisation workflow
- Resend send behaviour
- existing email-delivery logging semantics
- Teaching Framework or Family Updates behaviour

This is primarily an information-architecture, query-scaling and presentation change.

## 8. Error and empty states

Each tab must degrade independently.

Examples:

- no children: show a family-level empty state
- no active place: show no current recurring place
- no current renewal: show no renewal prepared
- no documents: show document setup/action state
- no emails: show no recorded Academy emails
- older-email load failure: preserve already-loaded messages and show a retry action

A failure to load older email history must not break the rest of the Family profile.

## 9. Performance and scalability

The Family profile must not load unbounded histories on first render.

Required limits:

- Email history: 25 rows initially, 25 per subsequent page
- Full email body appears only in an expanded row already loaded
- Database ordering/pagination must remain deterministic
- The Family page should avoid unnecessary queries for data belonging to inactive tabs when practical without making the implementation excessively complex

The design should support hundreds of emails per family without materially changing page usability.

## 10. Testing and release criteria

Tests must cover at minimum:

- Family profile exposes the five approved tabs
- Family profile is still Admin-only
- learner profile no longer presents a duplicated full communications history
- learner profile still links Admin to the Family profile
- initial email-history query is limited to 25
- pagination loads the next 25 in deterministic order
- equal `created_at` timestamps do not duplicate or skip messages
- empty email history renders correctly
- older-history failure does not remove already-loaded messages
- existing payment, renewal, document and session-change actions remain wired to their existing handlers

Before release:

- full repository tests pass
- TypeScript passes
- Next.js production build passes
- preview is reviewed on desktop and mobile
- no production deployment occurs before explicit founder acceptance

## 11. Out of scope

Not included in this slice:

- mailbox/Gmail import
- reconstructing emails not present in `email_delivery_log`
- email search
- category filters
- open/click tracking
- rewriting payment or renewal logic
- changing the Family Updates AI workflow
- changing teacher permissions
