# TAA Safe Agentic Development

_Status: working engineering standard — established 17 September 2026._

## Purpose

The Afternoon Academy uses AI to increase engineering capability without allowing speed to replace engineering discipline. The objective is not autonomous code generation; it is a controlled system in which AI performs bounded roles and important claims are verified by tests, independent review, preview environments, and human acceptance.

## Operating model

Founder/Product → Product Architect → Developer Agent → QA Agent → Security Reviewer → Preview → Founder acceptance → Release.

The roles may be performed by the same underlying AI system at different stages, but their responsibilities must remain distinct. The implementing agent is never treated as sufficient independent review.

## Workflow

### 1. Discover
Read `AGENTS.md`, the roadmap/change log, the relevant feature specification, and the existing implementation. Inspect the current data model and permissions when the feature touches data. No implementation changes during discovery.

### 2. Plan
Write a short implementation plan with goal/non-goals, affected files, schema/migrations, roles/permissions, privacy/safeguarding impact, failure modes, acceptance criteria, tests, and rollback approach.

### 3. Approve
Founder approval is required before significant product-scope changes and before security-sensitive, destructive, production-data, authentication, authorization, RLS, or AI-on-learner-data changes.

### 4. Build
Use a focused feature branch. Prefer the smallest architecture that cleanly meets the approved specification. Do not add dependencies or infrastructure without a reason.

### 5. Test
Run type checking, linting, production build, relevant automated tests, permission/authorization tests, and manual user-flow checks. Add regression tests for important bugs and business rules.

### 6. Independent review
Review correctness, data integrity, authorization, RLS, secrets, dependency risk, privacy, safeguarding, maintainability, and divergence from the specification. A reviewer may request changes; the developer fixes them and tests again.

### 7. Preview
Use Vercel preview/non-production infrastructure and synthetic data. Verify desktop/mobile behavior as relevant. Production is not a test environment.

### 8. Human acceptance
The founder/product owner confirms that the workflow makes sense operationally, not merely technically.

### 9. Release
Merge only after required checks pass. Apply migrations deliberately, verify production health, and retain a recovery/rollback route for risky releases.

## Agent roles

### Product Architect
Translates business intent into a bounded specification. Checks the product roadmap and change log and identifies conflicts or premature scope.

### Developer Agent
Implements the approved plan, keeps changes focused, documents assumptions, and supplies evidence of tests run.

### QA Agent
Attempts to break the implementation. Covers happy path, invalid input, empty states, permissions, historical records, mobile behavior, and regressions.

### Security Reviewer
Reviews authentication versus authorization, Supabase RLS, server/client boundaries, secrets, data minimization, sensitive logging, dependencies, and any external data transfer.

### Release Reviewer
Confirms migration order, environment variables/configuration, CI results, preview behavior, operational impact, and rollback readiness.

## Environment model

TAA should operate with three conceptual levels:

1. **Local** — developer/agent work with synthetic data.
2. **Preview/development** — integrated testing and Vercel previews using non-production data and credentials.
3. **Production** — live Academy environment containing real operational data.

Production child data must not be copied into local or general-purpose AI contexts for convenience.

## Repository knowledge model

- `AGENTS.md` = permanent instructions for how engineering agents behave in this repository.
- `docs/product/` = durable product/business decisions and roadmap.
- `docs/engineering/` = development/release architecture and standards. `docs/engineering/current-baseline.md` is the concise handoff for the system as it exists now.
- `docs/security/` = security, privacy, authorization, data, and AI boundaries.
- `specs/` = precise feature contracts and acceptance criteria.
- Git history/PRs = technical implementation history.

Chats are not the sole source of project truth. Material decisions should be committed to the repository documentation/change log.

## Standard founder commands

When the founder says **“start the next slice”**, begin with product/architecture discovery and planning rather than immediate coding.

When the founder says **“dev it”**, implement the approved plan on a branch, then run the test/review sequence.

When the founder says **“release it”**, first verify checks, preview acceptance, migration/environment implications, and rollback readiness before merging/deploying.

## Scaling principle

As TAA grows, increase automation around repeatable verification rather than increasing autonomous production privileges. The preferred direction is stronger CI, better tests, better observability, clearer specifications, and least-privilege agent access.

## Vercel deployment budget — mandatory on every TAA task (19 October 2026)

Vercel builds are a scarce shared resource. Every development session MUST read and follow this section before any GitHub write. Default is **zero remote commits during discovery and editing**; batch all related files and tests into **one atomic commit/push per coherent slice**, then wait for the resulting preview. Never commit each file separately. Avoid rapid successive pushes, empty commits, repeated preview redeploys, or deployment-triggering documentation-only edits when these can be bundled with the next code slice. Run local typecheck/lint/tests/build before remote push when execution is available. Check existing deployment state before triggering a new one; reuse the latest valid preview and do not rebuild unchanged commits. If a build fails, collect all errors, fix them together locally, and push one consolidated correction. Prefer draft PRs and require founder acceptance before production merge. Do not disable production protections or deployment checks merely to save builds. If tools cannot batch writes or run tests, disclose that limitation and minimize commits; do not claim successful checks. Record any unavoidable extra deployment and reason in the change log.
