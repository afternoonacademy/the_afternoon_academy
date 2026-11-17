# Invitation-only staff signup

Status: implementation authorised by founder request, preview acceptance and release pending.

## Plan and acceptance

Add an email-only `/staff/sign-up` entry point, Admin invitation management in Academy Setup, and an explicit POST confirmation of Supabase token hashes delivered through the existing Resend sender. Public visitors never choose their role. Admin and Teacher roles come from a protected, expiring invitation; confirmed email ownership is required before permissions are provisioned atomically. Existing parent admission remains invitation-based and password/Google login remains supported.

Changes cover server actions, invitation helpers, auth confirmation/callback/redirect, Setup and sign-in UI, a service-only database migration and documentation. No learner data or new provider is involved. Both role stores remain consistent; legacy tutor roles are preserved. Invitations expire after seven days; accepted staff can request new links while the same staff profile remains active. Pending invitations can be withdrawn; this does not deactivate existing accounts.

Failure handling: unknown/expired/revoked requests receive identical public wording; requests are atomically limited to one per minute and ten per UTC day per approved email. Provider failures never grant access; Admin sees delivery outcome. Existing Parent/different-role profiles cannot be silently elevated. No tokens in application URLs sent to the server or analytics: email links carry a fragment that the confirmation component removes immediately. Links use the configured HTTPS site origin, never request host headers. GET does not verify a token. A same-origin server action confirms it; failed/expired links show a recovery route.

Tests exercise request, delivery, admission, role routing, authorisation, malformed/unknown requests, delivery failure, conflicts, migration privilege contracts and token handling using synthetic fixtures. Local tests/typecheck/lint/build and independent security review precede one coherent preview push. Preview must verify delivery, cross-device confirmation and Admin/Teacher/Parent boundaries with synthetic accounts before production merge/migration.

Release order: test migration and flow against a separate non-production Supabase configuration first. Obtain preview acceptance. Apply the additive migration to the confirmed TAA production project BEFORE merging/activating the new code (new Parent/Staff admission calls the RPC; existing profiles do not). Then release code and verify production smoke checks. Never activate code first. explicitly approve Jessica's requested Admin invitation as a separate audited operational action (no password or manual auth.users insert). No email has been sent by implementation. Canonical NEXT_PUBLIC_SITE_URL must be the accepted deployment origin for email links; RESEND_API_KEY and existing sender must work. Rollback disables the entry point/withdraws pending invitations, retaining staff identities and audit/history; never delete accepted staff or historical authorship as rollback.


## Verification / release handoff — 17 November 2026

- Local Postgres execution uses PGlite with synthetic auth/profile fixtures. Tests execute this exact migration and its functions, including denied anon/authenticated privileges. Provider calls use mocks. These checks do not establish hosted Supabase email delivery/session behavior.
- Independent security review passed. No production migration, Jessica invitation/account or email send has occurred.
- Existing NEXT_PUBLIC_SITE_URL points at production in a normal preview deployment: emails would therefore link back to production. For a genuine isolated acceptance test, bind the preview to a non-production Supabase project and its keys, set NEXT_PUBLIC_SITE_URL to that accepted HTTPS preview origin, and use synthetic staff email accounts with a verified sender. Never test role writes against live learner accounts.
- Apply migration first; the old application ignores the additive invitation table/RPCs and expanded Teacher role constraint. Application rollback can restore the preceding commit while retaining the additive migration and all history. Do not drop the RPCs/table while this application version is running.
- Staff email uses the existing Resend sender and service-generated Supabase token, so no dashboard email-template edit is required. Supabase Auth must permit the intended signup/invite flow; hosted verification remains outstanding.
- Explicit founder request authorises Jessica Admin access; operational provisioning after release must write a normal protected invitation with approval_source=founder and no invented approved_by identity. The email link still requires her mailbox ownership. No password is collected by staff signup.
