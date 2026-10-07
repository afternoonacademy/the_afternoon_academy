# Learner Workspace & Teaching Frameworks — Design Specification

**Date:** 7 October 2026  
**Status:** Founder-approved design awaiting implementation plan  
**Branch:** `feat/learner-workspace-teaching-frameworks`

## 1. Purpose

Redesign the learner record into a teacher-first workspace that is fast enough to use after every session while preserving useful, dated learning evidence over time.

TAA is supplementary provision. It does **not** ask teachers to reproduce school reports, duplicate school assessment systems, or complete long narrative records. The goal is to capture the minimum useful teaching evidence needed to:

- improve the next TAA session;
- maintain continuity between teachers;
- support a small number of observable learner goals;
- give concise, factual updates or advice to parents and, where appropriate and authorised, the learner's school;
- build a trustworthy learning history without creating administrative burden.

The normal post-session workflow should be completable in about **60 seconds**.

## 2. Product principles

1. **Capture once, reuse many times.** One short session record should later support next-session planning, goal review, parent updates and school liaison.
2. **Evidence over prediction.** Record what the learner did, what support was needed, what appears secure, and what should happen next.
3. **Frameworks guide teachers; they do not create paperwork.**
4. **Human judgement remains the source of truth.**
5. **TAA complements school provision; it does not recreate school reporting.**
6. **Learner context is the master.** The Operations/Session Hub may select or override today's framework, but it must not silently redefine the learner's longer-term teaching context.
7. **History is preserved.** Earlier maths support must remain visible even if the learner later returns for science.

The design is grounded in the existing TAA teacher crib sheet: small observable goals, strongest-evidence recording, next-step teaching, factual observations, and proportionate evidence rather than exhaustive reporting.

## 3. Scope

### In scope

- Teacher-first learner workspace and learner-page tab structure.
- Reusable Academy Teaching Framework catalogue.
- Multiple time-bounded Teaching Framework assignments per learner.
- One optional default active framework per learner.
- Per-session framework selection with learner default preselected.
- Session record stores the framework used at that session.
- Context-sensitive session-note labels, tooltips, examples and guidance.
- Fast General Homework Support note workflow.
- Active goals linked to learner context and optionally to a framework assignment.
- Teaching History as the renamed historical session-note view.
- Attendance moved to its own tab.
- Commercial/place information moved to a separate Admin-only tab.
- Communications moved to a separate Admin-only tab.
- Personal-profile and learner-status editing moved out of the default workspace into dedicated edit actions/pages.
- Teaching Hub available to Admin and Teacher roles.
- Admin management/versioning of Teaching Frameworks.
- Teacher read/use access to published frameworks.
- Controlled fields that can later be supplied to an approved AI system as instructional context.

### Not in scope

- Replacing school reports.
- Full curriculum/specification management.
- Automated grading, diagnosis, ranking or predicted attainment.
- AI processing of identifiable learner data under the current architecture.
- Parent portal redesign.
- School portal.
- Work-sample/document upload.
- Automatic lesson-plan generation in this slice.
- Teacher-authored long-form term reports.
- Automatic assignment of a framework based on a price plan or timetable label.

## 4. Information architecture

The learner page becomes a compact header plus tabs.

### Header

Always visible:

- learner name;
- year group;
- school;
- learner status badge;
- active Teaching Framework chips;
- `Edit learner`;
- Admin-only `Change status`;
- `Manage teaching context`.

The current large Personal Profile and Learner Lifecycle cards are removed from the default workspace.

### Tabs

#### Workspace — Admin and Teacher

Default teaching surface. It answers:

1. What are we helping this learner with?
2. What are the active goals?
3. What did we learn last time?
4. What helped / what should today's teacher know?
5. What happened today?

Contains:

- active Teaching Frameworks;
- learner-specific course/topic/objective context;
- active observable goals;
- most recent relevant teaching note / next step;
- concise learner learning profile information;
- session-note composer.

#### Attendance — Admin and Teacher

Contains:

- quick attendance action;
- full attendance history.

The current Full Attendance History card moves here.

#### Teaching History — Admin and Teacher

Chronological session-note/evidence history.

This replaces the ambiguous name **Internal teaching timeline**. It is not a separate data concept; it is the retained history of teacher session notes.

Filters may later be added by framework/subject/date, but are not required for the first slice.

#### Family & Place — Admin only

Contains the current commercial/operational learner-level information:

- recurring place(s);
- price plan;
- paid-through status;
- exact paid dates;
- renewal/payment state;
- link to family account.

Financial actions remain on the parent/family account.

#### Communications — Admin only

Contains retained family communication history already associated with the learner/family.

## 5. Teaching Framework model

A Teaching Framework is a reusable Academy-controlled teaching guide for a type of provision.

Examples:

- General Homework Support — Primary
- General Homework Support — Secondary
- KS2 Mathematics Support
- KS3 Mathematics
- IGCSE Chemistry
- IGCSE Mathematics
- Study Skills / Exam Preparation

A framework describes **how TAA approaches that kind of support**, not the complete curriculum.

### Framework fields

Minimum first-version fields:

- title;
- short description;
- stage/age guidance;
- provision type;
- preparation guidance;
- during-session guidance;
- after-session prompt configuration;
- goal guidance;
- evidence guidance;
- "avoid" / quality guardrails;
- optional reference/resource links or notes;
- status: draft / published / archived;
- version;
- created/updated audit metadata.

### Framework prompt configuration

The core saved session record remains stable, but the teacher-facing wording changes by framework.

Stable record concepts:

1. observation / evidence;
2. interpretation or support needed;
3. endpoint / progress within the session;
4. next teaching step.

A framework can control:

- field label;
- short tooltip/help text;
- placeholder/example;
- required/optional state;
- display order;
- whether a "no specific issue" / "continue as normal" quick choice is available.

Do not build a general-purpose form builder. Prompt configuration is constrained to the known teaching-note field set.

## 6. Learner Teaching Framework assignments

A learner may have **multiple framework assignments over time**, including overlapping active assignments.

Example:

- KS3 Mathematics Support — 1 Oct to 28 Nov 2026 — ended
- IGCSE Chemistry — from 3 Mar 2027 — active/default
- Study Skills / Exam Preparation — from 7 Apr 2027 — active

An assignment contains learner-specific context, including where relevant:

- learner ID;
- framework ID/version reference;
- status: active / paused / ended;
- start date;
- optional end date;
- default flag;
- curriculum/course;
- exam board;
- current unit/topic;
- learner-specific objectives;
- optional teacher context.

The reusable framework must not be duplicated merely because two learners are on different exam boards or units.

Changing a learner's active/default framework must not rewrite historical sessions.

## 7. Session framework selection

When a teacher opens or records a learner session:

1. preselect the learner's default active framework;
2. allow selection of another active assigned framework;
3. allow a deliberate ad-hoc/general override where needed;
4. use the selected framework to render the current prompts/tooltips;
5. save the selected framework/version reference with the session note.

The Operations Hub may supply today's selection, but the learner assignment remains the longer-term source of truth.

A per-session override affects that session only unless the teacher explicitly edits the learner's teaching context.

## 8. General Homework Support — initial fast workflow

The first framework should prove that the system is lightweight.

### Required: What were we working on?

Tooltip:
> Briefly record the homework, subject and topic.

Example:
> Maths homework — adding and subtracting fractions.

### Optional: Where did they need support?

Tooltip:
> Record the point where the learner became stuck, uncertain or needed help. Add what helped only if it will be useful next time.

Example:
> Could find a common denominator but became unsure when simplifying the final answer.

A teacher may choose a lightweight no-issue state rather than writing text.

### Required: Where did we get to?

Tooltip:
> Record what was completed and what the learner could do by the end of the session.

Example:
> Completed questions 1–8; last three completed independently after one worked example.

### Required: What should we pick up next?

Tooltip:
> Record the most useful thing for the next TAA session to revisit, practise or check.

Example:
> Quick retrieval on simplifying fractions before moving on.

Support a quick `Nothing specific / Continue as normal` choice.

### Time target

A normal General Homework Support record should take approximately 30–60 seconds.

## 9. Specialist framework behaviour

Specialist frameworks may use more subject-specific wording while retaining the stable underlying record.

Example for IGCSE Chemistry:

- **Learning evidence** — Which topic or objective was addressed? What could the learner explain, calculate or apply?
- **Where was support needed?** — What misconception, gap or exam-technique issue appeared?
- **Where did we get to?** — What was secure or completed independently by the end?
- **Next teaching step** — What specific retrieval, modelling, practice or examination skill should be picked up next?

The design must allow this contextualisation without adding lengthy school-report fields.

## 10. Goals

Goals remain learner-specific, not generic framework content.

A framework provides guidance and examples, while the learner record stores the actual goal.

The existing TAA principle remains:

- keep only a small number of active goals;
- normally include a curriculum goal and learning-habit goal, with confidence/participation where useful;
- make goals observable;
- aim for a useful review horizon, commonly 4–8 weeks;
- connect goals to the learner's real school learning where appropriate.

Goals may optionally reference a framework assignment.

Session-note flow should allow a quick goal update:

- No change
- Progressing
- Achieved
- Needs review

No additional prose is required unless useful.

## 11. Teaching Hub

Create a top-level **Teaching Hub** accessible to Admin and Teacher.

### Teacher permissions

Teachers can:

- browse/search published Teaching Frameworks;
- view framework crib sheets;
- view preparation/during-session/after-session guidance;
- use frameworks in learner/session workflows.

Teachers cannot:

- publish, archive or structurally edit Academy frameworks;
- alter global framework instructions.

### Admin permissions

Admins can additionally:

- create frameworks;
- edit draft/current framework content;
- publish new versions;
- archive frameworks;
- manage contextual prompt wording/tooltips/examples;
- maintain reference/resource links.

Framework changes should be versioned so historical session records can retain the framework/version used at the time.

## 12. AI boundary

The Teaching Hub may contain a controlled **future AI instructions** section so Academy methodology can later guide approved AI planning or summarisation.

However:

- this slice does not send identifiable learner data to AI;
- no new learner-facing or teacher-facing AI generation using real learner data is enabled;
- existing TAA privacy/safeguarding rules remain controlling;
- future AI enablement requires an approved provider, data-protection basis, safeguarding route and architecture review.

The Teaching Framework is instructional context, not machine-learning "training" of a model.

## 13. Roles and authorization

### Admin

Can access all learner tabs, Teaching Hub management, learner edit, lifecycle/status edit and commercial areas.

### Teacher

Can access:

- Workspace;
- Attendance;
- Teaching History;
- published Teaching Hub;
- normal learner educational editing and session-note/goal actions permitted by existing teacher capabilities.

Teacher cannot access:

- Family & Place commercial detail;
- Communications history if current role policy keeps that Admin-only;
- payments/renewals/financial actions;
- learner lifecycle/destructive status changes;
- framework administration.

All route and server-action authorization must be enforced server-side. Hidden tabs/buttons are not a security boundary.

## 14. Data/history requirements

- Preserve all existing learner records and teacher updates.
- Existing teacher updates remain visible in Teaching History.
- Do not rewrite old records when framework content changes.
- New session records retain author, timestamp/date and selected framework/version context.
- Ending a framework assignment preserves its history.
- Ending/leaving learner status preserves Teaching History and Attendance.
- Framework archival must not orphan historical records.
- Migrations must be additive and reversible where practical.

## 15. Migration strategy

The first release should adapt the existing learner/teacher-update model rather than create a parallel learner system.

Expected schema additions may include:

- `teaching_frameworks`;
- framework version/content storage or equivalent version-safe model;
- `learner_teaching_frameworks`;
- framework/version reference on new teacher/session update records;
- goal-to-assignment optional reference where useful.

Exact schema shape is deferred to the implementation plan after inspecting current migrations and constraints.

Existing `teacher_updates` data must remain readable even when framework reference is null.

## 16. UX constraints

- Mobile-first.
- Default teacher workspace must not become a dashboard of cards competing for attention.
- Most common teaching actions should be visible without scrolling through billing/admin data.
- Use concise labels and short tooltips.
- Avoid long required textareas.
- Display a "last time / next step" summary prominently.
- A teacher should be able to enter, complete and save a routine Homework Support note quickly from phone or laptop.
- Empty states should explain the next useful action, not expose technical terminology.

## 17. Quality and safeguarding

Prompt guidance should reinforce the existing TAA standards:

- factual observations;
- what the learner actually did;
- what appeared secure or difficult;
- what support helped;
- one useful next step;
- no clinical/diagnostic labels;
- no unsupported predictions;
- safeguarding concerns follow the safeguarding route rather than being buried in routine learning notes.

## 18. Acceptance criteria

The slice is acceptable when:

1. A teacher opens a learner and lands on a teaching-focused Workspace without commercial/admin clutter.
2. Personal profile and learner status forms no longer permanently occupy the Workspace.
3. Attendance has its own tab and existing history is preserved.
4. Internal teaching timeline is presented as Teaching History.
5. Admin can create/publish a Teaching Framework.
6. Teacher can view and use published frameworks but cannot edit global framework content.
7. A learner can have multiple framework assignments over time and overlapping active assignments.
8. One active assignment can be marked default.
9. A routine session defaults to the learner's default framework but can be overridden for that session.
10. The session-note prompts change according to the selected framework.
11. General Homework Support uses the approved short prompts and can be completed without school-report-style prose.
12. Saved session history retains the framework/version used.
13. Changing or ending a framework assignment does not alter historical notes.
14. Existing teacher updates with no framework still render correctly.
15. Teacher cannot reach Admin-only Family & Place, Communications or framework-management actions directly.
16. No new AI call sends identifiable learner data.
17. Full automated tests, authorization tests, typecheck/build and preview verification pass before release.

## 19. Testing strategy

Automated tests should cover at minimum:

- role/capability access to learner tabs and Teaching Hub actions;
- multiple learner-framework assignments;
- only one default active assignment;
- framework/session override semantics;
- framework version preservation;
- legacy teacher-update rendering with null framework;
- General Homework Support prompt configuration;
- goal quick-status updates;
- inactive/ended assignment history;
- learner status changes preserving evidence/history.

Manual preview checks should use synthetic learners for:

- mobile and desktop Workspace;
- primary Homework Support note;
- specialist framework note;
- switching framework for one session;
- ending one framework and starting another;
- Admin vs Teacher navigation and direct-route access;
- long/empty learner histories.

## 20. Release strategy

Implement on this feature branch with additive migrations.

Release sequence:

1. schema and authorization foundation;
2. Teaching Framework management;
3. learner framework assignments;
4. learner Workspace/tab redesign;
5. contextual session notes and history;
6. tests/review;
7. preview with synthetic data;
8. founder acceptance;
9. production migration/release.

Do not merge solely because the UI builds; preserve the existing operations, family, attendance and learner-history invariants throughout.
