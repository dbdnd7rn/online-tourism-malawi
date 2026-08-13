# Production launch runbook

This runbook is the release path for Online Tourism Malawi. It keeps database changes, the deployable frontend and monitoring evidence in a reviewable sequence.

## 1. Preflight

1. Run every file in `supabase/migrations` in timestamp order and confirm there are no failed statements.
2. Confirm Row Level Security is enabled on every public table and Storage bucket.
3. Confirm the intended owner can sign in, open `/admin` and perform a reversible draft edit.
4. Confirm Vercel contains `VITE_SUPABASE_URL` and the publishable `VITE_SUPABASE_ANON_KEY` for Preview and Production. Never add a Supabase secret key to a Vite variable.
5. Run `pnpm check`. This must pass the credential scan, lint, build, asset budgets and route checks.

## 2. Observability

1. Enable **Web Analytics** and **Speed Insights** in the Vercel project dashboard.
2. Analytics and performance scripts activate only in a Vercel build. They do not run locally or on GitHub Pages.
3. Query strings and URL fragments are removed before measurement so searches, recovery parameters and campaign details are not sent by these hooks.
4. The scheduled `Production smoke monitor` GitHub Action checks the core visitor journey every six hours. Configure repository Action-failure notifications for the maintainers.
5. On a Pro plan, add a signed Vercel Log Drain or an error-tracking integration. On Hobby, use the Vercel deployment logs and the scheduled smoke monitor.

## 3. Release

1. Push the release branch and wait for GitHub CI to pass.
2. Create a Vercel Preview deployment from the exact release commit.
3. Check Home, Cultural & Natural Heritage, Media Library, Plan Your Visit, Sign In and `/admin` at desktop and mobile widths.
4. Confirm Supabase authentication, published content, a media item, a contact submission and a saved item in Preview.
5. Promote the verified Preview artifact to Production. Do not rebuild between approval and promotion.

## 4. First-hour checks

1. Run `SITE_ORIGIN=https://online-tourism-malawi.vercel.app node scripts/production-smoke.mjs`.
2. Inspect the Vercel deployment for build errors and runtime errors.
3. Confirm the canonical domain, sitemap, robots file and web-app manifest return `200`.
4. Confirm Web Analytics has received a page view and Speed Insights begins receiving field data.
5. Review Supabase authentication and database logs for unexpected authorization failures.

## 5. Rollback

1. If visitor routes or authentication are broken, immediately reassign the production domain to the last verified Vercel deployment.
2. Database migrations are forward-only. Correct a faulty migration with a new migration; do not edit a migration already applied to Production.
3. Re-run the production smoke script after rollback and record the failed deployment, symptoms and corrective action in the release notes.

## Release evidence

Record the release commit, preview URL, production deployment ID, migration timestamps, smoke-check result and the person who approved promotion. Never include passwords, tokens, visitor messages or raw personal data in release evidence.
