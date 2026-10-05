# Flexible Prepaid Session Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add effective-dated future session changes plus a family-level, append-only credit/debt ledger while preserving TAA's upfront billing and exact-date paid-session history.

**Architecture:** Extend the existing `standing_placements`, exact paid-session payloads, payment entitlements, and Operations capacity rules. Add two admin-only audit structures: `learner_session_changes` for the operational before/after change and `family_account_entries` for signed financial adjustments. The Learner Workspace drives one-off or from-date changes; Family Pipeline/renewal payment flows can explicitly apply family credit or collect family debt without automatically changing learner lifecycle state.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Supabase/Postgres, existing server actions, Vercel previews, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-05-flexible-prepaid-session-changes-design.md`

## Global Constraints

- Continue upfront billing by default.
- Historical/past/attended sessions are immutable through this workflow.
- Family money is family-level; session history remains child-specific.
- Credit/debt application is always explicit and admin-controlled.
- No cross-family transfer.
- Existing payment/renewal flows must continue to work unchanged for families who never use session changes.
- All mutations remain server-side behind `requireAdmin()`.
- No production release before founder preview acceptance.

## Review Focus

- A destination session becomes full between preview and confirmation: confirmation must fail atomically with no partial placement/ledger change.
- A family has both credit and debt entries: the displayed net balance and available/applicable amount must remain correct.
- A permanent change starts mid-paid-period and changes weekday: only eligible future unconsumed dates are replaced; historical dates remain untouched.
- A sibling consumes family credit: application must verify same `parent_lead_id` at submit time, not only in the UI.
- Re-submitting or retrying a change after a network/UI failure must not duplicate account entries or session changes.

---

### Task 1: Add ledger and session-change schema

**Files:**
- Create: `supabase/migrations/<generated>_add_family_account_and_session_changes.sql`
- Test: database verification SQL via Supabase branch/preview database

**Interfaces:**
- Produces: `family_account_entries` and `learner_session_changes` tables with admin-only access through the existing server/service path.

- [ ] **Step 1: Write failing database verification probes**
  - Assert `family_account_entries` and `learner_session_changes` do not yet exist.
  - Assert no family balance query can be executed against those tables.

- [ ] **Step 2: Run probes and verify failure**
  - Expected: undefined-table errors.

- [ ] **Step 3: Add migration**
  - Create both tables exactly as specified.
  - Add foreign keys to parent/learner/child/payment records where appropriate.
  - Add checks for allowed entry/change types.
  - Add indexes for `parent_lead_id`, originating learner, source change, and created time.
  - Enable RLS in the exposed schema; do not add browser policies because writes/reads stay through the admin service boundary.

- [ ] **Step 4: Verify migration**
  - Confirm tables/constraints/indexes exist.
  - Run Supabase security/performance advisors and record any new findings attributable to this migration.

- [ ] **Step 5: Commit**
  - `feat: add family account ledger schema`

### Task 2: Add pure financial/account domain helpers

**Files:**
- Create: `lib/family-account.ts`
- Test: `tests/family-account.test.mjs`

**Interfaces:**
- Produces:
  - `familyAccountBalance(entries): number`
  - `sessionChangeDifference(oldValueCents, newValueCents): number`
  - `validateApplicationAmount(balanceCents, amountCents, kind): void`

- [ ] **Step 1: Write failing tests**
  - Cheaper change: €80 → €50 returns `-3000`.
  - Dearer change: €50 → €80 returns `3000`.
  - Mixed entries derive correct net family balance.
  - Partial credit application leaves correct remainder.
  - Over-application throws.

- [ ] **Step 2: Run tests and verify RED**

- [ ] **Step 3: Implement minimal helpers**

- [ ] **Step 4: Run full test suite and verify GREEN**

- [ ] **Step 5: Commit**
  - `feat: add family account calculations`

### Task 3: Add future-session eligibility and replacement planner

**Files:**
- Modify: `lib/paid-period.ts`
- Create: `lib/session-change.ts`
- Test: `tests/session-change.test.mjs`

**Interfaces:**
- Consumes: existing `PaidPeriodSession`, closures, recurring placements.
- Produces:
  - `isSessionChangeable(session, attendance, today): boolean`
  - `planSingleSessionChange(...): SessionChangePreview`
  - `planRecurringChange(...): SessionChangePreview`

- [ ] **Step 1: Write failing tests**
  - Future unconsumed session is eligible.
  - Past session is rejected.
  - Present/Absent attendance is rejected.
  - Same-rate move yields zero financial difference.
  - Mid-period recurring weekday change replaces only future eligible sessions.
  - Closure date is skipped/rejected per planner rules.
  - New plan retains copied destination rate.

- [ ] **Step 2: Run tests and verify RED**

- [ ] **Step 3: Implement planner**
  - Keep planner pure; capacity/database checks remain server-side.

- [ ] **Step 4: Run full suite and verify GREEN**

- [ ] **Step 5: Commit**
  - `feat: plan future learner session changes`

### Task 4: Add transactional admin server action for confirming a session change

**Files:**
- Create: `actions/session-changes.ts`
- Modify: `lib/delivery-capacity.ts` only if a small shared capacity primitive is required
- Test: domain tests plus integration verification against preview database

**Interfaces:**
- Consumes: change preview payload, destination placement/rate, admin user.
- Produces:
  - `previewLearnerSessionChange(formData)`
  - `confirmLearnerSessionChange(formData)`

- [ ] **Step 1: Write failing integration/domain tests**
  - Cross-family or wrong-learner IDs rejected.
  - Capacity failure produces no partial writes.
  - Duplicate retry does not duplicate ledger/change rows.
  - Zero-difference change creates audit record but no ledger entry.
  - Cheaper/dearer changes create exactly one signed family-account entry.

- [ ] **Step 2: Run tests/probes and verify RED**

- [ ] **Step 3: Implement preview action**
  - Reload authoritative learner, parent, exact paid sessions, attendance, destination rate, closures, and capacity.
  - Never trust browser-supplied prices/totals.

- [ ] **Step 4: Implement confirm action**
  - Re-run authoritative validation.
  - Write session-change audit, effective-dated placement change when applicable, future dated-session/Operations changes, and ledger entry as one controlled transaction/RPC boundary.
  - One-off changes must not alter standing placement.

- [ ] **Step 5: Verify integration behavior**
  - Synthetic learner only.
  - Confirm rollback/no partial state on induced capacity failure.

- [ ] **Step 6: Commit**
  - `feat: confirm audited future session changes`

### Task 5: Add family-account read model and application actions

**Files:**
- Create: `lib/admin/family-account.ts`
- Create/modify: `actions/family-account.ts`
- Test: `tests/family-account.test.mjs` plus preview DB probes

**Interfaces:**
- Produces:
  - `loadFamilyAccount(parentLeadId)`
  - `applyFamilyCredit(formData)`
  - `collectFamilyDebt(formData)`
  - `waiveFamilyBalance(formData)`
  - `recordFamilyRefund(formData)`

- [ ] **Step 1: Write failing tests/probes**
  - Same-family sibling application accepted.
  - Cross-family sibling application rejected.
  - Partial application leaves correct balance.
  - Double application rejected.
  - Waiver/refund require non-empty reason.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement read model and actions**
  - Append offsetting entries; never edit original entries.

- [ ] **Step 4: Verify GREEN/full suite**

- [ ] **Step 5: Commit**
  - `feat: manage family account balances`

### Task 6: Add Learner Workspace “Change future sessions” UI

**Files:**
- Modify: `app/admin/learners/[id]/page.tsx`
- Create: `components/admin/session-change-form.tsx`
- Create: `components/admin/family-account-summary.tsx`
- Reuse: `components/admin/save-action-form.tsx`, existing price-plan/capacity UI patterns

**Interfaces:**
- Consumes: preview/confirm actions and family-account read model.

- [ ] **Step 1: Add component tests where practical / define manual acceptance cases**
  - One session vs from-date selector.
  - Destination place + session rate.
  - Preview comparison old vs new sessions and exact financial impact.
  - Pending spinner and disabled submit.
  - Confirmation success refreshes workspace.

- [ ] **Step 2: Implement UI**
  - Show current place, paid-through, exact affected dates, family balance, and recent entries.
  - Require explicit confirmation before mutation.

- [ ] **Step 3: Verify desktop/mobile preview with synthetic data**

- [ ] **Step 4: Commit**
  - `feat: add future session change workflow`

### Task 7: Integrate family balance into payment and renewal workflows

**Files:**
- Modify: `components/admin/payment-activation-form.tsx`
- Modify: `components/admin/renewal-workflow-table.tsx`
- Modify: `components/admin/paid-period-builder.tsx` only for summary display if needed
- Modify: `actions/paid-period.ts`

**Interfaces:**
- Consumes: family-account read model/actions.
- Produces explicit credit/debt application during payment confirmation.

- [ ] **Step 1: Write failing tests for payment math**
  - €160 period + €30 selected debt = €190 received allocation.
  - €160 period with €30 selected credit = €130 cash due.
  - No selection leaves period subtotal unchanged.
  - Cannot apply more credit/debt than currently available.
  - Applying family balance to sibling records target learner while preserving origin entry.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement explicit family-account controls**
  - Default = apply nothing.
  - Show available credit/outstanding debt.
  - Admin enters/selects amount.
  - Confirmation appends ledger offset entry alongside normal payment activation.

- [ ] **Step 4: Run full suite and production build**

- [ ] **Step 5: Commit**
  - `feat: apply family balances during billing`

### Task 8: Surface family financial status without changing lifecycle queues

**Files:**
- Modify: `app/admin/leads/page.tsx`
- Modify: `components/admin/family-lifecycle-tables.tsx`
- Modify: `app/admin/learners/[id]/page.tsx`

**Interfaces:**
- Consumes: family-account read model.

- [ ] **Step 1: Define acceptance cases**
  - Active paid learner + €30 debt remains Customer.
  - Active paid learner + €30 credit remains Customer.
  - Renewal membership remains based on paid-through logic, not ledger balance.

- [ ] **Step 2: Implement compact account badges/summaries**
  - Account settled / €X credit / €X due.

- [ ] **Step 3: Verify no lifecycle-regression tests fail**

- [ ] **Step 4: Commit**
  - `feat: surface family account status`

### Task 9: Documentation, security review, preview QA

**Files:**
- Modify: `specs/unified-paid-period-builder.md`
- Modify: `docs/product/product-roadmap.md`
- Modify: `docs/product/project-change-log.md`
- Modify: `docs/security/security-model.md` if ledger access needs explicit documentation

**Interfaces:**
- Produces release-ready documentation and QA evidence.

- [ ] **Step 1: Update durable product/engineering docs**

- [ ] **Step 2: Run full verification**
  - `npm test`
  - `npm run lint`
  - `npm run build`
  - Supabase security/performance advisors
  - inspect Vercel preview build/runtime logs

- [ ] **Step 3: QA synthetic scenarios**
  - cheaper permanent move;
  - dearer permanent move;
  - one-off move;
  - sibling credit use;
  - sibling debt collection;
  - cross-family rejection;
  - capacity race/failure;
  - retry/idempotency;
  - mobile admin interaction.

- [ ] **Step 4: Independent review**
  - correctness, accounting integrity, authorization, data history, rollback safety.

- [ ] **Step 5: Open draft PR and provide Vercel preview**
  - Do not merge until founder accepts preview.

