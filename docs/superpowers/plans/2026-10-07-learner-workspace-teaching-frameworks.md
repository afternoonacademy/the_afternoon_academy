# Learner Workspace & Teaching Frameworks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a teacher-first learner workspace with reusable Teaching Frameworks, multiple time-bounded framework assignments per learner, contextual 30–60 second session notes, separate attendance/teaching-history/admin tabs, and a Teaching Hub that guides teachers without turning TAA into a school-reporting system.

**Architecture:** Add a small versioned Teaching Framework domain beside the existing learner tables rather than replacing them. Frameworks provide reusable guidance and prompt configuration; learner-framework assignments hold learner-specific course/topic/objective context; new teacher updates retain the selected framework/version used for that session while legacy updates remain valid with null framework references. The learner page is decomposed into a tabbed shell with teacher-first components, while Admin-only commercial and communications data stays server-gated.

**Tech Stack:** Next.js 16 App Router, React/TypeScript, Supabase/Postgres, existing server actions/capability layer, Node test runner, Vercel preview deployments.

**Spec:** `docs/superpowers/specs/2026-10-07-learner-workspace-teaching-frameworks-design.md`

## Global Constraints

- A normal post-session workflow should be completable in about **60 seconds**.
- TAA complements school provision; it does **not** recreate school reports.
- Frameworks guide teachers; they do not create paperwork.
- Learner context is the long-term source of truth; a session override affects that session only.
- Learners may have multiple framework assignments over time, including overlapping active assignments.
- Preserve all existing learner, goal, attendance and teacher-update history.
- Existing teacher updates with no framework reference must continue to render.
- No new AI call may send identifiable learner data.
- Teacher access must remain server-authorized, not merely hidden in the UI.
- Commercial/payment/family communication surfaces remain Admin-only.
- Migrations must be additive and avoid destructive production changes.
- Do not build a general-purpose form builder or full curriculum-management system.
- Read the relevant Next.js 16 documentation in `node_modules/next/dist/docs/` before implementation changes.

## Review Focus

1. **Two concurrent active frameworks with no default:** Workspace must ask for an explicit framework selection rather than guessing.
2. **Default framework is ended/paused:** Session-note flow must not preselect an inactive assignment.
3. **Published framework later changes:** Historical session notes must continue to display the version used at save time.
4. **Teacher deep-links an Admin-only learner tab or framework-management route:** server authorization must reject access even if navigation is hidden.
5. **Legacy teacher update has no framework/prompt snapshot:** Teaching History must render the old What happened / Why it mattered / Next step record without error.

---

### Task 1: Teaching Framework schema and version-safe domain

**Files:**
- Create: `supabase/migrations/20261007110000_add_teaching_frameworks.sql`
- Create: `lib/teaching/frameworks.mjs`
- Test: `tests/teaching-frameworks.test.mjs`

**Interfaces:**
- Consumes: existing `learners`, `teacher_updates`, `learner_goals`, `users`.
- Produces:
  - `teaching_frameworks` records with stable identity/status.
  - `teaching_framework_versions` immutable published/draft content records.
  - `learner_teaching_frameworks` assignment records.
  - optional framework/version/assignment references on `teacher_updates`.
  - optional assignment reference on `learner_goals`.
  - `normalizeTeachingFrameworkPrompts(config)`.
  - `generalHomeworkSupportPromptConfig`.

- [ ] **Step 1: Write the failing domain tests**

Add tests asserting:
- General Homework Support exposes exactly the approved field labels in order:
  1. `What were we working on?`
  2. `Where did they need support?`
  3. `Where did we get to?`
  4. `What should we pick up next?`
- support-needed is optional;
- the other three fields are required;
- next-step config offers `Nothing specific / Continue as normal`;
- invalid/unrecognised prompt keys are rejected rather than becoming arbitrary form-builder fields.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/teaching-frameworks.test.mjs`  
Expected: FAIL because the framework module/config does not exist.

- [ ] **Step 3: Implement the migration**

Create additive tables/columns with:
- `teaching_frameworks(id, title, slug, short_description, stage_guidance, provision_type, status draft|published|archived, current_version_id nullable, created_by, updated_by, created_at, updated_at)`;
- `teaching_framework_versions(id, framework_id, version_number, preparation_guidance, during_session_guidance, goal_guidance, evidence_guidance, avoid_guidance, reference_resources jsonb, prompt_config jsonb, created_by, created_at, published_at nullable)`;
- `learner_teaching_frameworks(id, learner_id, framework_id, framework_version_id, status active|paused|ended, starts_on, ends_on nullable, is_default, curriculum_course, exam_board, current_unit_topic, learner_objectives, teacher_context, created_by, updated_by, created_at, updated_at)`;
- indexes for framework status, learner assignment status/date, and default lookup;
- unique partial constraint/index allowing at most one active default assignment per learner;
- optional nullable `teaching_framework_id`, `teaching_framework_version_id`, `learner_teaching_framework_id`, and `prompt_snapshot jsonb` on `teacher_updates`;
- optional nullable `learner_teaching_framework_id` on `learner_goals`;
- RLS enabled and anon/authenticated revoked, matching current server-only learner tables;
- service-role grants consistent with current migration patterns;
- no backfill that fabricates framework history for old teacher updates.

- [ ] **Step 4: Implement `lib/teaching/frameworks.mjs`**

Export:
- `TEACHING_NOTE_FIELDS`;
- `generalHomeworkSupportPromptConfig`;
- `normalizeTeachingFrameworkPrompts(config)`;
- `teachingFrameworkStatusLabel(status)`.

Constrain prompt configuration to the four known fields; do not permit arbitrary custom field definitions.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/teaching-frameworks.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Validate migration assumptions against current schema**

Check existing FK types and author conventions in the production schema/migrations. Do not apply the migration to production at this stage.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20261007110000_add_teaching_frameworks.sql lib/teaching/frameworks.mjs tests/teaching-frameworks.test.mjs
git commit -m "feat: add teaching framework data model"
```

### Task 2: Teaching Framework permissions and navigation

**Files:**
- Modify: `lib/auth/capabilities.mjs`
- Modify: `lib/admin/admin-navigation.mjs`
- Modify: `lib/admin/admin-route-policy.mjs`
- Modify: `tests/auth-capabilities.test.mjs`
- Modify: `tests/teacher-action-permissions.test.mjs`

**Interfaces:**
- Consumes: existing role/capability policy.
- Produces:
  - `view_teaching_hub` for Admin and Teacher.
  - `manage_teaching_frameworks` for Admin only.
  - top-level `/admin/teaching` navigation for Admin and Teacher.

- [ ] **Step 1: Write failing authorization/navigation tests**

Assert:
- teacher has `view_teaching_hub`;
- teacher does not have `manage_teaching_frameworks`;
- admin has both;
- teacher navigation becomes `/admin/operations`, `/admin/learners`, `/admin/teaching`;
- Admin navigation includes `/admin/teaching` without losing existing routes;
- route policy requires `view_teaching_hub` for browse routes and `manage_teaching_frameworks` for management routes.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/auth-capabilities.test.mjs tests/teacher-action-permissions.test.mjs`  
Expected: FAIL because teaching-hub capabilities/routes are absent.

- [ ] **Step 3: Implement capability and navigation changes**

Add the two capabilities and route/navigation mappings without widening Teacher access to commercial/setup/destructive capabilities.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/auth-capabilities.test.mjs tests/teacher-action-permissions.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/capabilities.mjs lib/admin/admin-navigation.mjs lib/admin/admin-route-policy.mjs tests/auth-capabilities.test.mjs tests/teacher-action-permissions.test.mjs
git commit -m "feat: add teaching hub capabilities"
```

### Task 3: Teaching Framework server actions and seed framework

**Files:**
- Create: `actions/teaching-frameworks.ts`
- Create: `lib/teaching/framework-actions.mjs`
- Create: `supabase/migrations/20261007112000_seed_general_homework_support_framework.sql`
- Create: `tests/teaching-framework-actions.test.mjs`

**Interfaces:**
- Consumes:
  - `manage_teaching_frameworks`;
  - `view_teaching_hub`;
  - Task 1 framework schema/config.
- Produces server actions:
  - `createTeachingFramework(formData)`;
  - `saveTeachingFrameworkDraft(formData)`;
  - `publishTeachingFrameworkVersion(formData)`;
  - `archiveTeachingFramework(formData)`.

- [ ] **Step 1: Write failing action-policy/domain tests**

Test pure policy helpers for:
- only Admin capability may mutate framework definitions;
- a publish creates a new immutable version number;
- publishing does not mutate an older published version;
- archived frameworks remain referenceable historically;
- prompt config is normalised through Task 1 rather than accepting arbitrary JSON.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/teaching-framework-actions.test.mjs`  
Expected: FAIL because action policy helpers do not exist.

- [ ] **Step 3: Implement pure action helpers**

In `lib/teaching/framework-actions.mjs`, define validation/status/version helpers used by the server actions.

- [ ] **Step 4: Implement Admin-only server actions**

Use `assertCapability("manage_teaching_frameworks")`. Validate text lengths/statuses with Zod. Store author using the internal TAA user ID where FKs reference `public.users`; do not repeat the prior auth-user/internal-user ID mistake.

- [ ] **Step 5: Add the initial General Homework Support framework seed**

Seed one published reusable framework with the approved prompts/tooltips/examples from the spec. Make the migration idempotent by stable slug and explicit version semantics.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/teaching-framework-actions.test.mjs tests/teaching-frameworks.test.mjs`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add actions/teaching-frameworks.ts lib/teaching/framework-actions.mjs supabase/migrations/20261007112000_seed_general_homework_support_framework.sql tests/teaching-framework-actions.test.mjs
git commit -m "feat: manage versioned teaching frameworks"
```

### Task 4: Teaching Hub UI

**Files:**
- Create: `app/admin/teaching/page.tsx`
- Create: `app/admin/teaching/frameworks/[id]/page.tsx`
- Create: `components/admin/teaching-framework-card.tsx`
- Create: `components/admin/teaching-framework-editor.tsx`
- Create: `components/admin/teaching-prompt-editor.tsx`
- Test: `tests/teaching-hub-presentation.test.mjs`

**Interfaces:**
- Consumes Task 2 permissions and Task 3 actions.
- Produces:
  - Teacher-readable framework catalogue/crib sheets.
  - Admin-only editor controls for draft/publish/archive.

- [ ] **Step 1: Write failing presentation-policy tests**

Define a small pure presentation helper if needed and assert:
- Teacher receives published frameworks only;
- Admin may see draft/published/archived status where needed;
- edit/publish controls require `manage_teaching_frameworks`;
- Teacher cannot infer management controls merely by direct route request.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/teaching-hub-presentation.test.mjs`  
Expected: FAIL because presentation policy/helper is absent.

- [ ] **Step 3: Implement the Teaching Hub catalogue**

Use `requireCapability("view_teaching_hub")`. Display concise crib-sheet content: purpose, before-session, during-session, after-session prompts, goal/evidence guidance, references. Avoid exposing raw JSON.

- [ ] **Step 4: Implement Admin editor route/components**

Use server-side `manage_teaching_frameworks` checks. Build a constrained editor for the known guidance sections and four known note fields. Do not build arbitrary field-creation UI.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/teaching-hub-presentation.test.mjs tests/auth-capabilities.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/admin/teaching components/admin/teaching-framework-card.tsx components/admin/teaching-framework-editor.tsx components/admin/teaching-prompt-editor.tsx tests/teaching-hub-presentation.test.mjs
git commit -m "feat: add teaching hub"
```

### Task 5: Learner framework assignments and teaching-context management

**Files:**
- Create: `actions/learner-teaching-context.ts`
- Create: `lib/teaching/learner-frameworks.mjs`
- Create: `components/admin/learner-teaching-context.tsx`
- Create: `app/admin/learners/[id]/teaching-context/page.tsx`
- Test: `tests/learner-teaching-frameworks.test.mjs`

**Interfaces:**
- Consumes framework/version records from Task 1.
- Produces:
  - `activeLearnerFrameworks(assignments, onDate)`;
  - `defaultLearnerFramework(assignments, onDate)`;
  - `createLearnerFrameworkAssignment(formData)`;
  - `updateLearnerFrameworkAssignment(formData)`;
  - `setDefaultLearnerFramework(formData)`;
  - `endLearnerFrameworkAssignment(formData)`.

- [ ] **Step 1: Write failing assignment tests**

Assert:
- learner may have multiple active assignments;
- historical ended Maths plus current Science both remain in returned history;
- only an active assignment can be default;
- default helper ignores paused/ended assignments;
- two active assignments with no default returns null rather than guessing;
- attempting two active defaults is rejected;
- end date before start date is rejected;
- overlapping non-default assignments are allowed.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/learner-teaching-frameworks.test.mjs`  
Expected: FAIL because assignment helpers do not exist.

- [ ] **Step 3: Implement assignment helpers and server actions**

Use `edit_learning_record` for normal teaching-context assignment changes, but keep destructive learner lifecycle actions Admin-only. Validate framework is published when assigning to a learner. Preserve historical assignments.

- [ ] **Step 4: Implement teaching-context management page**

Allow:
- add framework assignment;
- mark one active assignment default;
- pause/resume/end assignment;
- edit learner-specific curriculum/course, exam board, current unit/topic, objectives, teacher context.

Keep the form concise; framework itself carries the reusable teaching method.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/learner-teaching-frameworks.test.mjs tests/teacher-action-permissions.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add actions/learner-teaching-context.ts lib/teaching/learner-frameworks.mjs components/admin/learner-teaching-context.tsx app/admin/learners/[id]/teaching-context/page.tsx tests/learner-teaching-frameworks.test.mjs
git commit -m "feat: assign teaching frameworks to learners"
```

### Task 6: Dedicated learner edit/status pages

**Files:**
- Create: `app/admin/learners/[id]/edit/page.tsx`
- Create: `app/admin/learners/[id]/status/page.tsx`
- Modify: `actions/learners.ts`
- Test: `tests/learner-workspace-access.test.mjs`

**Interfaces:**
- Consumes existing `updateLearnerPersonalProfile` and `updateLearnerDetails`.
- Produces dedicated edit/status routes so those forms no longer occupy the default workspace.

- [ ] **Step 1: Write failing access tests**

Assert:
- Teacher with `edit_learning_record` can reach/use personal educational/profile editing allowed by current policy;
- Teacher cannot change destructive lifecycle status;
- Admin can change status;
- status change continues to preserve historical learner evidence.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/learner-workspace-access.test.mjs`  
Expected: FAIL until route/action policy is explicit.

- [ ] **Step 3: Implement dedicated edit page**

Move existing personal-profile inputs to `/admin/learners/[id]/edit`. Preserve current school-contact permission validation.

- [ ] **Step 4: Implement Admin-only status page**

Move the active/paused/left control to `/admin/learners/[id]/status` guarded by destructive Admin capability.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/learner-workspace-access.test.mjs tests/teacher-action-permissions.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/admin/learners/[id]/edit/page.tsx app/admin/learners/[id]/status/page.tsx actions/learners.ts tests/learner-workspace-access.test.mjs
git commit -m "refactor: move learner editing out of workspace"
```

### Task 7: Learner workspace tab shell and data separation

**Files:**
- Refactor: `app/admin/learners/[id]/page.tsx`
- Create: `components/admin/learner-header.tsx`
- Create: `components/admin/learner-workspace-tabs.tsx`
- Create: `components/admin/learner-workspace-overview.tsx`
- Create: `components/admin/learner-attendance-panel.tsx`
- Create: `components/admin/learner-teaching-history.tsx`
- Create: `components/admin/learner-family-place.tsx`
- Create: `components/admin/learner-communications-panel.tsx`
- Test: `tests/learner-workspace-tabs.test.mjs`

**Interfaces:**
- Consumes assignment helpers from Task 5 and existing attendance/communications/commercial queries.
- Produces a single learner shell where only allowed tabs/data are queried/rendered for the current role.

- [ ] **Step 1: Write failing tab-policy tests**

Assert:
- Teacher tabs: Workspace, Attendance, Teaching History;
- Admin tabs: Workspace, Attendance, Teaching History, Family & Place, Communications;
- Teacher commercial/communications tab requests are rejected server-side;
- learner header includes status and active framework labels but not billing/payment status;
- legacy learner with no framework still gets a usable Workspace empty state.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/learner-workspace-tabs.test.mjs`  
Expected: FAIL because tab policy/components are absent.

- [ ] **Step 3: Refactor learner page into focused components**

The default page should no longer load all commercial/communications data for Teacher. Keep server-side queries role-aware.

Header:
- name;
- year group;
- school;
- status;
- active framework chips;
- Edit learner;
- Manage teaching context;
- Admin-only Change status.

- [ ] **Step 4: Implement Attendance and Teaching History tabs**

Move Quick Attendance and full attendance history into Attendance. Rename Internal teaching timeline to Teaching History. Preserve legacy notes.

- [ ] **Step 5: Implement Admin-only Family & Place and Communications tabs**

Reuse current booking/payment summary and `FamilyCommunications`, but keep them out of the default teaching view and out of Teacher payloads.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/learner-workspace-tabs.test.mjs tests/auth-capabilities.test.mjs`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/admin/learners/[id]/page.tsx components/admin/learner-*.tsx tests/learner-workspace-tabs.test.mjs
git commit -m "feat: redesign learner workspace tabs"
```

### Task 8: Contextual 60-second session-note workflow

**Files:**
- Replace/refactor: `components/admin/ai-teacher-update.tsx`
- Create: `components/admin/teacher-session-note.tsx`
- Modify: `actions/learners.ts`
- Create: `lib/teaching/session-note.mjs`
- Test: `tests/session-note-context.test.mjs`

**Interfaces:**
- Consumes:
  - active/default framework assignments;
  - framework prompt config/version;
  - existing `teacher_updates`.
- Produces:
  - `resolveSessionFramework({ assignments, requestedAssignmentId, onDate })`;
  - `buildPromptSnapshot(version)`;
  - framework-aware `createTeacherUpdate(formData)`.

- [ ] **Step 1: Write failing session-context tests**

Assert:
- one active default is preselected;
- requested active assignment overrides default for that session;
- requested paused/ended assignment is rejected;
- two active assignments with no default require explicit choice;
- saved prompt snapshot is derived from the selected framework version;
- legacy/no-framework save path remains possible only through explicit general/ad-hoc fallback;
- General Homework Support requires working-on, reached, next-step; support-needed is optional;
- `Nothing specific / Continue as normal` is accepted as the next-step quick state;
- no framework change is written back to learner assignment when session override is used.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/session-note-context.test.mjs`  
Expected: FAIL because resolver/snapshot logic does not exist.

- [ ] **Step 3: Implement pure session-note resolver/snapshot helpers**

Keep the four stable semantic fields. Map contextual prompt labels/tooltips without changing the underlying note contract into an arbitrary form schema.

- [ ] **Step 4: Update `createTeacherUpdate`**

Switch from Admin-only auth-user assumptions to existing teacher-safe `edit_learning_record` policy. Store internal/author identity using the FK convention actually required by `teacher_updates.author_id`; verify whether that FK remains `auth.users` before changing it. Save selected framework/version/assignment and prompt snapshot when present.

Do **not** call the current learner-draft AI endpoint from the new default session-note path because identifiable learner data is not approved for AI use.

- [ ] **Step 5: Implement contextual note UI**

Render:
- framework selector from active learner assignments;
- contextual labels/tooltips/examples;
- concise fields;
- optional support-needed field;
- next-step quick choice;
- no large narrative-report presentation.

Target mobile completion in 30–60 seconds for Homework Support.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/session-note-context.test.mjs tests/teacher-action-permissions.test.mjs`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/admin/ai-teacher-update.tsx components/admin/teacher-session-note.tsx actions/learners.ts lib/teaching/session-note.mjs tests/session-note-context.test.mjs
git commit -m "feat: add contextual fast session notes"
```

### Task 9: Goal linkage and quick progress updates

**Files:**
- Modify: `actions/learners.ts`
- Create: `components/admin/learner-goals-panel.tsx`
- Create: `lib/teaching/goals.mjs`
- Test: `tests/learner-goals-context.test.mjs`

**Interfaces:**
- Consumes existing learner goals and optional framework assignment FK.
- Produces quick session-facing states:
  - No change
  - Progressing
  - Achieved
  - Needs review

- [ ] **Step 1: Write failing goal-context tests**

Assert:
- goal may link to an active or historical learner framework assignment;
- ending the assignment does not delete/alter the goal;
- quick `No change` does not create unnecessary prose/history;
- `Achieved` maps safely to existing achieved state;
- `Needs review` is represented without inventing a diagnostic state or deleting prior evidence.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/learner-goals-context.test.mjs`  
Expected: FAIL until goal context helpers exist.

- [ ] **Step 3: Implement goal-context helpers/actions**

Prefer compatibility with existing goal statuses. If `Progressing` and `Needs review` require dated progress events rather than widening the goal status enum, add a small append-only goal-progress table in an additive migration instead of overloading `learner_goals.status`.

- [ ] **Step 4: Build the concise goals panel**

Surface only active goals prominently. Framework guidance may suggest good goal shape but must not generate a school-report workload.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/learner-goals-context.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add actions/learners.ts components/admin/learner-goals-panel.tsx lib/teaching/goals.mjs tests/learner-goals-context.test.mjs supabase/migrations
git commit -m "feat: link learner goals to teaching context"
```

### Task 10: Documentation, full verification and preview

**Files:**
- Modify: `docs/product/product-roadmap.md`
- Modify: `docs/product/project-change-log.md`
- Modify: `docs/engineering/current-baseline.md`
- Modify: `AGENTS.md`
- Possibly modify: `docs/security/security-model.md`

**Interfaces:**
- Consumes all completed tasks.
- Produces the release-candidate documentation and verification evidence.

- [ ] **Step 1: Update product/engineering documentation**

Record:
- Teaching Framework architecture;
- multiple learner assignments/history;
- learner-first master vs per-session override rule;
- 60-second evidence-capture principle;
- Teaching History naming;
- Teacher/Admin Teaching Hub permissions;
- no-school-report and no-identifiable-AI constraints.

- [ ] **Step 2: Run the complete automated suite**

Run: `npm test`  
Expected: all tests PASS. Report every failure if any; do not proceed on red.

- [ ] **Step 3: Run lint/typecheck/build according to repository scripts**

Run the project-defined lint/typecheck/build commands after reading `package.json` and Next.js 16 docs.  
Expected: no TypeScript/build errors.

- [ ] **Step 4: Review authorization and data-history behavior**

Verify specifically:
- Teacher cannot fetch Admin-only learner commercial/comms data;
- Teacher cannot mutate global frameworks;
- Admin can manage frameworks;
- historical updates with null framework render;
- ended framework assignments remain historical;
- session override does not change learner default;
- no new AI call receives identifiable learner data.

- [ ] **Step 5: Apply migrations only to the intended non-production/preview-safe database path**

Do not apply destructive changes. If the current project lacks a separate preview database and migration testing would touch production, stop and surface that release risk before applying.

- [ ] **Step 6: Create one Vercel preview build**

Verify with synthetic/fake learner data:
- mobile and desktop learner Workspace;
- General Homework Support 30–60 second note;
- two concurrent frameworks and explicit selector;
- framework override;
- Attendance tab/history;
- Teaching History including a legacy note;
- Admin-only Family & Place / Communications;
- Teacher Teaching Hub read access;
- Admin framework management.

- [ ] **Step 7: Independent review**

Run a distinct review pass focused on privacy, authorization, migration safety, historical integrity and the risk of creating teacher paperwork.

- [ ] **Step 8: Founder acceptance**

Do not merge until the founder confirms that the Workspace is genuinely faster and clearer for a teacher.

- [ ] **Step 9: Commit release-candidate documentation**

```bash
git add AGENTS.md docs
git commit -m "docs: record teaching framework learner workspace"
```

- [ ] **Step 10: Open/update PR**

Create or update the feature PR against `main` with test/build/preview/migration evidence and explicit production migration steps.


### Task 11: Integrate learner evidence with monthly Family Updates

**Files:**
- Create: `lib/teaching/family-summary-evidence.mjs`
- Create: `lib/email/learning-update.mjs`
- Create: `actions/family-updates.ts`
- Modify: `app/api/admin/family-summary/route.ts`
- Modify: `components/admin/family-summary-workspace.tsx`
- Modify: `app/admin/family-updates/page.tsx`
- Test: `tests/family-summary-evidence.test.mjs`
- Test: `tests/learning-update-email.test.mjs`

**Interfaces:**
- consumes contextual/legacy teacher updates, learner goals/progress, Teaching Framework assignment context and learner-profile context;
- explicitly does not consume attendance or commercial/payment data;
- produces a reviewable evidence bundle, an optional Vercel AI Gateway draft, and an explicit Resend send action logged as `learning_update`.

- [x] Write and run RED/GREEN tests for evidence-bundle compatibility and no-attendance behaviour.
- [x] Write and run RED/GREEN test for escaped learning-update email rendering.
- [x] Add Admin-only evidence preview before AI drafting.
- [x] Expand the AI prompt to contextual notes, legacy notes, goals/progress, teaching context and controlled framework guidance.
- [x] Keep evidence preview operational when AI Gateway is unavailable.
- [x] Add explicit human-reviewed send action through Resend and email delivery logging.
- [ ] Run full repository tests/typecheck/build and verify the Family Updates preview on the next coherent Vercel preview deployment.
