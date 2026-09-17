# TAA Security, Privacy and Data Boundary Model

_Status: baseline engineering policy — established 17 September 2026. This is an engineering control document, not legal advice._

## Security objective

TAA handles information relating to children and families. Security must therefore be designed into identity, authorization, database access, logging, integrations, development practices, and AI use rather than added only at the UI layer.

## Core access chain

Identity → role/relationship → permission → server/database enforcement → auditability.

Authentication answers who a user is. Authorization answers what that user may do. The UI is not an authorization boundary.

## Least privilege

Every user, service, integration, and agent receives only the access necessary for its job. Broad administrative/service credentials are reserved for narrowly controlled server-side operations and must never be exposed client-side.

## Learner data

For each learner-data table or endpoint, engineering must explicitly determine:

- which roles/relationships may read it;
- which may create or update it;
- which may not access it;
- whether fields have different sensitivity levels;
- what happens when a learner leaves;
- how historical authorship/timestamps are preserved;
- whether access can be enforced through Supabase RLS and/or trusted server logic.

A learner becoming `left`, inactive, or otherwise no longer enrolled must not silently erase legitimate historical attendance, goals, or teacher updates.

## Safeguarding boundary

Safeguarding-sensitive records are not ordinary teacher notes. They require a deliberately narrower access path, minimal exposure, appropriate auditability, and no casual inclusion in AI prompts, analytics, client payloads, logs, or general-purpose exports.

## Supabase

- Enable and test RLS on learner/family/staff-sensitive tables where appropriate.
- Treat service-role credentials as highly privileged server secrets.
- Never place service-role keys in browser bundles or public environment variables.
- Test both allowed and denied access paths.
- Prefer database constraints for data invariants that should never be violated.
- Review migrations for destructive effects before production application.

## Secrets

Secrets belong in approved environment/secret management, not source code, screenshots, tickets, specs, or AI prompts. If a secret is accidentally committed or exposed, rotation is required; deleting the visible text alone is insufficient.

## Environment/data separation

Local and preview development should use synthetic learners/families and non-production credentials. Real child data should not be copied into local fixtures or external AI tools to debug a feature.

## AI boundary

Current TAA position: AI assistance on identifiable learner data remains off until the necessary provider due diligence, data-protection assessment/basis, safeguarding controls, approved architecture, staff rules, and parent communication/consent where applicable are complete.

Without explicit approval, do not send to an AI provider:

- learner names or contact details;
- parent contact details;
- school or teacher contact details tied to a learner;
- attendance records;
- learner profiles/goals tied to identity;
- identifiable work samples;
- safeguarding information;
- sensitive teacher observations.

AI must not diagnose, label, rank children, predict outcomes, make safeguarding decisions, or make other high-stakes educational decisions. Future administrative AI outputs require human review.

## Logging and observability

Logs should help diagnose systems without becoming a shadow learner database. Do not log secrets, authentication tokens, full sensitive payloads, or safeguarding content. Production error monitoring should use the minimum information necessary to identify and fix failures.

## Destructive change controls

A production change that deletes/re-writes records, materially changes RLS/authorization, changes authentication, or performs a risky migration requires:

1. explicit human approval;
2. understood blast radius;
3. backup/recovery or rollback approach;
4. preview/test evidence where possible;
5. post-release verification.

## Security review checklist

Before a learner-data feature is considered done, ask:

- Can an unauthenticated user reach it?
- Can the wrong authenticated role reach it?
- Can changing an ID/URL expose another learner?
- Does the database independently enforce important access rules?
- Are more fields returned to the browser than needed?
- Are secrets or sensitive data logged?
- Are historical records preserved correctly?
- Could an external integration receive data it should not?
- Does any AI/data transfer cross the current TAA AI boundary?
- Is there a safe failure mode?

## Review cadence

Revisit this model whenever TAA adds a parent portal, new staff roles, specialist partners, school sharing, payments, AI processing, multi-site operation, or another material data flow.