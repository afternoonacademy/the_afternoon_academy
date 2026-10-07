# The Afternoon Academy — Agent Engineering Rules

You are working on The Afternoon Academy (TAA), an education operations platform supporting children, parents, teachers, administrators, and future specialist partners.

## Product source of truth

Before material product or engineering work, read the relevant project documents:

- `docs/product/product-roadmap.md`
- `docs/product/project-change-log.md`
- `docs/engineering/agentic-development.md`
- `docs/engineering/current-baseline.md`
- `docs/security/security-model.md`
- the relevant feature specification under `specs/`

The roadmap and change log outrank ad-hoc assumptions. If a requested change conflicts with them, surface the conflict before implementation.

## TAA product principles

1. Human judgement is the source of truth for children.
2. Evidence over prediction: progress is grounded in dated teacher observations, work samples, child reflection, attendance, and explicit goals.
3. The group is a product: matching is based on learning need, age, personality, and timetable, not simply capacity.
4. Parent trust is earned through concise, meaningful, factual communication.
5. Privacy and safeguarding are foundational.
6. Build reliable operations before adding parent-facing surface area.
7. AI is admin-supportive and human-reviewed; it does not diagnose, label, rank, predict outcomes, or make high-stakes decisions about children.

## Architecture and security non-negotiables

- Authentication is not authorization. Enforce access server-side and in the database where appropriate.
- Never rely on hidden UI controls as a security boundary.
- Never expose Supabase service-role credentials, private API keys, or other secrets to the browser.
- Never commit secrets or production credentials.
- Never bypass Row Level Security to make a feature work.
- Prefer least-privilege access for staff, parents, integrations, and agents.
- Historical learner records must be preserved when a learner becomes inactive or leaves.
- Every meaningful child record should retain author, timestamp, and appropriate access context.
- Safeguarding-sensitive information must have a stricter access boundary than routine learning/operations data.
- Do not send identifiable learner, parent, school-contact, safeguarding, attendance, or learning-profile data to an AI provider unless the provider, data-protection basis, consent/notice, safeguarding route, and project architecture have been explicitly approved.
- Do not make destructive production database changes without explicit human approval and a rollback plan.

## Engineering workflow: TAA Safe Agentic Development

Every significant feature follows this sequence:

1. **Discover** — read project rules, relevant docs/specs, and inspect the current code/database. Do not change files yet.
2. **Plan** — produce an implementation plan covering scope, files, data/schema impact, authorization, migrations, failure modes, acceptance criteria, and testing.
3. **Approval** — wait for explicit approval before implementation when the change is significant, security-sensitive, data-destructive, or changes product scope.
4. **Build** — implement on a feature branch. Avoid unrelated changes.
5. **Test** — run typecheck, lint, build, relevant automated tests, authorization tests, and user-flow tests.
6. **Review** — have a reviewer distinct from the implementing agent inspect correctness, privacy, security, data integrity, and maintainability.
7. **Preview** — verify in a non-production preview environment using non-production/fake learner data.
8. **Human acceptance** — confirm the product behavior matches TAA operating reality.
9. **Release** — merge only when checks pass and any migration/release steps are understood.

For small, low-risk changes, steps may be proportionate, but security/privacy rules never become optional.

## Planning format

Before implementing a significant feature, report:

- Goal and non-goals
- Existing implementation inspected
- Files expected to change
- Data/schema/migration changes
- Roles and permissions affected
- Privacy/safeguarding implications
- Acceptance criteria
- Automated and manual test plan
- Rollback/recovery approach where relevant
- Assumptions or decisions requiring founder approval

## Database expectations

Treat the database as a primary security boundary.

For every learner-data feature, verify:

- who can read the row;
- who can create/update it;
- who cannot access it;
- whether historical data must remain visible after status changes;
- whether access is enforced by RLS/server authorization rather than UI alone;
- whether audit metadata is retained.

Development and test work should use synthetic data. Production child data must not be copied into local development or third-party AI tools.

## Required testing mindset

Because AI-generated code can look plausible while being wrong, encode important product expectations as tests where practical. Examples include:

- an authenticated teacher can see only learners they are authorized to support;
- an unauthenticated visitor cannot access learner records;
- a parent cannot access another family's learner record;
- marking a learner as `left` preserves attendance and teacher-update history;
- deleting/deactivating a staff account does not erase historical authorship;
- private fields are not serialized into browser payloads unnecessarily.

## Release discipline

- Do not develop significant features directly on `main`.
- Use focused feature branches and pull requests.
- Do not merge a PR merely because the implementing agent says it is correct.
- Security review tools are an additional layer, not proof that the app is secure.
- Preview deployments are for verification; production is not a test environment.

### Deployment economy — Vercel previews are a limited resource

Vercel preview/build capacity must be treated as a limited operational resource. TAA can hit Vercel deployment/rate limits if every small development commit triggers its own build.

- **Do not use incremental Vercel deployments as the development loop.** A sequence of test-first edits, helper commits, UI commits, refactors or intermediate broken states must not each trigger a preview build merely because they are separate implementation steps.
- **Batch implementation work into sensible development chunks before pushing to a branch that auto-deploys.** The agent is responsible for deciding the appropriate chunk size based on risk, feature boundaries and what actually needs browser/runtime verification.
- **Prefer local/repository-level verification first:** automated tests, lint, typecheck, build and code review should catch ordinary implementation errors before a Vercel preview is requested.
- **Create a preview deployment only when it adds information that local/static verification cannot provide**, such as integrated browser behaviour, Vercel runtime/environment behaviour, authentication/deployment protection, or founder acceptance of a coherent feature slice.
- **Do not deliberately push known-red or intentionally incomplete TDD states to an auto-deploying branch.** RED tests belong in the development workspace; Vercel should receive a coherent green chunk.
- **For a normal feature, aim for the minimum useful number of previews rather than a preview per commit.** Often one coherent release-candidate preview is enough; use additional previews only when a meaningful integration finding requires another verification cycle.
- **Documentation-only or bookkeeping changes should be batched with the next appropriate code push where practical** rather than consuming a deployment on their own.
- Before starting implementation on an auto-deploying branch, explicitly consider the repo's deployment trigger behaviour and plan the commit/push strategy accordingly.
- If a workflow/tooling choice would create many deployments, change the workflow rather than accepting the deployment volume.
- When reporting implementation progress, distinguish **commits** from **deployments**. Frequent logical checkpoints are acceptable internally; frequent Vercel builds are not required.

The goal is not an arbitrary fixed deployment count. The agent must use engineering judgement to choose the fewest deployments that still provide safe, meaningful verification and human acceptance.

## Role model for AI-assisted work

The same model may perform different roles at different times, but keep the responsibilities distinct:

- **Product Architect** — translates founder intent and roadmap into a precise specification.
- **Developer Agent** — implements the approved specification.
- **QA Agent** — tests happy paths, edge cases, regression risks, and responsive behavior.
- **Security Reviewer** — reviews authentication, authorization, RLS, secrets, privacy, dependencies, and unsafe data flow.
- **Release Reviewer** — verifies migrations, environment changes, checks, preview behavior, and rollback readiness.

The implementing agent must not be treated as the sole reviewer of its own work.

## Definition of done

A feature is not done merely because the UI renders. It is done when the agreed acceptance criteria pass, permissions are correct, failure states are handled, relevant tests pass, project documentation is updated when needed, and the behavior has been verified in preview.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


## Current operations invariants — October 2026

Treat the following as current production architecture unless a later roadmap/change-log entry explicitly supersedes it:

- **Family Pipeline is the operational lifecycle surface.** Leads, paid customers, renewals and closed/archive states should not be duplicated into parallel admin systems.
- **Parent/family account is the financial coordination surface.** Family-level credit/debt and future paid-session changes are managed from the family record. Learner pages may link to it but must not duplicate financial actions.
- **Recurring place is the long-term timetable source of truth.** A first paid period may contain pre-agreed one-off exceptions without altering the standing recurring pattern. Future renewals regenerate from the effective standing placement, not from first-period exceptions.
- **Exact dated sessions are the payment/delivery source of truth.** Quotes, paid entitlements, renewal selections and dated Operations seats must remain tied to the exact selected sessions and copied price.
- **Post-payment timetable changes are explicit and auditable.** Future paid sessions may be changed one-off or from an effective date. A cheaper change creates family credit; a dearer change creates family balance due. Credit/debt is never silently applied to a sibling or future bill.
- **Effective-dated standing placements preserve history.** Past/attended sessions are not rewritten when the learner changes day, time or commercial plan.
- **Initial and renewal communication terminology differs intentionally.** Pre-agreed first-period exceptions are presented to parents as normal agreed dates. Genuine later renewal/session replacements may be labelled `replacement`.
- **Academy closures are calendar exclusions.** A blank closure end date means a single-day closure; invalid ranges must produce a handled admin error, never a page-level crash.

### Parent email template rule

`academy_email_templates` is the source of truth for editable parent-facing wording for planned-place and renewal emails.

- Do not hard-code new parent-facing sentences into a renderer when they should be editable in Academy Setup → Parent communication.
- Renderers may calculate structured values only: names, child-specific period heading, grouped service dates/times, session count, amount, bank details and payment reference.
- The template contract, template editor placeholder help, preview renderer and send renderer must be changed together.
- `{{service_dates}}` contains the session heading plus each date and start time.
- `{{payment_details}}` contains business/account/IBAN details only.
- `{{payment_reference}}` is separate and currently resolves to child/learner name plus the covered month/year.
- Preview and send must use the same renderer so the reviewed content is the content sent.
- Existing legacy initial-template placeholders (`{{recurring_place}}`, `{{price_plan_name}}`, `{{session_price}}`) remain supported for backwards compatibility, but new default wording should use the compact period contract.


### Planned capacity and one-off email invariants

- A planned lead place is operationally capacity-holding before payment. For exact dates present in the saved planned-period session list, Operations should show the child in the saved seat as **Planned · awaiting payment**.
- Do not treat planned lead occupancy as paid attendance. No attendance action is available until activation creates the learner/delivery seat.
- Planned Operations occupancy must use the exact saved `planned_sessions` dates so pre-agreed first-period exceptions appear correctly and are not converted into recurring dates.
- Editing a generated initial parent email in Family Pipeline is a one-off communication override. Send and delivery-log content must use the submitted edited subject/body, while the Academy Setup template remains unchanged.
- Parent email bank labels must distinguish bank name from account name. Current mapping: bank name from `TAA_BANK_ACCOUNT_NAME`, account name from `TAA_BUSINESS_NAME`, IBAN from `TAA_BANK_IBAN`.


### Persistent planned-place draft invariant

- One-off planned-place email edits belong to the child lead and persist across navigation; they are not reusable template edits.
- Persist the draft with the booking version it was generated/saved against.
- If a booking change affects the planned email, regenerate the persisted draft from current authoritative booking data and surface an explicit admin notice rather than silently retaining stale wording.
- The exact subject/body submitted from Family Pipeline remains the content sent and logged.


### Booking corrections must not rewind lifecycle

- Editing planned dates, recurring places, seats or pricing is an operational correction and must not automatically move a child backwards through the lead lifecycle.
- If the child is already Contacted — awaiting payment, preserve that stage after plan edits.
- Parent email is optional before recording payment; valid planned booking data is the payment prerequisite.
- Historical sent communications must remain unchanged even when current booking data is corrected.


## Production role, pipeline and finance invariants — 6 October 2026

- **Admin landing:** `/admin` redirects Admin users to `/admin/finance`.
- **Teacher landing:** `/admin` redirects Teacher users to `/admin/operations`.
- **Finance & metrics is Admin-only.** Teachers do not receive the navigation item and the route requires `view_commercial_kpis` server-side.
- **Operations Hub is the daily teaching surface.** Commercial KPI cards are not loaded or rendered there.
- **Leads are counted and displayed at family level.** One parent with multiple children is one Lead family row, with children nested beneath it.
- **Customers are counted at family level and include families in renewal.** Renewal is a subset/status of Customers, not a mutually exclusive replacement category.
- **Renewal state is visible from Customers.** A learner currently requiring renewal action is flagged in the paid-through badge while remaining in the Customer family row.
- **Pre-conversion lead details are editable without changing lifecycle.** Parent contact fields and eligible child/timetable details may be corrected before conversion; payments, bookings, sent communications and lifecycle state remain untouched.
- **Authenticated parent portal access remains separate from the lead/family record.** A `parent_leads` record may exist without a parent login.
- **No Child login/role exists.**


### Family document tracking invariant

- Parent registration/authorisation signatures remain legally executed by the external signing provider; TAA does not recreate the signature ceremony.
- TAA may send the current external web-form link through the existing Resend transactional-email flow and record delivery status.
- Until a signing-provider API is justified, signed status is an explicit Admin verification recorded in TAA; do not infer a signature from email delivery or link access.
- Existing externally signed forms may be recorded without requiring a new TAA send.
- Reusable parent-facing registration email wording belongs in Academy Setup email templates.
- A future Adobe/PandaDoc/other signing API must update the same family-document state rather than create a parallel document system.


### Learner teaching workspace invariant

- The learner record is the long-term source of truth for teaching context. A learner may have several Teaching Framework assignments over time or concurrently; one active assignment may be the default.
- A per-session framework selection or override changes that session only. It must never silently rewrite the learner's longer-term teaching context.
- Teaching Frameworks are reusable Academy guidance for how TAA teaches and reviews a type of provision. Learner-specific course, exam board, topic and objectives belong on the learner assignment rather than duplicating the global framework.
- Framework versions are historical evidence. Publishing new guidance must not rewrite the framework/version or prompt snapshot stored on an earlier teaching note.
- The normal teaching-note workflow should remain proportionate and fast: target roughly 30–60 seconds for routine Homework Support. TAA complements school provision and does not require teachers to recreate school reports.
- Routine teaching evidence should be concise and factual: what was worked on, where support was needed when useful, where the learner got to, and what should be picked up next.
- Attendance and Teaching History are teaching surfaces. Family/place/commercial data and family communications remain separate Admin-only learner tabs.
- Personal profile editing and learner lifecycle/status editing are configuration actions, not permanent cards on the day-to-day teaching workspace.
- Teaching Hub is readable by Admin and Teacher; global framework creation/versioning/publishing/archiving is Admin-only.
- No identifiable learner data may be sent to an AI provider through this workflow unless the existing TAA AI/privacy approval conditions are separately satisfied.
