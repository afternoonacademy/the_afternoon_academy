# Learning Evidence Product Decision Meeting

**Date:** 22 September 2026  
**Status:** Working product decision record  
**Participants represented:** Parent, Teacher, Business Owner, CTO/Product Architect  
**Scope:** The next TAA app slice for parent reassurance, teacher workflow, operational quality, privacy and future AI readiness.

## Decision context

TAA is building an education operations platform for children, parents, teachers, employees and owners. The current build already provides Academy configuration, recurring timetable support, paid dated seats, a mobile-first delivery board, named booked seats and attendance.

The question for this meeting was not “how do we make a parent portal?” It was:

> How can TAA reduce homework conflict at home while helping parents feel reassured that their child is known, supported and becoming more independent?

## Perspectives heard

### Parent

- I need to feel reassured, not overloaded with activity or scores.
- I want to know what happened, why it mattered, and whether I need to do anything tonight.
- I do not want an app that makes me responsible for teaching, produces alarming labels, or turns every session into a report card.
- I need confidence that sensitive information about my child is private and that a real person will contact me if a concern matters.

### Teacher

- I can reliably record a useful outcome in one to two minutes per child, but not write individual essays after every session.
- The recording flow must begin from the dated session and named seat I am already using; a separate system will not survive real delivery.
- Structured prompts make updates more consistent, but I need room for professional judgement and a short factual note.
- Safeguarding and sensitive observations need a route that is clearly separate from parent communication.

### Business Owner

- Parent reassurance and reduced conflict are core retention and referral value, not a cosmetic feature.
- The service must remain recognisably human, premium and calm rather than becoming a generic AI-tutoring product.
- The owner needs early visibility of missed attendance, missing updates, recurring concerns and service-quality gaps.
- The first release must prove its value with real families before broadening scope.

### CTO/Product Architect

- The right first unit is an auditable learning-evidence record, not a dashboard score or an AI prediction.
- Role-based access must be enforced by server-side/database authorization and RLS; hidden interface controls are not a security boundary.
- Every record needs author, timestamp, visibility and edit history. Safeguarding information needs stricter access than routine learning updates.
- Identifiable learner data must not be sent to an AI provider without explicit approvals, governance, privacy basis and safeguarding controls.

## Decisions

### 1. North-star parent outcome

**Decision:** The first parent-facing outcome is **reassurance**. TAA will reduce conflict at home by making a child’s supported learning, growing independence and next step visible.

**Design consequence:** Parent communication should be calm, concise and selective. The product will avoid ranking, predictive grades, traffic-light labels, attendance shaming and automatic concern notifications.

### 2. First product slice

**Decision:** Build one end-to-end learning-evidence loop, not a full parent portal.

1. Teacher records attendance and a short structured outcome from the dated delivery session.
2. A normal update becomes parent-visible only when marked as approved/publishable.
3. Parent sees a calm, read-only “Today at TAA” update and the evidence of the child’s current goals over time.
4. Owner sees delivery-quality and follow-up signals.
5. Sensitive or safeguarding observations remain in a restricted route and never become parent-visible automatically.

### 3. Teacher workflow constraint

**Decision:** Routine evidence capture must take **one to two minutes per child**.

**Initial fields:**

- attendance;
- active goal;
- what the learner could do today;
- what helped;
- next small step;
- optional selected work evidence;
- optional short factual note;
- separate internal concern flag.

The app will make the current session, learner and active goal available in context. It will not ask teachers to repeat information already known to the timetable.

### 4. Parent experience

**Decision:** The first parent view will answer four questions only:

1. Did my child attend?
2. What did they work on or achieve?
3. Why does that matter for their learning or independence?
4. Is there one helpful next step, or do I simply let TAA carry on?

It will also show the next session and a request-support route to a named person. It will not expose staff-only notes, safeguarding flags, information about other learners or unapproved work evidence.

### 5. Evidence over score

**Decision:** Progress will be represented by dated, human-authored evidence connected to a small number of observable goals.

**Not in scope:** opaque performance scores, AI-generated assessment, predictions, diagnoses, labels, or automated intervention decisions.

### 6. AI boundary

**Decision:** AI is not part of the learner-facing release. It may later assist with de-identified administrative drafting only, under human review and after formal approval.

**Prohibited without explicit future approval:** sending identifiable learner, parent, school-contact, attendance, learning-profile, safeguarding or work-sample data to an AI provider; using AI to diagnose, rank, predict outcomes or send sensitive communication.

### 7. Security and safeguarding baseline

**Decision:** Build the data and access model before opening parent access.

Required controls:

- database-enforced role and relationship checks;
- parent access limited to their own child or children;
- distinct visibility states: internal, parent-approved and safeguarding-restricted;
- author, timestamp and edit/audit metadata on meaningful learner records;
- consent and communication-preference recording;
- protected evidence-file access using short-lived signed URLs;
- owner/staff access following least privilege;
- test cases proving cross-family access is denied.

### 8. Pilot and success measures

**Decision:** Pilot with a small set of real families after internal QA and human acceptance.

Success criteria:

- teachers can complete routine capture within two minutes;
- parents report reassurance and reduced need to chase for updates;
- no sensitive data appears in parent-visible records;
- owners can identify missing updates, attendance gaps and follow-ups without manual spreadsheet work;
- evidence is specific enough to support a later goal review.

## One-week implementation sequence

| Day | Deliverable |
| --- | --- |
| 1 | Confirm existing schema, session/seat context, roles, RLS and a testable feature specification. |
| 2 | Add the teacher’s in-session evidence-capture flow. |
| 3 | Add approval/visibility workflow and the smallest parent read-only view. |
| 4 | Add owner quality/follow-up view, audit metadata and protected evidence access. |
| 5 | Run authorization, mobile, failure-state and synthetic-data QA; complete staff walkthrough and small pilot plan. |

## Open decisions requiring founder approval

1. Which staff role may approve parent-visible updates: the authoring teacher, manager, or both?
2. Will the pilot use in-app updates only, or a notification that an update is ready?
3. Which evidence types are permitted in the pilot: text only, photos of work, or uploaded documents?
4. What parent/guardian invitation and account-verification process will be used?
5. Before parent launch, what Spanish/EU data-protection advice and policy wording is required for TAA’s specific legal structure?

## Non-goals

- A public timetable or live public capacity view.
- A child-facing chatbot.
- AI assessment, automated concerns, diagnosis, ranking or prediction.
- Replacing professional safeguarding procedures.
- Expanding the portal before the delivery and evidence workflow is reliable.

## Next action

Prepare the approved feature specification and inspect the existing repository schema, RLS, session board and learner record implementation before any application changes are made.
