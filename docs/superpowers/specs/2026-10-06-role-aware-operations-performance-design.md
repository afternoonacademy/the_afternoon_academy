# Role-Aware Operations, Family Customers, Performance KPIs and Lead Editing

_Date: 6 October 2026_

## Status

Approved conversational design. This document is the implementation specification for the next combined release.

## Purpose

Strengthen The Afternoon Academy operating system around four connected needs:

1. represent Customers as paying families/parents rather than individual learners;
2. give administrators a useful commercial performance view without exposing financial data to teachers;
3. introduce a durable role/capability authorization model for Admin, Teacher and future Parent access;
4. allow administrators to correct lead/family data safely before conversion without disturbing lifecycle, bookings, communications or payment state.

The release must preserve the existing production workflows for planning places, parent communication, payment activation, Operations attendance and learner records.

## Product principles

- Authorization is enforced on the server, not by hiding navigation alone.
- Roles are mapped to explicit capabilities. Product code should ask whether an actor has a capability rather than scatter ad-hoc role checks throughout the application.
- Admin and Teacher are internal roles. Parent is a first-class role in the authorization model, but this release does not build a new parent portal.
- There is no Child role or child login in this release.
- Teachers should see only the operational and learner information needed to teach well.
- Financial/commercial information is admin-only.
- Destructive and commercial-lifecycle mutations remain admin-only.
- A lead edit is a data correction, not a lifecycle transition.
- Historical communications and payment records must remain historical truth and must not be rewritten by ordinary data corrections.
- Customer counts use unique paying families; learner counts remain separate operational metrics.
- Revenue means cash actually received, not planned or forecast value.

## Roles and capability model

### Admin

Full internal access to Operations Hub, Family Pipeline, Learner Records, Family Updates, One-to-one room, Academy Setup, payments, renewals, commercial KPIs, lead/customer administration and destructive administrative actions.

### Teacher

Access only to Operations Hub and Learner Records.

Teachers may perform normal non-destructive teaching actions in those areas, including attendance, daily session focus/type, adding an eligible learner to an operational seat where the current Operations workflow permits it, teacher updates, learner goals, goal status and learner educational/profile information needed for delivery.

Teachers must not see Family Pipeline, Family Updates, Academy Setup, payment/revenue/pricing/pending-value/customer-commercial metrics, renewals or commercial lifecycle controls. They must not release/cancel paid or planned places, mark a learner left, delete records, change payments, change commercial standing placements, or reach protected admin routes directly.

Where a page mixes safe and destructive controls, teacher UI must omit the destructive control and the corresponding server action must independently reject the teacher role.

### Parent

Parent is introduced as a supported role/capability identity for future use. This release does not create or expand a parent portal. Parent capabilities are self-scoped placeholders only and grant no access to internal /admin routes.

### Child

No authenticated child role is introduced.

### Capabilities

Create a central authorization module with these named capabilities:

- view_operations
- operate_sessions
- view_learners
- edit_learning_record
- view_family_pipeline
- edit_preconversion_leads
- view_family_updates
- manage_tutor_room
- manage_setup
- manage_payments
- manage_renewals
- view_commercial_kpis
- destructive_admin_actions

Admin receives all internal capabilities.

Teacher receives only view_operations, operate_sessions, view_learners and edit_learning_record.

Parent receives no internal-admin capabilities.

## Authorization helpers

Replace the current hard admin-only dependency where needed with:

- a helper that loads the authenticated internal user and role;
- a route/page guard requiring one or more capabilities;
- a server-action guard requiring one capability.

The existing admin-only helper may remain for code paths that genuinely require Admin. Teacher-compatible actions must move to capability guards.

Authorization failures must redirect on pages and reject server actions without executing mutations.

## Navigation and route access

Admin keeps all current admin destinations.

Teacher navigation shows only Operations Hub and Learner Records. Desktop and mobile navigation must use one shared role-aware navigation definition.

Direct navigation to unauthorized internal routes must be denied server-side.

## Operations Hub

Both Admin and Teacher may open the Operations Hub.

Admin sees:
1. Performance summary;
2. operational date controls;
3. delivery room/tables.

Teacher sees:
1. operational date controls;
2. delivery room/tables.

The commercial Performance section must not be queried or rendered for Teacher users.

## Customer aggregation

### Current problem

The Family Pipeline currently reports Customers as individual active learners. A family with two enrolled children is therefore counted twice.

### Required behavior

A Customer is one unique paying family/parent.

The Family Pipeline headline must display Customers as N families and show a secondary active learner count where useful.

Example: 3 parent families and 5 active learners must display 3 Customers and 5 active learners.

### Customer data shape

Build customer rows grouped by parent_lead_id.

Each family row includes parent/family name, parent email, active learner count and children nested under the family. Each child shows learner name, year group, paid-through date and current/upcoming recurring place summary.

A learner remains eligible using the existing customer lifecycle rules: active learner; paid entitlement; current or upcoming standing placement; not presently in renewal; not closed by a completed/non-renewing renewal outcome.

A family appears once if at least one learner satisfies the customer rule.

Customer count is grouped family count. Active learner count is the number of eligible learners.

## Admin Performance section

Add an admin-only Performance section at the top of Operations Hub.

Default financial period: current calendar month.

Provide period choices: This month, Last month and This year. Financial period selection must not alter the operational attendance date.

### KPI definitions

#### Revenue received

Sum payment_entitlements.amount_cents where status is paid and received_at falls inside the selected financial period.

Do not include planned bookings or unpaid offers.

#### Active families

Unique parent IDs represented by current Customer aggregation. This is a live metric.

#### Active learners

Count of learners represented by current Customer aggregation. This is a live metric.

#### Paid sessions in selected period

Count dated paid learner sessions whose service date falls within the selected period, based on authoritative paid selected-session data. Do not infer by multiplying sessions-per-week by weeks.

#### Recurring learner-sessions per week

Count active recurring learner placements. One learner placement equals one learner-session/week. Four learners in one teaching block equals four learner-sessions.

#### Teaching blocks per week

Count distinct active weekly timetable blocks that currently have at least one active/current-or-upcoming paid learner placement.

#### Capacity utilization

Numerator: active/current-or-upcoming recurring paid learner seat holds.

Denominator: configured capacity across active weekly table templates included in the live timetable.

Display percentage plus numerator/denominator where practical.

Planned-awaiting-payment and renewal-held seats may be shown separately as committed/held capacity but must not silently count as paid learner utilization.

#### Average revenue per family

Selected-period revenue received divided by the unique families that made a paid payment in that selected period. Show an em dash if denominator is zero.

#### Average revenue per learner

Selected-period revenue received divided by distinct learners covered by paid child entitlements tied to those selected-period payments. Show an em dash if denominator is zero.

#### Renewals due

Current open renewal cases requiring admin action.

#### Pending planned value

Sum planned amount for unique current session_planned/contacted/accepted_awaiting_payment booking sets that are not paid.

Label this Pending planned value, never Revenue. Avoid double-counting a child/family with multiple rows belonging to the same planned booking set.

### KPI implementation boundary

Create a dedicated server-side performance loader/calculation module. Keep business arithmetic out of the page component. Pure calculation functions must be unit-tested.

No commercial KPI query should run for Teacher requests.

## Pre-conversion lead editing

Admin only.

Available while the child/family remains pre-conversion and no active learner source-of-truth has replaced that child lead record.

Family Pipeline Details exposes Edit lead details for eligible leads.

Editable parent fields: parent name, email, phone, area where currently supported, and source only if already supported and operationally useful.

Editable child fields use the existing child lead schema where possible: first name, age, school, school year, curriculum, support needs, notes, preferred days, preferred times, preferred frequency and course/exam board where present.

Saving lead corrections must not automatically change parent lifecycle status, child pipeline status, planned bookings, planned dates, paid/unpaid state, payment records, previously sent email records, communication history or existing draft lifecycle rules.

If a corrected field appears in a current unsent planned-place email draft, that draft may regenerate according to existing draft-regeneration behavior. Historical sent email content remains unchanged.

A child-name correction must appear in future workflow displays.

### Conversion boundary

If a learner already exists for a child lead, the pre-conversion editor must refuse to mutate that child's lead identity fields and direct the admin to Learner Records.

If a parent has multiple children and only some are converted, unconverted child leads remain editable. Parent contact fields may remain editable by Admin where the family record is still the shared source for those unconverted children, but the implementation must not silently overwrite independently maintained active learner data.

## Destructive-operation definition

For this release destructive actions include deleting parent/child/learner records, releasing/cancelling commercial places, ending/removing standing placements, marking a learner left, deleting operational sessions/seats, changing payment records or entitlements, completing/cancelling renewals, and Academy setup changes that remove or close configured capacity.

Teacher access must not permit these mutations.

Non-destructive teaching updates are not destructive merely because they update records.

## Data and schema

Prefer the existing users.role field if it can safely represent admin, teacher and parent.

If its current constraint restricts role values, add a migration to support the three roles.

Do not introduce a many-table RBAC schema unless inspection proves the current role field cannot support the required capability mapping. The capability map belongs in application code at this stage.

Do not copy family/learner data into a new analytics table for this release. KPIs derive from authoritative transactional records.

## Security

- Every teacher-accessible server action checks an appropriate capability.
- Every commercial/destructive action stays Admin-only.
- Page access and server-action access are separate enforcement layers.
- Never trust client-supplied role/capability values.
- Load role from the internal authenticated user record.
- Never send financial data to Teacher page props and merely hide it client-side.
- Keep service-role secrets server-only.
- Run existing security review/advisors if schema or authorization changes are made.

## Testing

Use TDD for every behavior change.

Required automated coverage:

1. role-to-capability mapping;
2. Teacher can open Operations and Learner Records;
3. Teacher cannot access Family Pipeline/Setup/commercial pages;
4. Teacher-compatible teaching mutations are authorized;
5. Teacher destructive/commercial mutations are rejected;
6. Admin retains current access;
7. Parent has no internal admin capability;
8. customer grouping: two siblings under one parent count as one Customer and two learners;
9. family with one eligible and one ineligible learner groups correctly;
10. KPI calculations including zero denominators;
11. revenue excludes unpaid/planned value;
12. pending value excludes paid bookings and avoids duplicate counting;
13. lead edit preserves lifecycle and planning state;
14. lead edit corrects child name/contact information before conversion;
15. child lead identity editing is refused once a learner exists;
16. teacher navigation contains only Operations and Learner Records;
17. admin navigation remains complete.

Run the full project test suite before preview.

## Release and Vercel efficiency

Develop this as one feature branch and one pull request.

To reduce Vercel build-rate-limit pressure:

- do not intentionally trigger Vercel preview on every TDD commit;
- perform code/test work first;
- use repository/unit verification throughout;
- trigger one deliberate final preview when implementation is complete;
- fix any preview-only build issue on the same branch;
- merge only after the final preview is READY;
- let main branch merge create production deployment;
- verify production status and scan error/fatal runtime logs.

Do not promote a failed or unverified preview.

## Documentation

Update AGENTS.md, docs/engineering/current-baseline.md and docs/product/project-change-log.md.

Record the Admin/Teacher/Parent role model, no Child role, Teacher Operations + Learner Records boundary, family-based Customer metric, admin-only commercial KPI rule and pre-conversion lead-edit lifecycle invariant.

## Acceptance criteria

The release is accepted when:

- a 3-family / 5-learner dataset displays Customers = 3 and active learners = 5;
- Admin sees commercial Performance KPIs and all current admin destinations;
- Teacher sees Operations and Learner Records, can perform normal teaching actions there, sees no commercial KPI data, and cannot reach protected admin areas or execute destructive/commercial actions;
- Parent exists as a supported role without internal admin access;
- a pre-conversion lead can be corrected without changing lifecycle, booking or communication history;
- converted learner identity is edited through Learner Records rather than stale lead data;
- tests pass, final preview is READY, production deploy is READY and post-release error/fatal logs are clean.


## Post-implementation clarification — production 6 October 2026

The production implementation refined several UI semantics without changing the approved security model:

- Customers and Renewals are **not mutually exclusive**. A renewing family remains a Customer and is also present in Renewals until the renewal action is resolved.
- Lead counts and rows are family-based; multiple children under one parent are nested in one lead family row.
- Commercial KPIs were moved from Operations Hub to a dedicated Admin-only **Finance & metrics** page.
- Admin lands on Finance & metrics; Teacher lands on Operations Hub.
- Customer rows retain renewing families and visibly flag renewal status in the paid-through badge.
- Pre-conversion lead editing is surfaced from the grouped family row/child details while preserving lifecycle and history.
