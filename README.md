# Selah (working title) — Bible Discovery App

*The Bible, explained for the life you're actually living.*

A mobile-first, vertically swiped feed of real-life questions answered through Scripture. Built with **Expo SDK 58, React Native 0.88, Expo Router, and TypeScript** — one codebase for web, iOS, and Android.

> **Status: Phase 1 prototype.** The visual experience and core flows are complete with 42 published cards across 10 categories and 20 topics. Scripture text is verified; theological review of the explanations is still **pending** (see [Before launch](#before-launch)).
>
> **Live preview:** https://biblesays.brennen-d06.workers.dev

## Run it

```bash
npm install
npm run web        # desktop browser (centered phone frame + side panels)
npm start          # then press i / a, or scan the QR code with Expo Go
```

On desktop the app renders inside a centered phone-sized viewport (side panels appear at ≥1180px wide). Below 768px it is fully immersive. In the feed, scroll, swipe, or use ↑/↓ (also PageUp/PageDown, j/k).

Quality checks:

```bash
npm run typecheck
npx expo lint
npm run content:check
```

## Deploy and test builds

- **Web (Cloudflare Workers static assets):** `npm run deploy` exports the web build to `dist/` and runs `wrangler deploy` (config in `wrangler.jsonc`). Unknown paths serve `index.html`, so deep links like `/card/<slug>` and `/topic/<id>` work.
- **Android test APK (EAS Build):** `npx eas-cli@latest build -p android --profile preview`. The `preview` profile in `eas.json` produces an installable APK; the build page links the download. Project: `@brennenhodge/bible-discovery`, package `com.dbvantage.biblesays`.
- On Windows PowerShell, if `npx` is blocked by the script execution policy, use `npx.cmd`.

## What's in Phase 1

| Screen | Route | Notes |
| --- | --- | --- |
| Welcome | `/welcome` | Full-screen image, optional interests, skip allowed. No account. |
| Discover | `/` | Full-screen vertical cards, editorial order + interest boost + topic diversity, calm end page. |
| Topic feed | `/topic/[id]` | Landing cover (description, subtopic filters, related tags) then a vertical feed. Works for every hashtag. |
| Card | `/card/[slug]` | Deep link / saved / search target, followed by related cards. `?preview=1` shows unpublished cards. |
| Explore | `/explore` | "What does the Bible say about…?" search, featured #Anxiety collection, category tiles, popular questions, all hashtags. |
| Saved | `/saved` | Bookmarked cards, stored on-device. |
| Profile | `/profile` | Interests, text size, translation, premium preview, privacy controls, photo credits. |
| Go Deeper | `/deeper/[id]` | Card context, background notes, full-passage link, suggested prompts, free-text input, paywall. Clearly labeled **Prototype**. |
| Content studio | `/studio` | Every card with status, Scripture verification, review state, and image license; previews drafts. |

**Card layout (exact order):** primary hashtag → question → thin divider → Scripture with reference and translation → one explanation → 2–4 related hashtags → Save · Share · Go Deeper. No section labels. On small screens the explanation clamps with "Read more" instead of being cut off.

**Go Deeper safety:** crisis and abuse disclosures get a safety-first response (988 and the DV hotline) **even without premium**. Sensitive cards show a standing care note that never frames prayer as a replacement for professional care. Study responses visibly separate *Scripture* from *Interpretation* and *Application*. The prototype provider only composes reviewed card content and verified Scripture; it never generates Bible text.

## Project structure

```
content/                 Editable content library (no code changes needed to grow it)
  cards.json             Cards: question, scripture, explanation, tags, image ref, study notes, editorial status
  topics.json            Primary topics + lightweight hashtags, #Anxiety's 15 subtopics
  categories.json        Top-level categories
  images.json            Image assets with provider, license, attribution, blurhash
  scripture/             Verified text per translation (nkjv.json, kjv.json, web.json), keyed by reference
scripts/
  fetch-scripture.mjs    Pull verified NKJV/KJV/WEB text for every reference into content/scripture/
  show-verse.mjs         Print a passage in every translation (read-only, for writers)
  import-cards.mjs       Import a batch of drafted cards and their Unsplash picks
  content-sync.mjs       Validate references, quote integrity, taxonomy, images; stamp editorial defaults
  lib/                   Scripture providers (bolls.life for NKJV, bible-api.com for KJV/WEB)
  find-images.mjs        Search Unsplash (official API) for portrait candidates
  sync-images.mjs        Build content/images.json from picks; --register pings Unsplash download endpoints for new picks
src/
  app/                   Expo Router screens
  components/            BibleCard, CardFeed, CardImage, DesktopShell, …
  content/               Types, repository (swap for an API in Phase 2), feed, search
  services/study/        StudyProvider interface, prototype provider, safety, Phase 2 system prompt
  state/                 Prefs + saved cards (AsyncStorage → localStorage on web)
  config/app.ts          App name, translations, pricing, trial — all configurable
  theme/tokens.ts        Colors, fonts, spacing
```

## Content workflow

1. Add or edit a card in `content/cards.json` with `status: "draft"`, or import a batch: `npm run content:import -- drafts.json`. Use `npm run scripture:show -- "Psalm 139:14"` to read a passage in every translation while writing.
2. `npm run scripture:fetch`: fetches verified NKJV/KJV/WEB text for any new references into `content/scripture/`.
3. `npm run content:sync`: validates that every reference is verified in every translation, quote integrity across translations, topics/tags/categories/images/related cards, explanation length (35–70 words), tag count (2–4), and no reused images.
4. Preview it in the **Content studio** (Profile → Content studio), get theological review, then set `status: "published"`.

Only `published` cards appear in public surfaces.

**Images:** `npm run images:find -- "query one" "query two"` reads `UNSPLASH_ACCESS_KEY` from `.env` (gitignored). Record picks in `scripts/data/image-picks.json`, then run `npm run images:sync -- --register`. It pings Unsplash only for photos not yet listed in `scripts/data/unsplash-registered.json`, and stops when the hourly limit (50 requests on the demo key) runs out; rerun it later to finish. Images are hotlinked from Unsplash's CDN with photographer credit, as the Unsplash API guidelines require. Credits are listed in Profile.

## Scripture & translations

- **Default: New King James Version (NKJV).** Readers can switch to the **KJV** or **WEB** in Profile. Cards store only references; text comes from `content/scripture/<code>.json`, one verified store per translation, so adding a translation never touches the cards.
- **Sources:** NKJV comes from bolls.life (spot-checked against Faithlife's licensed text at biblia.com). KJV and WEB come from bible-api.com. Providers live in `scripts/lib/scripture-providers.mjs`.
- **Quote integrity:** `content:sync` fails if any 3+ word phrase quoted in an explanation or study note isn't word-for-word in *every* offered translation, so switching translations never shows a false quote.
- **NKJV licensing:** Thomas Nelson's published terms allow quoting up to 1,000 verses without written permission, with exact wording and this credit line: *"Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved."* Those terms are written for printed works, so **confirm digital/app use with Thomas Nelson Bible Rights & Permissions** before a commercial launch. The app shows the credit line in Profile and appends it to shared NKJV text.
- **NLT** stays modeled but disabled until licensed. Never type any translation from memory or generate it with AI.

## Before launch

- [ ] Theological/editorial review of every explanation and study note. All are marked `theologicalReview: "pending"`.
- [ ] Written confirmation of NKJV digital/app use from Thomas Nelson, and a licensed NKJV provider for production.
- [ ] Final app name. "Selah" is a placeholder in `config/app.ts` / `app.json`.
- [ ] Validate on real iOS and Android devices (`npm start` → Expo Go, or an EAS development build).
- [ ] Share-as-image (e.g. `react-native-view-shot`). Sharing currently sends text plus a deep link.

## Phase 2 hooks already in place

- `src/content/repository.ts`: the single data-access module; replace with API calls.
- `src/services/study/types.ts`: `StudyProvider` interface; implement an AI provider using `systemPrompt.ts`.
- `src/state/prefs.tsx`: `premiumPreview` stands in for a real entitlement (RevenueCat / StoreKit / Play Billing).
- `config/app.ts`: pricing, trial length, and features are display config, not hard-coded.
