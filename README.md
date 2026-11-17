# The Afternoon Academy

Education operations platform and bilingual public website for The Afternoon Academy in Madrid. Source: `afternoonacademy/the_afternoon_academy`; production website: https://www.theafternoonacademy.com/.

## Start here

Read [AGENTS.md](AGENTS.md) before making changes. Required project sources:

- [Current engineering baseline](docs/engineering/current-baseline.md)
- [Product roadmap](docs/product/product-roadmap.md)
- [Project change log](docs/product/project-change-log.md)
- [Development workflow](docs/engineering/agentic-development.md)
- [Security model](docs/security/security-model.md)
- [Feature specifications](specs/README.md)

## Stack and local checks

Next.js 16 App Router, React 19, Supabase/Postgres, Vercel and Resend. Use Node 22 (`.nvmrc`) and the committed npm lockfile.

```sh
npm ci
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Use approved non-production environment settings and synthetic data. Never copy real child/family records into local fixtures, commit credentials or expose service-role keys to the browser. A build with synthetic environment values proves compilation, not database integration.

## Current operating contract

- Live public offer: Monday–Friday, 17:00–17:50 or 18:00–18:50.
- Saturday/Sunday enquiry preferences gauge hourly demand; weekend provision is not opened automatically.
- Admin lead intake/editing is progressive and optional, including no email. Public contact/consent requirements remain in place.
- Family Pipeline owns the lifecycle. Standing places define recurring arrangements; exact paid service dates define delivery/payment entitlement.
- Record planned place saves without sending email. Email sending is separate and explicit.
- Operational capacity/session KPIs are weekday-only; actual cash/customer records remain factual.

PR #32 release was authorised on 17 November 2026. Tests: 146 passing; TypeScript and production build passing; independent source review complete. Six unrelated baseline lint errors remain. Real TAA database round-trip and automated browser verification remain unverified; see the baseline/change log for the exact limits.

## Release discipline

Use focused branches, local checks, independent review, economical previews and founder acceptance before merge. Batch source changes so intermediate commits do not exhaust Vercel builds. Do not use production as a test environment. No database migration is part of PR #32; rollback is a source revert.

### Staff signup (release candidate)

Staff use `/staff/sign-up` after an Admin approves their email and Admin/Teacher role in Academy Setup → Staff access. Signup uses a one-time email link, without a password. Opening the email link displays an explicit Continue confirmation; no role is granted until verified email ownership matches the protected invitation. Approval alone sends no email.

Apply `supabase/migrations/20261117191220_staff_magic_link_signup.sql` before activating this version. Preview email/session checks require a separate Supabase configuration and HTTPS `NEXT_PUBLIC_SITE_URL` set to the accepted preview origin; normal Resend configuration/sender is reused. See `specs/staff-magic-link-signup.md` for acceptance and release ordering. Production migration and Jessica's authorised Admin invitation remain pending release.
