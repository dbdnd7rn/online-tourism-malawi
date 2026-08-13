# Security Policy

## Supported version

Security fixes are applied to the latest production version on `main`. Preview and feature branches are supported only while they are under active review.

## Reporting a vulnerability

Do not post credentials, personal information or exploit details in a public issue.

Use [GitHub private vulnerability reporting](https://github.com/dbdnd7rn/online-tourism-malawi/security/advisories/new) to report a suspected vulnerability. Include the affected route, the impact, reproduction steps and any suggested mitigation. Remove real visitor data and credentials from screenshots or logs.

## Credential rules

- The React application may receive only the Supabase project URL and browser-safe publishable key.
- Supabase secret and service-role keys must never use a `VITE_` prefix or enter the browser bundle.
- Local values belong in `.env.local`; deployed values belong in Vercel or the relevant CI secret store.
- Rotate a credential immediately if it appears in chat, source control, logs or screenshots.
- Administrator accounts must use a unique password and multi-factor authentication where available.

## Production controls

The application uses Supabase Row Level Security for visitor, member, editor and administrator access. Browser security headers are defined in `vercel.json`, GitHub workflows run lint/build/security checks, and CodeQL plus Dependabot monitor new changes.

See [`docs/production-security.md`](docs/production-security.md) for the deployment checklist and incident procedure.
