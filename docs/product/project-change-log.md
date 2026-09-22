# The Afternoon Academy — Project Change Log

This repository copy records material product/engineering decisions that need to travel with the application. The fuller working project source remains the canonical business/product change log until intentionally consolidated.

## 17 September 2026 — Safe Agentic Development architecture

### Decision

TAA will use a controlled AI-assisted engineering workflow rather than direct prompt-to-production development.

### Standard workflow

Discover → Plan → Approve → Build → Test → Independent Review → Preview → Human Acceptance → Release.

### Agent roles

The engineering process distinguishes Product Architect, Developer Agent, QA Agent, Security Reviewer, and Release Reviewer responsibilities. The same underlying AI system may perform multiple roles at different stages, but the implementing agent is not treated as sufficient independent review.

### Repository knowledge architecture

- `AGENTS.md` holds permanent repository engineering/agent rules.
- `docs/engineering/agentic-development.md` holds the engineering workflow and role architecture.
- `docs/security/security-model.md` holds security, data, Supabase, safeguarding, and AI boundaries.
- `specs/` holds testable feature contracts.
- `.github/pull_request_template.md` makes verification/security evidence part of the PR workflow.

### Environment and production boundary

Development should use synthetic data and a local/preview/production separation. Production learner data is not a convenience test fixture. Destructive production data changes, material RLS/authorization changes, authentication changes, and AI processing of identifiable learner data require explicit human approval and appropriate safeguards.

### Founder workflow

“Start the next slice” means product/architecture discovery and planning first. “Dev it” means implement the approved plan on a branch and perform tests/review. “Release it” means verify checks, preview acceptance, migration/config implications, and rollback readiness before production.

### Rationale

The founder is using AI to build software without relying on manual line-by-line expert code review. TAA also handles child/family information. The system therefore shifts assurance toward explicit specifications, least privilege, database/server authorization, automated tests, independent review, preview deployments, and human product acceptance.

## 17 September 2026 — Operations model direction

The launch timetable will distinguish TAA1 recurring group slots from dated Tutor Room one-to-one bookings. Future development will introduce a formal Buildings → Rooms → Teachers hierarchy when additional staff or sites make that structure operationally necessary.

## 22 September 2026 — Academy-linked delivery recovery

### Decision

The operational model now links recurring timetable slots, accepted bookings, standing places and dated delivery sessions to real Academy table records. Table capacity is enforced in the database, and active Academy configuration cannot be archived while active timetable records depend on it.

### Delivery and enrolment

- Payment activation prepares dated delivery sessions and seats for the covered paid dates.
- A learner may hold more than one recurring booking when the day/time/table slot differs.
- Child age is optional at enquiry/enrolment and can be completed later by the parent or staff.
- Existing family records were backfilled only with founder-supplied operational details.

### Recovery note

These production migrations were applied before the matching source branch was committed. This recovery commit reconciles source control with the live schema; preview verification and review are required before release.
