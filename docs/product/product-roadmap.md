# The Afternoon Academy — Product Roadmap

_Repository source established 17 September 2026 from the TAA working product roadmap._

## Product thesis

AI will make generic explanations, worksheets and basic online tutoring abundant and inexpensive. TAA will win by being the trusted human layer around a child's learning: a place where every child is known, belongs, develops confidence and has genuine progress made visible.

**Our promise:** We can show a parent what their child can genuinely do, what is holding them back, and the human plan helping them move forward.

We do not compete with AI by adding a chatbot. We use technology to make excellent human education more consistent, visible and scalable.

## Product principles

1. Human judgement is the source of truth. AI may reduce staff admin; it does not diagnose, label or make high-stakes decisions about children.
2. Evidence over prediction. Progress is grounded in dated teacher observation, work samples and child reflection—not opaque scores.
3. The group is a product. Children are matched for age, learning need, personality and timetable, not placed simply to fill seats.
4. Parent trust is earned weekly. Communication is concise, meaningful and emotionally reassuring.
5. Privacy and safeguarding are foundational. Every meaningful record has a named author, date, access level and consent basis.
6. Build operations before surface area. Do not build a parent app until the underlying delivery and data are reliable.

## Phase 1 — Prove the service (launch to 12 months)

Objective: deliver exceptionally well, understand every child, and create a repeatable operating model.

- Learner profile: strengths, barriers, interests, successful strategies and parent priorities.
- Group matching workflow: learning need, age, personality and timetable.
- Operations hub: enrolment, attendance, class capacity, staff cover, payments and follow-up tasks.
- Teacher update standard: what happened, why it mattered, and the next small step.
- Consent, safeguarding and incident workflow.

Not now: a public live calendar for group places; a full parent app; AI-generated child assessments; a broad specialist marketplace.

## Phase 2 — Make progress visible (Year 1 to 2)

- Small set of observable child goals.
- Evidence timeline: teacher notes, selected work samples, milestones and child reflections.
- Parent portal: next sessions, updates, progress evidence, home-practice prompts and request-support route.
- Child reflection.
- Human support pathway when a pattern needs more than tuition.

## Planned operations foundation — build when staffing or sites require it

- **Buildings and rooms:** a reusable hierarchy for Academy locations, rooms, capacity, room purpose and availability.
- **Teacher profiles:** staff identity, role, availability, safeguarding/qualification evidence and cover context; access remains least-privilege.
- **Timetable assignment:** sessions and one-to-one bookings will reference those approved buildings, rooms and staff records rather than free-text names.

This is deliberately deferred from the launch correction: TAA currently has one location, TAA1 and one Tutor Room, with a small team. The present slice uses simple named teacher assignment and fixed room choices while preserving a clean migration path to the fuller model.

## Phase 3 — Scale the trusted network (Year 2 to 3)

- Staff quality system.
- Availability-led one-to-one provision linked to the same learner record.
- AI learning literacy: questioning outputs, source checking, transparent use and explaining reasoning.
- Permissioned school-partnership summaries where useful.

## Phase 4 — Expand with authority (Year 3 to 5)

- Curated specialist network: initially referrals, later a vetted marketplace if quality can be protected.
- Parent-controlled portable learning record across schools, tutors and countries.
- Multi-site operating model: staff training, safeguarding, governance, consistent service standards and local adaptation.

## Durable features

- Human learning profiles and baseline understanding.
- Observable goals and credible evidence of progress.
- Confidence, participation and belonging observations.
- Teacher-parent communication and accountability.
- Child metacognition and independent learning habits.
- AI literacy and authenticity of work.
- Earlier, appropriate human intervention and trusted specialist navigation.
- Continuity of a child's learning story across change.

## Current operating cadence

- Weekly TAA founder product review: convert live signals from the previous week into one highest-leverage product, operations or growth decision.
- Quarterly AI-resilience review: assess changes in AI, education, child safety, parent expectations and TAA results; recommend any roadmap adjustment.

## Current build principle

Do not build a full parent portal at launch. First build/configure the invisible operating foundation: learner profile, group matching, staff notes, consent, attendance and follow-up. The portal should later be a genuine window into a quality service, not a polished but empty interface.

## Engineering architecture decision — 17 September 2026

TAA adopts **Safe Agentic Development** as the delivery architecture for this roadmap. Significant slices move through Discover → Plan → Approve → Build → Test → Independent Review → Preview → Human Acceptance → Release. See `docs/engineering/agentic-development.md` and `docs/security/security-model.md`.
