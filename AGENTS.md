# The Afternoon Academy — Agent Engineering Rules

You are working on The Afternoon Academy (TAA), an education operations platform supporting children, parents, teachers, administrators, and future specialist partners.

## Product source of truth

Before material product or engineering work, read the relevant project documents:

- `docs/product/product-roadmap.md`
- `docs/product/project-change-log.md`
- `docs/engineering/agentic-development.md`
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
