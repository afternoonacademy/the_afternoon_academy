# Security Review — 5 October 2026

_Scope: current TAA operational baseline after flexible prepaid session changes, family-account handling, Academy-closure hardening, and parent-email template alignment._

## Scope reviewed

- Family Pipeline and parent/family account workflows.
- Future paid-session changes and family credit/debt handling.
- Initial planned-place and renewal email preview/send flows.
- Academy Setup email-template storage/editing.
- Academy closure entry.
- Supabase RLS/advisor state for operational tables touched by these workflows.
- Server/client boundaries for payment details and privileged database access.

## Findings

### Authorization

Admin mutations reviewed in this slice are protected by server-side `requireAdmin()` before privileged database writes.

The browser UI is not treated as the authorization boundary.

### Database access

The relevant operational tables have RLS enabled, including:

- `academy_email_templates`
- `parent_leads`
- `accepted_bookings`
- `renewal_cases`
- `email_delivery_log`
- `child_payment_entitlements`
- `payment_entitlements`
- `standing_placements`

Current operational architecture intentionally exposes no browser RLS policies on these tables. Trusted server/service-role code is the access path. This is deny-by-default for direct browser access; future parent/staff browser data access must add scoped policies rather than disabling RLS.

### Secrets / payment details

Business name, bank account name and IBAN are read from server-side environment variables. Template values receive rendered bank details from trusted server code; clients do not provide authoritative payment details.

No privileged Supabase or Resend secret is intentionally exposed to the browser by this slice.

### Email templates

`academy_email_templates` is now the canonical editable wording store.

- The renderer supplies values only.
- Preview and send share the same renderer.
- Preview does not create delivery logs or mutate lifecycle state.
- Payment reference is a separate template value rather than hidden inside bank details.
- Template substitution is plain string replacement and does not evaluate executable template code.

### Family account / future session changes

- Cross-family balance use is prohibited by server-side relationship validation.
- Browser-submitted totals/prices are not authoritative.
- Historical paid/attended sessions are preserved.
- Family account entries are append-only operational audit records; prior entries are not overwritten by settlement actions.

## Supabase advisor snapshot

Security advisor run: 5 October 2026.

No advisor finding was returned at ERROR/critical severity.

Known baseline advisories:

1. **RLS enabled with no policy** on multiple operational tables.
   - Current interpretation: intentional deny-by-default browser access.
   - Do not “fix” this by disabling RLS.
   - Add narrowly scoped policies only when direct browser access is intentionally introduced.
   - Guidance: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

2. **Mutable function search path** on:
   - `public.enforce_delivery_seat_capacity`
   - `public.prevent_operational_config_archive`
   - Action: dedicated hardening migration after signature/behavior verification.
   - Guidance: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

3. **`btree_gist` extension installed in `public` schema.**
   - Action: handle as deliberate database maintenance, not incidental feature work.
   - Guidance: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

4. **Supabase leaked-password protection disabled.**
   - Action: enable during authentication hardening/configuration review.
   - Guidance: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Performance advisor output also contains existing unindexed-foreign-key and unused-index notices. These are documented baseline performance items and were not altered as part of this feature.

## Release conclusion

No new security boundary is introduced by the parent-template contract change. The principal release risk is configuration drift between stored template bodies and renderer placeholder values; the release includes a targeted data migration that adds `{{payment_reference}}` to existing stored initial/renewal templates only when that placeholder is absent.

The known advisor warnings above remain explicit backlog items. They are not silently treated as resolved.
