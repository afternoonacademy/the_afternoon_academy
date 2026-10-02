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


## Phase 1 enrolment decision — founder-led, manually communicated

TAA will communicate with prospective families personally in the launch phase. The website is the protected operational record: after staff have agreed the place and reconciled the bank transfer, they record one paid recurring seat, the payment date, and the seat start/end dates. This activates the learner and creates the dated delivery sessions.

- No automated offer or payment email is required to enrol a family.
- Payment confirmation remains an explicit staff decision; no portal action or AI system may infer that a bank transfer has been received.
- Automated offer links, transactional messages and magic-link onboarding remain optional infrastructure for a later scale trigger, not the frontline workflow.
- Parent access remains invitation-gated and must be granted deliberately when the evidence-led parent experience is ready.

This keeps launch operations personal, auditable and proportionate while TAA learns what families actually need.

## Controlled Restart baseline — complete 30 September 2026

The administration foundation is complete and becomes the clean production baseline: dated delivery and attendance; manual lead → payment → learner → dated-seat activation; learner history and internal teacher evidence; renewals; and human-reviewed monthly family-update drafting. These workflows support the Homework Club proposition and do not create a new public product category.

### Next discrete build — Focus Groups

Focus Groups will be an additional, deliberately composed Academy group type—not a repositioning of Homework Club. The first candidate product is an IGCSE Chemistry Focus Group for Years 10–11. Architecture discovery must first establish the smallest safe extension to the existing enquiry and lead pipeline, with no duplicate family, learner, payment or placement systems.

### Focus Groups launch workflow — September 2026

The first public Focus Group is IGCSE Chemistry for Years 10–11. Interest registrations enter the existing lead pipeline, where staff deliberately compose the group and continue through the existing manual payment and placement workflow where appropriate. The registration acknowledgement and internal notification are transactional only: they do not confirm a place, reserve a seat or request payment.

### Academy closure and renewal control — October 2026

The Academy calendar records planned closures once and excludes them from future renewal service-date calculations. Renewals are a persistent operational queue, not a date-window report: an expired paid period becomes overdue until renewed or closed. Where a family is late but staff elect to continue teaching, the system records a date-bounded **Payment pending** operational seat rather than falsely marking it paid. Parent renewal emails remain human-edited and explicitly sent, with the final message retained in the delivery record.

### Renewal session selection and pricing — October 2026

Renewal amounts are calculated from the active Academy timetable's per-session rates, rather than typed freehand. Staff select a coverage period, receive the eligible dated sessions after Academy closures are excluded, and can remove individual sessions before the editable renewal email is prepared. The resulting selection is retained with the renewal case and is used when cleared funds activate dated seats. A make-up/replacement-session composer remains a later, separate operations slice; it must validate table capacity and avoid silently changing a learner's standing place.

Commercial rates are maintained as named reusable session price plans (for example, General Homework Support and IGCSE Chemistry Focus Group), then selected for the learner's recurring paid place. Tables, days and times are delivery information only. The final renewal selection retains the copied price used in its communication and payment record.

At renewal, staff may select the price plan for the next paid period. The learner's current plan is the default; a different plan changes the quote but is only applied to the learner's recurring place after cleared payment is recorded. Selecting a specialist plan does not itself create a suitable group or move a seat: staff remain responsible for that deliberate placement decision.

### Deferred enabling work — AI family-update delivery

Enable and approve Vercel AI Gateway before treating family-update drafting as an end-to-end feature. A subsequent controlled slice may add reviewed Resend delivery and branded formatting, with explicit confirmation for each send, durable audit records, safeguarding/data-protection review and full end-to-end testing. AI remains administrative support; it does not independently decide or send parent communications.

### Unified exact-date paid periods — October 2026

Family Pipeline payment activation and Renewals use the same exact-date paid-period builder. Staff choose the learner's recurring place and then the precise paid service dates; expected recurring dates preload, Academy closures are visibly blocked, and open-date replacements are explicit. The selected-session structure is the source for the quote, editable renewal email, payment entitlement metadata and dated Operations seats. Period start/end remain derived compatibility fields. Price plans stay attached to the learner's recurring place and never move a learner between groups automatically.


### Dated capacity, not recurring seat ownership — October 2026

Treat numbered seats as an Operations/capacity mechanism only. Families keep a recurring table/time arrangement, not a permanent seat number. Unpaid renewals do not reserve capacity. Exact paid dates allocate the first available dated seat when cleared payment is confirmed; explicit payment-pending continuation remains the only date-bounded unpaid exception.


### Repeatable family enquiry form — October 2026

The public place-enquiry form now treats each child as an independent learning requirement inside one family submission. Parent/contact details are entered once; staff receive one child record and one timetable-preference record per child, including independent support type, school/curriculum context and availability. This supports siblings needing different services such as general homework support, IGCSE Chemistry or 1-to-1 tuition.


### Child-first follow-up and payment activation — October 2026

The Family Pipeline now reviews and activates each child independently. The follow-up table is shown before payment actions, displays requested sessions per week, and exposes **Add payment & dates** on each child row. A payment for one sibling does not reserve, enrol or convert the others; the family reaches converted only after every child in that enquiry has its own paid activation.


### Planned place → contact → paid child lifecycle — October 2026

Family Pipeline initial activation is now explicitly staged per child: **Lead received → Session planned → Contacted / awaiting payment → Paid**. Planning records the recurring table/time, price plan, visible capacity seat and proposed exact dates without creating payment or dated Operations attendance. The planned recurring seat is an explicit temporary capacity hold and shows the child’s name in the seat map. Sending the parent’s planned-place email advances only that child to contacted. Cleared payment is confirmed later in a separate exact-date step, at which point paid entitlements and dated Operations places are created. Siblings may remain at different stages.


- Planned-place parent communication is now admin-editable in Academy Setup → Email templates, using placeholders for the parent/child, recurring place, price plan, per-session price, planned dates, session count, total and payment details/reference.


### Unified renewal lifecycle in Family Pipeline — October 2026

Renewals now use the same staged admin pattern as a new child booking and are surfaced as **3 · Needs renewal** inside Family Pipeline. Each learner renews independently: **Needs renewal → Renewal planned → Contacted — awaiting payment → Paid**. The learner's existing recurring capacity is preserved after the last paid service date and is not made available to new families merely because the paid period expired. Capacity is released only by an explicit admin **Release recurring place** action with a recorded reason. The renewal plan reuses the learner's active standing place and price plan by default, generates the existing Academy Setup renewal email from the exact selected dates, and uses a compact cleared-payment confirmation before creating the next paid dated Operations seats. The former Renewals route now opens the Family Pipeline renewal section rather than maintaining a second operational workflow.


### Family Pipeline lifecycle queues — October 2026

Family Pipeline is the single operational family/customer lifecycle surface. It is split into four mutually exclusive queues: **1 · Leads**, **2 · Customers**, **3 · Renewals**, and **4 · Closed / archived**. A child/learner appears in only one operational queue at a time. Paid active learners are removed from Leads; learners in the renewal window are removed from both Leads and Customers; completed renewal returns the learner to Customers; cancellation/non-payment release moves the historical record to Closed / archived. Renewals are no longer a sidebar destination.
