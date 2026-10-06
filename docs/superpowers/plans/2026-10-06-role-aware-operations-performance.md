# Role-Aware Operations and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver capability-based Admin/Teacher/Parent authorization, family-based customer counting, admin-only business KPIs, and safe pre-conversion lead editing in one production release.

**Architecture:** Keep authorization centralized in a small role/capability module and server guards; keep commercial KPI aggregation in a dedicated server-side loader with pure calculation helpers; group customer learners by parent before rendering; add a pre-conversion lead-edit action that updates only editable lead fields and preserves lifecycle state. Reuse existing authenticated internal user records and transactional Supabase tables; do not introduce a separate RBAC schema or analytics warehouse.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript/ESM, Supabase/Postgres, Zod, node:test, Vercel.

**Spec:** docs/superpowers/specs/2026-10-06-role-aware-operations-performance-design.md

## Global Constraints

- One feature branch and one PR for the combined release.
- TDD for every behavioral change.
- One deliberate final Vercel preview after code/test completion; do not repeatedly deploy intermediate TDD commits.
- Authorization must be enforced server-side as well as in navigation/UI.
- Teacher commercial/destructive data must not merely be hidden client-side; it must not be queried or passed to Teacher-rendered pages.
- Revenue means paid cash received only; pending planned value is separate.
- Customer count means unique paying families; learner count remains separate.
- Lead edits before conversion must not rewind or otherwise mutate lifecycle, bookings, communications, payments, or historical sent email content.
- Parent is supported as a role but receives no internal /admin capabilities in this release.
- No Child role or child login is introduced.
- No new RBAC tables or analytics tables unless current schema inspection proves unavoidable.

## Review Focus

- Mixed Admin/Teacher pages must not leak commercial data into Teacher props or source output.
- Teacher mutation coverage must distinguish safe teaching actions from destructive/commercial actions at the server boundary.
- Family grouping must not double-count siblings or drop a family when only one child is lifecycle-eligible.
- KPI period logic must avoid date-boundary and duplicate-booking errors.
- Lead editing must refuse converted child identity edits without corrupting shared parent/family data.

---

### Task 1: Centralize role and capability authorization

**Files:**
- Create: lib/auth/capabilities.mjs
- Create: lib/auth/require-capability.ts
- Modify: lib/auth/require-admin.ts
- Test: tests/auth-capabilities.test.mjs
- Test: tests/admin-navigation.test.mjs

**Interfaces:**
- Produces: `capabilitiesForRole(role)`, `roleHasCapability(role, capability)`, `requireCapability(capability)`, and a shared role-aware navigation filter used by desktop/mobile layouts.
- Consumes: existing authenticated internal `users.role` value.

- [ ] **Step 1: Write failing authorization tests**

Add tests asserting:
- Admin has every internal capability.
- Teacher has exactly view_operations, operate_sessions, view_learners and edit_learning_record.
- Parent has no internal-admin capability.
- Unknown/null role has no capability.
- Teacher navigation contains only Operations Hub and Learner Records.
- Admin navigation contains the full current navigation set.

- [ ] **Step 2: Run authorization tests and confirm RED**

Run: `npm test -- --test-name-pattern="capability|navigation"`
Expected: FAIL because capability functions/navigation filtering do not yet exist.

- [ ] **Step 3: Implement the centralized capability map**

Create `lib/auth/capabilities.mjs` with the exact capability names from the spec and pure role-to-capability helpers. Extend `lib/admin/admin-navigation.mjs` so each item declares the capability required and expose a pure `navigationForRole(role)`/equivalent helper.

- [ ] **Step 4: Implement server guards**

Create `lib/auth/require-capability.ts` that:
- calls the existing user authentication path;
- reloads the internal user from `users`;
- verifies the requested capability from the central map;
- redirects unauthorized page access to /unauthorised;
- provides an action-safe assertion helper that throws instead of redirecting where server actions require it.

Keep `requireAdmin()` as a compatibility wrapper for genuinely Admin-only actions.

- [ ] **Step 5: Run authorization tests GREEN**

Run: `npm test -- --test-name-pattern="capability|navigation"`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add capability-based internal authorization`

---

### Task 2: Make the admin shell role-aware and protect page routes

**Files:**
- Modify: app/admin/layout.tsx
- Modify: components/admin/admin-mobile-navigation.tsx
- Modify: app/admin/page.tsx
- Modify: app/admin/leads/page.tsx
- Modify: app/admin/learners/page.tsx
- Modify other current /admin page entrypoints as needed to require their declared capability.
- Test: tests/admin-route-access.test.mjs

**Interfaces:**
- Consumes: `requireCapability`, `navigationForRole`.
- Produces: server-enforced route boundary and role-filtered navigation.

- [ ] **Step 1: Write failing route-access contract tests**

Test a pure route/capability policy map that proves:
- /admin requires view_operations.
- /admin/learners requires view_learners.
- /admin/leads requires view_family_pipeline.
- family updates, tutor room and setup require their corresponding Admin capabilities.
- Teacher cannot satisfy protected commercial/admin routes.
- Parent cannot satisfy any /admin route.

- [ ] **Step 2: Run tests RED**

Run: `npm test -- --test-name-pattern="route access"`
Expected: FAIL.

- [ ] **Step 3: Implement shared admin route policy and shell filtering**

Pass the authenticated internal role from `app/admin/layout.tsx` to both desktop and mobile nav. Render only navigation returned by the shared policy.

- [ ] **Step 4: Add page-level guards**

At each protected page entrypoint, call the matching capability guard before querying page data. This is required even if the shell link is hidden.

- [ ] **Step 5: Run tests GREEN**

Run route/access and navigation tests.

- [ ] **Step 6: Commit**

Commit message: `feat: enforce role-aware admin routes`

---

### Task 3: Move Teacher-safe learner/Operations actions to capability guards

**Files:**
- Modify: actions/learners.ts
- Modify: components/admin/today-delivery-board.tsx
- Modify learner record UI components that expose destructive status controls.
- Test: tests/teacher-action-permissions.test.mjs

**Interfaces:**
- Consumes: capability assertion helper from Task 1.
- Produces: Teacher-safe teaching mutations without commercial/destructive access.

- [ ] **Step 1: Classify current learner/Operations actions**

Create a compact test fixture/policy map that labels current server actions relevant to this release:
- Teacher-safe: attendance, renewal-expected attendance, daily focus/type updates, adding eligible learner to an Operations seat, teacher updates, learner goals, learner goal status, learner educational/profile edit.
- Admin-only: create learner manually if it creates commercial state, mark learner left, release/delete seats or sessions, payment/entitlement mutations, commercial placement mutations, renewal lifecycle changes, setup changes.

Do not broaden Teacher rights beyond the approved spec.

- [ ] **Step 2: Write failing permission tests**

Assert Teacher is allowed for each safe action capability and denied for representative destructive/commercial actions; Admin remains allowed.

- [ ] **Step 3: Run tests RED**

Run: `npm test -- --test-name-pattern="teacher action"`

- [ ] **Step 4: Replace hard `requireAdmin()` only where approved**

Use `requireCapability("operate_sessions")` or `requireCapability("edit_learning_record")` on approved Teacher-safe actions. Leave all commercial/destructive actions on Admin-only guards.

- [ ] **Step 5: Hide Teacher-destructive learner controls**

On learner pages/components, use role/capability-derived props to omit destructive lifecycle controls such as marking a learner left. Do not rely on this UI omission for security.

- [ ] **Step 6: Run focused and full tests GREEN**

Run permission tests, then `npm test`.

- [ ] **Step 7: Commit**

Commit message: `feat: allow teachers safe operations and learner actions`

---

### Task 4: Group Customers by family instead of learner

**Files:**
- Create: lib/admin/family-customers.mjs
- Modify: app/admin/leads/page.tsx
- Modify: components/admin/family-lifecycle-tables.tsx
- Test: tests/family-customers.test.mjs

**Interfaces:**
- Consumes: eligible learner rows already determined by existing lifecycle rules.
- Produces: `groupCustomerFamilies(rows)` returning family rows plus active learner count.

- [ ] **Step 1: Write failing grouping tests**

Cases:
- two eligible siblings under one parent => 1 customer family, 2 learners;
- three families/five learners => familyCount 3, learnerCount 5;
- one eligible and one ineligible sibling => family appears once with only eligible learner in active-customer child list;
- learner rows with missing parent display fallback but do not merge unrelated records.

- [ ] **Step 2: Run tests RED**

Run: `npm test -- --test-name-pattern="family customer"`

- [ ] **Step 3: Implement pure grouping helper**

Group by parentLeadId. Each family row contains parent name/email and a sorted child array with learner ID/name/year group/paid-through/place summary.

- [ ] **Step 4: Update Family Pipeline metrics and table**

Change the Customers KPI and section heading to family count. Show active learner count secondarily. Render one family row with nested learner details rather than one row per learner.

- [ ] **Step 5: Run tests GREEN**

Run focused test and full `npm test`.

- [ ] **Step 6: Commit**

Commit message: `feat: count customers by family`

---

### Task 5: Add admin-only Performance KPI calculation module

**Files:**
- Create: lib/admin/performance-metrics.mjs
- Create: lib/admin/load-performance-metrics.ts
- Create: components/admin/performance-summary.tsx
- Modify: app/admin/page.tsx
- Test: tests/performance-metrics.test.mjs

**Interfaces:**
- Produces: pure period and aggregation helpers plus `loadPerformanceMetrics({ period, today })`.
- Consumes: payment_entitlements, child_payment_entitlements, standing_placements, weekly_table_templates/academy_tables, accepted_bookings and renewal_cases.

- [ ] **Step 1: Write failing pure KPI tests**

Cover:
- This month, Last month and This year date windows.
- Revenue includes only paid payments received inside period.
- Planned/unpaid value never contributes to revenue.
- Average revenue/family and learner return null when denominator is zero.
- Paid session count uses dated selected-session records.
- recurring learner-sessions/week counts learner placements, not blocks.
- teaching blocks deduplicate by weekday/table/time.
- utilization uses paid learner seat holds over configured active capacity.
- pending planned value excludes paid bookings and deduplicates a booking set by child/period/planned amount or another stable current booking-set key.
- renewal count only includes open actionable renewal states.

- [ ] **Step 2: Run tests RED**

Run: `npm test -- --test-name-pattern="performance"`

- [ ] **Step 3: Implement pure KPI calculations**

Keep period calculation and aggregation deterministic and timezone-safe using explicit YYYY-MM-DD/UTC boundaries.

- [ ] **Step 4: Implement server loader**

Query authoritative source tables only. Normalize rows, then call pure helpers. No Teacher call path should invoke this loader.

- [ ] **Step 5: Add admin-only Performance UI**

In `app/admin/page.tsx`, guard Operations with view_operations, inspect actor capability for view_commercial_kpis, and only then load/render Performance. Add financial-period selector independent of operational `date`.

Display the approved KPI set with revenue and pending value clearly distinguished.

- [ ] **Step 6: Run tests GREEN**

Run focused tests and full `npm test`.

- [ ] **Step 7: Commit**

Commit message: `feat: add admin performance metrics`

---

### Task 6: Add safe pre-conversion lead editing

**Files:**
- Create: lib/admin/preconversion-lead-edit.mjs
- Create: components/admin/edit-lead-details.tsx
- Modify: actions/update-lead-status.ts or create a focused actions/lead-details.ts if that keeps responsibilities clearer.
- Modify: components/admin/family-follow-up-table.tsx
- Modify: app/admin/leads/page.tsx only if additional source fields are required.
- Test: tests/preconversion-lead-edit.test.mjs

**Interfaces:**
- Produces: pure eligibility/update-shape helpers and Admin-only `updatePreconversionLeadDetails`.
- Consumes: existing parent_leads, child_leads and timetable preference fields.

- [ ] **Step 1: Write failing lead-edit invariant tests**

Assert:
- pre-conversion child is editable;
- existing learner for childLeadId makes child identity edit ineligible;
- update payload contains only approved editable fields;
- lifecycle/status fields are absent from the update payload;
- planned booking/payment/email history fields are absent;
- correcting child name changes only lead identity source data;
- mixed family with one converted and one unconverted child still permits editing the unconverted child;
- invalid email/field values are rejected by schema.

- [ ] **Step 2: Run tests RED**

Run: `npm test -- --test-name-pattern="preconversion lead"`

- [ ] **Step 3: Implement eligibility and validation**

Use existing lead validation schemas where possible; add a focused edit schema rather than duplicating loose validation.

- [ ] **Step 4: Implement Admin-only transactional mutation**

Server action must:
- require edit_preconversion_leads;
- verify parent/child relationship;
- query whether a learner exists for the child lead;
- reject converted child identity edit with a clear instruction to use Learner Records;
- update parent and child/timetable-preference fields only;
- preserve lifecycle statuses by not including them in updates;
- preserve bookings, payments and email logs by not touching those tables;
- regenerate only the current unsent planned email draft if an edited field materially feeds that draft, using existing draft-regeneration behavior.

If multiple writes are needed and partial failure would leave contradictory lead data, use a Postgres transaction/RPC or otherwise an atomic database operation rather than sequential best-effort writes.

- [ ] **Step 5: Add Edit lead details UI**

In each eligible lead Details panel, add an explicit Edit lead details control. Keep editing compact and inline/modal-style using existing design patterns. On success, revalidate Family Pipeline and show corrected data without changing stage.

- [ ] **Step 6: Run tests GREEN**

Run focused tests and full `npm test`.

- [ ] **Step 7: Commit**

Commit message: `feat: safely edit pre-conversion lead details`

---

### Task 7: Verify database role compatibility and apply only necessary schema migration

**Files:**
- Create migration only if the current users.role constraint cannot represent admin/teacher/parent.
- Update generated/project schema docs only if repository convention requires it.
- Test: database verification query and security advisors.

**Interfaces:**
- Consumes: existing public.users.role schema.
- Produces: safe support for admin, teacher and parent values without widening unrelated database access.

- [ ] **Step 1: Inspect current role column and constraints**

Query information_schema/pg_constraint for users.role type/default/check constraints.

- [ ] **Step 2: If required, create one migration**

Only widen the allowed role values to admin/teacher/parent. Do not add RBAC tables.

- [ ] **Step 3: Verify migration state**

Query the constraint after application and confirm existing Admin row remains unchanged.

- [ ] **Step 4: Run Supabase advisors**

Run security advisor checks and document any new findings. No new ERROR/critical findings may be introduced by this release.

- [ ] **Step 5: Commit if schema changed**

Commit message: `db: support internal and parent roles`

---

### Task 8: Documentation, whole-branch verification and code review

**Files:**
- Modify: AGENTS.md
- Modify: docs/engineering/current-baseline.md
- Modify: docs/product/project-change-log.md
- Update PR description with verification evidence.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: release-ready branch.

- [ ] **Step 1: Update operating documentation**

Record:
- capability-based authorization invariant;
- Admin / Teacher / Parent roles and no Child role;
- Teacher Operations + Learner Records boundary;
- server-side enforcement requirement;
- family-based customer metric;
- admin-only KPI rule;
- safe pre-conversion lead-edit invariant.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 3: Run lint/build-equivalent repository checks without Vercel**

Run: `npm run lint`
Then run: `npm run build` only in an available local/CI environment that does not consume the Vercel preview quota. If connected-only execution cannot run this safely, rely on the final preview for build verification and state that explicitly.

- [ ] **Step 4: Review the complete PR diff**

Check specifically for:
- any remaining Teacher-safe action still hardwired to requireAdmin;
- any destructive action accidentally moved to a Teacher capability;
- commercial data loaded before role check;
- client-only authorization;
- lifecycle fields in lead-edit update payloads;
- duplicate KPI counting.

Fix Critical/Important findings before deployment.

- [ ] **Step 5: Commit docs/review fixes**

Commit message: `docs: record role-aware operations foundation`

---

### Task 9: Single final Vercel preview, production release and post-deploy verification

**Files:** no new product files unless preview reveals a build-only issue.

**Interfaces:**
- Consumes: implementation-complete branch.
- Produces: verified production release.

- [ ] **Step 1: Trigger exactly one deliberate final preview deployment**

Deploy the branch head after all repository tests/review are complete.

- [ ] **Step 2: Verify preview**

Require:
- Vercel state READY;
- prebuild tests pass;
- Next.js production build passes;
- no rate-limit or build errors.

- [ ] **Step 3: Perform acceptance checks**

Verify at minimum:
- Admin navigation full.
- Teacher navigation limited to Operations/Learners.
- Teacher direct route protection.
- Teacher Operations works without KPI data.
- Customer metric displays unique family count.
- Performance metrics render for Admin.
- Lead edit preserves lifecycle and corrected data is visible.

Use a non-production Teacher test identity if available; do not alter real production user roles merely to perform preview testing without explicit approval.

- [ ] **Step 4: Merge PR only after preview acceptance**

Squash/merge the single PR to main.

- [ ] **Step 5: Verify production deployment**

Require main deployment state READY and correct production aliases.

- [ ] **Step 6: Post-deploy observability**

Scan production runtime logs for error/fatal events after release. If new errors appear, do not claim completion; investigate or roll back.

- [ ] **Step 7: Final release report**

Report commit SHA, production deployment ID, READY status, tests, runtime error scan and any remaining known limitations.


## Release completion note — 6 October 2026

This plan is implemented and released to production.

Production refinements made during acceptance:
- Admin KPIs moved from Operations Hub to `/admin/finance`.
- Admin lands on Finance & metrics; Teacher lands on `/admin/operations`.
- Leads are grouped by parent/family with children nested beneath one row.
- Customers remain Customers during renewal; Renewals is an overlapping action subset.
- Renewal state is highlighted in the Customer paid-through badge.
- Pre-conversion lead edit remains lifecycle-safe and family-aware.

Verification:
- 69/69 automated tests passed on the final preview.
- Next.js production compilation and TypeScript passed.
- Final feature preview reached READY.
- Production deployment from `main` reached READY on 6 October 2026.
