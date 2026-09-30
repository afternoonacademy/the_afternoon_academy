# TAA Feature Specifications

Feature specs turn founder/product intent into a testable engineering contract before implementation.

## Required sections

Each significant feature specification should contain:

1. **Status** — proposed / approved / implemented / superseded.
2. **Problem** — the real operational/user problem being solved.
3. **Goal** — the observable outcome.
4. **Non-goals** — what this slice deliberately does not build.
5. **Users and permissions** — who can see/do what and who cannot.
6. **User flow** — the intended operational sequence.
7. **Data** — records/fields involved, source of truth, history/audit needs.
8. **Privacy/safeguarding** — sensitivity, consent/lawful-basis dependencies, AI restrictions.
9. **Edge/failure cases** — empty states, invalid state, duplicate actions, inactive/left learners, permission denial, network/database failure.
10. **Acceptance criteria** — testable statements of done.
11. **Test plan** — automated and manual checks.
12. **Migration/release notes** — schema/config changes and rollback considerations.
13. **Open decisions** — founder decisions required before build.

## Example acceptance criteria style

- An authorized administrator can view the learner's complete attendance history.
- A teacher without authorization for the learner cannot retrieve that attendance history by changing a URL or record ID.
- Marking a learner `left` removes them from active operational lists but preserves historical attendance and teacher updates.
- Every teacher update displayed in history retains its author and date.

Avoid vague criteria such as “attendance works” or “make it secure.”

## Workflow

A spec is normally drafted during the **Plan** stage in `docs/engineering/agentic-development.md`, approved before significant implementation, and updated if the approved behavior changes. Material product-scope changes should also be recorded in the project change log.