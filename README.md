# Online Tourism Malawi

A responsive full-stack-ready React experience for discovering Malawi's six cultural and creative sectors, heritage, museums, events, media and creative people.

## Highlights

- A complete visitor journey with sector, listing, detail, search, directory, visit-planning, contact and contribution pages
- Responsive layouts for desktop, tablet and mobile
- Search and category filtering for heritage content and events
- Interactive performance browser, podcast player, account registration and saved member collections
- A protected Editorial Studio for content, events, podcasts, enquiries, submissions, subscribers, member roles and activity history
- Governed Supabase Storage uploads for images, audio, video and documents with rights, licence and consent metadata
- Draft, scheduled, published and archived editorial states, featured stories, immutable version history and safe restoration
- Submission-to-draft conversion and privacy-conscious subscriber CSV export
- Route aliases for the approved information architecture
- Accurate Malawi outline treatment and real Malawi-focused photography
- Keyboard-friendly controls, semantic landmarks and reduced-motion support
- Route announcements, focus-managed navigation, offline recovery messaging and a safe application error screen
- Lazy-loaded public experiences with automated JavaScript and stylesheet performance budgets
- Privacy-conscious Vercel Web Analytics, Core Web Vitals and a scheduled production journey monitor
- Supabase authentication, editorial content, creative profiles, saved items, newsletter, contact and submission services with resilient local fallbacks
- Automated GitHub Pages deployment with SPA deep-link support

## Routes

| Page | Route |
| --- | --- |
| Home | `/` |
| Six Creative Sectors | `/segments` |
| Cultural & Natural Heritage | `/explore` |
| Heritage Detail | `/heritage/:slug` |
| Museums & Collections | `/museums` |
| Museum Detail | `/museums/:slug` |
| Performance & Celebration | `/performance` |
| Visual Arts & Crafts | `/visual-arts-crafts` |
| Books & Press | `/books-press` |
| Design & Creative | `/design-creative` |
| Events | `/events` |
| Event Detail | `/events/:slug` |
| Audio Visual & Interactive Media | `/media-library` |
| Creative Directory | `/directory` |
| Creative Profile | `/directory/:slug` |
| Search | `/search` |
| Plan Your Visit | `/plan-your-visit` |
| Contact | `/contact` |
| Contribute | `/contribute` |
| Member Collection | `/account` |
| About Us | `/about-us` |
| Sign In / Register | `/sign-in`, `/register` |
| Administration Studio | `/admin` |
| Accessibility / Privacy / Terms | `/accessibility`, `/privacy`, `/terms` |

Legacy-friendly aliases such as `/arts-natural-heritage`, `/museums-collections`, `/performance-celebration`, `/media`, `/podcasts`, `/about` and `/login` redirect to their canonical pages.

## Run locally

```bash
pnpm install
pnpm dev
```

Build and lint:

```bash
pnpm lint
pnpm build
```

## Connect the production backend

The app uses Supabase for email/password authentication, magic links and published content. It remains fully usable with its curated local content when environment keys are absent.

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations` in timestamp order. Later migrations add the live media catalogue, database hardening, governed Storage buckets, editorial scheduling and version history.
3. Copy `.env.example` to `.env.local` and add the project URL and public anonymous key.
4. For GitHub Pages, add the same values as repository secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Authentication preview mode is development-only and disabled by default. To test the local preview studio without Supabase, set `VITE_ENABLE_AUTH_PREVIEW=true` in `.env.local`. Production builds always fail closed when secure account services are missing or invalid.

The database enables row-level security. Visitors can read published material and submit forms without gaining access to private records; signed-in members can only read and manage their own profiles, saved items and submissions.

### Approve the first administrator

Register the intended owner through the website first. Then run this once in the Supabase SQL editor, replacing the example address with that account's email:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id from auth.users where email = 'owner@example.com'
);
```

After signing in, the owner can open `/admin` and assign `editor` or `admin` roles from **Members & roles**. Role changes are enforced by database policies and recorded in `admin_audit_log`.

Only the Supabase publishable key belongs in `VITE_SUPABASE_ANON_KEY`. Never place a Supabase secret or service-role key in a Vite environment variable or browser bundle.

## Security

Run the complete local quality gate before proposing a change:

```bash
pnpm check
```

This scans tracked files for common credential patterns, runs ESLint, creates the production bundle, enforces asset-size budgets and opens every major public route plus the sitemap, robots file and web-app manifest. The repository also includes CodeQL, Dependabot, strict Vercel browser headers and a database hardening migration. Operational requirements and credential-rotation steps are documented in [`docs/production-security.md`](docs/production-security.md). Vulnerabilities should be reported privately using [`SECURITY.md`](SECURITY.md).

## Deployment

Every push to `main` runs `.github/workflows/deploy-pages.yml`, builds the production bundle and deploys it to GitHub Pages. The included `404.html` preserves direct links to React routes.

Vercel builds automatically enable the Analytics and Speed Insights hooks; local and GitHub Pages builds omit them. Enable both products in the Vercel project dashboard before launch. The scheduled production monitor checks the canonical Vercel journey every six hours. Follow [`docs/launch-runbook.md`](docs/launch-runbook.md) for preview validation, production promotion, first-hour checks and rollback.

## Photography and map credits

The frontend uses externally hosted photographs from Wikimedia Commons so the visual content depicts real Malawi places, archives and traditions rather than AI-generated substitutes. Each `Special:Redirect/file` URL resolves to its Commons file page and license metadata.

- Malawi outline map: Slomox, public domain, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:SVG-Koort_Malawi.svg)
- Mount Mulanje: africankelli, CC BY 2.0, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mount_Mulanje.jpg)
- Gule Wamkulu photographs: Wikimedia Commons contributors, licensing shown on each source file
- Lake Malawi, Chongoni, museums and archive photographs: Wikimedia Commons contributors, licensing shown on each source file

Content, dates, opening hours and contact addresses in this frontend are realistic editorial placeholders and should be verified before production launch.
