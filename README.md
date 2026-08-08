# Online Tourism Malawi

A responsive React frontend for discovering Malawi's arts, natural heritage, museums, living performances, events and media stories.

## Highlights

- Eight polished page experiences with reusable navigation, hero, card, event and newsletter patterns
- Responsive layouts for desktop, tablet and mobile
- Search and category filtering for heritage content and events
- Interactive performance browser, podcast player and sign-in demonstration
- Route aliases for the approved information architecture
- Accurate Malawi outline treatment and real Malawi-focused photography
- Keyboard-friendly controls, semantic landmarks and reduced-motion support

## Routes

| Page | Route |
| --- | --- |
| Home | `/` |
| Arts & Natural Heritage | `/explore` |
| Museums & Collections | `/museums` |
| Performance & Celebration | `/performance` |
| Events | `/events` |
| Media Library & Podcasts | `/media-library` |
| About Us | `/about-us` |
| Sign In | `/sign-in` |

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

## Photography and map credits

The frontend uses externally hosted photographs from Wikimedia Commons so the visual content depicts real Malawi places, archives and traditions rather than AI-generated substitutes. Each `Special:Redirect/file` URL resolves to its Commons file page and license metadata.

- Malawi outline map: Slomox, public domain, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:SVG-Koort_Malawi.svg)
- Mount Mulanje: africankelli, CC BY 2.0, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mount_Mulanje.jpg)
- Gule Wamkulu photographs: Wikimedia Commons contributors, licensing shown on each source file
- Lake Malawi, Chongoni, museums and archive photographs: Wikimedia Commons contributors, licensing shown on each source file

Content, dates, opening hours and contact addresses in this frontend are realistic editorial placeholders and should be verified before production launch.

