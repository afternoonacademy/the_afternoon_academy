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
- **Capacity and utilisation:** reliable reporting of available seats, filled seats, attendance, no-shows and utilisation by room, table, session and teacher—after the weekly delivery workflow is proven.

This is deliberately deferred from the launch correction: TAA currently has one location, TAA1 and one Tutor Room, with a small team. The present slice uses simple named teacher assignment and fixed room choices while preserving a clean migration path to the fuller model.

### Operations foundation progress — September 2026

The first Academy configuration layer is now in place: building, room and table records; multi-slot weekly timetable support; and paid recurring-seat generation. The current delivery surface is a mobile-first Today board: teachers see dated sessions in time order, named booked seats, teacher, session type and start/end time; staff record attendance in place; and admins can make a last-minute paid booking. Payment activation remains the source of truth for dated seats.

### Deferred analytics

The launch-demand "timetable fit" dashboard and the separate Trends screen are not active launch operations. Revisit reporting when there is sufficient reliable delivery data:

- lead and conversion trends;
- paid-seat capacity, utilisation, attendance and no-show reporting;
- permissioned learner learning-evidence trends.

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

## Experience design standard

- TAA interfaces use the brand palette: coral `#ff5757`, blue `#5170ff`, yellow `#ffde59` and green `#9ddd8d` with a calm light base.
- Mobile-first admin flows use clear field labels, generous tap targets, light purposeful cards and visible loading/confirmation states.
- The intended character is young, modern and fun without compromising readability, safeguarding or operational clarity.

## Current build principle

Do not build a full parent portal at launch. First build/configure the invisible operating foundation: learner profile, group matching, staff notes, consent, attendance and follow-up. The portal should later be a genuine window into a quality service, not a polished but empty interface.

## Engineering architecture decision — 17 September 2026

TAA adopts **Safe Agentic Development** as the delivery architecture for this roadmap. Significant slices move through Discover → Plan → Approve → Build → Test → Independent Review → Preview → Human Acceptance → Release. See `docs/engineering/agentic-development.md` and `docs/security/security-model.md`.


## Phase 1 addition — Parent place offer and secure onboarding

This is an operating workflow, not a full parent portal. When staff select a place, the system records the exact held seat, service period, price, payment reference and expiry. TAA sends a branded transactional email with bank-transfer instructions. Staff reconcile payment manually; only then is the place activated and the parent sent a one-time magic login link.

- A place offer expires after 48 hours by default; staff can review it before sending.
- A secure, unguessable offer link may show only that family’s offer and does not create an account.
- Payment confirmation is a staff decision. No email, portal action or AI system may infer that a bank transfer has been received.
- Parent portal access is invitation-gated, tied to the approved family email and limited to that family’s learner records.
- Email is notification and payment instruction only. Detailed learning/safeguarding content remains in the authenticated portal and is human-approved.

This moves the parent experience one step closer to Phase 2 while preserving the operations-first principle.
