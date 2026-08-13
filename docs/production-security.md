# Production security runbook

This runbook separates controls enforced by the repository from controls that must be completed in Supabase, Vercel and GitHub settings.

## Immediate owner actions

1. Rotate every Supabase secret or service-role key that has been copied into a chat, screenshot or untrusted document.
2. Change any administrator password that has been shared and sign out other sessions.
3. Enable multi-factor authentication for the Supabase, GitHub and Vercel owner accounts.
4. Confirm the React app uses only `VITE_SUPABASE_URL` and the browser-safe `VITE_SUPABASE_ANON_KEY` publishable value.

## Supabase production checklist

- Apply all files in `supabase/migrations` in timestamp order.
- Keep the four media buckets as public delivery/read buckets only; uploads, changes and deletion remain protected by Storage RLS.
- Keep image, audio, video and document size/type limits enabled.
- Record alternative text, credit, rights holder, licence, source evidence and consent status before using managed media publicly.
- Scheduled content remains hidden by database policy until its release time; archive records instead of permanently deleting editorial work.
- Set the Site URL to `https://online-tourism-malawi.vercel.app`.
- Allow local and Vercel preview redirect URLs only when they are needed.
- Require email confirmation for new public accounts.
- Set a minimum password length of 12 and enable leaked-password protection if the project plan supports it.
- Configure branded SMTP instead of relying on development email limits.
- Verify Row Level Security with anonymous, member, editor and administrator test accounts.
- Review authentication and database logs after every role or policy change.
- Enable point-in-time recovery or scheduled backups appropriate to the project plan.

## Vercel production checklist

- Keep the Supabase URL and publishable key in Vercel Environment Variables for Production, Preview and Development.
- Never add a Supabase secret or service-role key to a Vite project.
- Redeploy after environment-variable changes; existing deployments keep their previous build-time values.
- Verify the security headers with the production URL after deployment.
- Keep preview deployments protected when they expose draft or administrative work.

## GitHub production checklist

- Require a pull request before merging to `main`.
- Require the `CI` and `CodeQL` checks to pass.
- Block force pushes and branch deletion on `main`.
- Enable private vulnerability reporting and secret scanning where repository settings permit it.
- Review Dependabot pull requests weekly.
- Keep repository and deployment permissions limited to active maintainers.

## Public form protection

Database constraints limit payload sizes and hidden honeypot fields remove basic automated submissions. Before a high-traffic launch, route newsletter, contact and contribution writes through a server-side or Supabase Edge Function with rate limiting and a privacy-respecting bot challenge. Client-side checks alone are not a complete anti-abuse boundary.

## Incident response

1. Revoke or rotate the exposed credential.
2. Disable the affected account or integration if misuse is possible.
3. Review Supabase, GitHub and Vercel audit logs for the exposure window.
4. Preserve relevant timestamps and evidence without copying personal data into public issues.
5. Patch and test on a protected branch.
6. Redeploy, invalidate affected sessions and monitor for recurrence.
7. Record the cause and update this runbook.
