## What changed

Describe the user/business outcome and the implementation at a high level.

## Specification / roadmap alignment

- Relevant spec:
- Relevant roadmap/change-log decision:
- Any approved deviation:

## Data and security

- [ ] No learner/family data involved
- [ ] Authorization impact reviewed
- [ ] Supabase RLS impact reviewed/tested where relevant
- [ ] No secrets exposed or committed
- [ ] Client payloads contain only necessary fields
- [ ] Logging does not expose sensitive data
- [ ] AI/data-provider boundary unchanged, or explicitly approved/documented

Explain material data/security changes:

## Database / migrations

List migrations, constraints, backfills, destructive effects, deployment order, and rollback/recovery plan. Write `None` if not applicable.

## Verification

- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Production build passes
- [ ] Relevant automated tests pass
- [ ] Allowed and denied permission paths tested
- [ ] Relevant manual user flows tested
- [ ] Preview deployment checked
- [ ] Mobile/responsive behavior checked where relevant

Evidence / commands / notes:

## Edge cases and failure modes

What happens for invalid input, missing records, duplicate actions, unauthorized access, network/database errors, inactive/left learners, or other relevant edge cases?

## Reviewer focus

Call out anything the independent QA/security/release reviewer should inspect closely.

## Release readiness

- [ ] Founder/product acceptance obtained where required
- [ ] Environment/config changes understood
- [ ] Rollback/recovery route understood for risky changes
- [ ] Documentation/change log updated when behavior or scope changed
