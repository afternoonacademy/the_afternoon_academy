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

## Parent email delivery telemetry

TAA may retain operational delivery outcomes for parent communications (sent, delivered, delayed, bounced and failed) so staff can identify messages that did not reach the recipient. TAA does not use email open or click tracking for this workflow. Delivery webhooks must be cryptographically verified and stored through trusted server/service-role paths; webhook signing secrets remain server-only. Retain only the minimum delivery metadata needed for operational support and audit rather than full provider webhook payloads.


## October 2026 operational billing and parent-communication boundary

The current family billing/session-change and parent-email workflows remain admin-only trusted-server operations.

- Family account and future-session mutations require `requireAdmin()`; client controls are not treated as authorization.
- Editable email templates are stored in `academy_email_templates`, which has RLS enabled and no browser policies. Template reads/writes for admin workflows occur through trusted server/service-role paths.
- Parent, booking, renewal, entitlement and communication tables used by these workflows also remain RLS-enabled with no direct browser policies in the current architecture.
- Bank account details are supplied from server-side environment variables. They are never read from browser-controlled fields and must not be placed in public environment variables.
- Planned-place email preview performs no send, pipeline mutation or delivery-log creation. The actual send remains explicit and is retained in the family communication audit trail.
- The shared template renderer performs string substitution only; it does not execute template content.
- Family account adjustments are retained as append-only JSON audit entries on the parent record. Future work must not allow a browser to submit authoritative balances/prices; server actions must reload authoritative family, learner, paid-session and price-plan data before mutation.
- Cross-family balance use is prohibited. A target learner must be revalidated against the same `parent_lead_id` at submit time.
- Historical paid/attended sessions must not be modified by a future-session change.

### Security review snapshot — 5 October 2026

A fresh Supabase advisor review found no advisor classified as an error/critical issue. Current known advisories are:

- RLS enabled with no policies on a number of operational tables. In the current architecture this is intentionally deny-by-default for browser clients; trusted server/service-role code is the access path. Future parent/staff browser access must add narrowly scoped policies rather than disabling RLS.
- Two database functions have mutable `search_path` warnings: `enforce_delivery_seat_capacity` and `prevent_operational_config_archive`. These are baseline hardening items to resolve in a dedicated migration after verifying function signatures/behavior.
- `btree_gist` is installed in the public schema. Moving an extension is a database-maintenance task and should not be bundled into unrelated feature work.
- Supabase leaked-password protection is disabled. Enable it as an authentication-hardening task when account/password configuration is reviewed.
- Performance advisor findings include unindexed foreign keys and unused indexes. These are not release blockers for this email-template slice and should be handled from measured query/load evidence rather than bulk index churn.

Reference remediation guidance:
- RLS enabled/no policy: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Mutable function search path: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- Extension in public: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- Leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection


## Capability-based authorization baseline — 6 October 2026

Authorization is capability-based and enforced server-side. Hidden navigation or omitted controls are not treated as a security boundary.

### Roles

- **Admin:** receives the complete internal capability set.
- **Teacher:** receives only `view_operations`, `operate_sessions`, `view_learners`, and `edit_learning_record`.
- **Parent:** receives no internal admin capabilities in this release.
- **Child:** no role or login exists.

### Commercial-data boundary

- `/admin/finance` requires `view_commercial_kpis`.
- Teacher navigation excludes Finance & metrics.
- Teacher pages should not fetch commercial KPI/payment lifecycle data merely to hide it later in the client.
- Operations Hub is intentionally non-commercial for Teacher access.

### Mutation boundary

Teacher-safe mutations are limited to approved teaching/learner-record actions. Payment, renewal lifecycle, setup, destructive learner lifecycle and other commercial/destructive actions remain Admin-only.

### Lead-edit boundary

Pre-conversion lead correction requires the dedicated lead-edit capability and may update only approved source fields. It must not mutate lifecycle status, payments, planned booking history, or historical sent communications. Converted learner identity is maintained through Learner Records.
