# Selah (working title) — Bible Discovery App

*The Bible, explained for the life you're actually living.*

A mobile-first, vertically swiped feed of real-life questions answered through Scripture. Built with **Expo SDK 58, React Native 0.88, Expo Router, and TypeScript** — one codebase for web, iOS, and Android.

> **Status: Phase 1 prototype.** The visual experience and core flows are complete with a 20-card seed library. Scripture text is verified; theological review of the explanations is still **pending** (see [Before launch](#before-launch)).

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
scripts/
  fetch-scripture.mjs    Pull verified text for every reference (bible-api.com, WEB)
  content-sync.mjs       Fill verified text into cards, stamp verification, validate everything
  find-images.mjs        Search Unsplash (official API) for portrait candidates
  sync-images.mjs        Build content/images.json from picks; --register pings Unsplash download endpoints
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

1. Add or edit a card in `content/cards.json` (leave `scripture.passages[].text` empty and set `status: "draft"`).
2. `npm run scripture:fetch`: fetches verified text for any new references into `scripts/data/scripture-cache.json`.
3. `npm run content:sync`: fills the text, stamps verification, and validates topics, tags, images, related cards, explanation length (35–70 words), tag count (2–4), and that every quoted phrase in an explanation actually appears in the verified Scripture.
4. Preview it in the **Content studio** (Profile → Content studio), get theological review, then set `status: "published"`.

Only `published` cards appear in public surfaces.

**Images:** `npm run images:find -- "query one" "query two"` reads `UNSPLASH_ACCESS_KEY` from `.env` (gitignored). Record picks in `scripts/data/image-picks.json`, then run `npm run images:sync -- --register`. Images are hotlinked from Unsplash's CDN with photographer credit, as the Unsplash API guidelines require. Credits are listed in Profile.

## Scripture & licensing

- Prototype text is the **World English Bible (public domain)**, verified against bible-api.com. Every displayed verse and every related passage in Go Deeper comes from that verified cache.
- **NLT** (preferred) is modeled in `config/app.ts` but disabled until licensed. Tyndale offers an NLT API with a key. Add a provider to `fetch-scripture.mjs` and switch `translation` per card. Never type NLT wording from memory or generate it with AI.

## Before launch

- [ ] Theological/editorial review of all 20 explanations and study notes. All are marked `theologicalReview: "pending"`.
- [ ] NLT license and provider, or choose another licensed translation.
- [ ] Final app name. "Selah" is a placeholder in `config/app.ts` / `app.json`.
- [ ] Validate on real iOS and Android devices (`npm start` → Expo Go, or an EAS development build).
- [ ] Share-as-image (e.g. `react-native-view-shot`). Sharing currently sends text plus a deep link.

## Phase 2 hooks already in place

- `src/content/repository.ts`: the single data-access module; replace with API calls.
- `src/services/study/types.ts`: `StudyProvider` interface; implement an AI provider using `systemPrompt.ts`.
- `src/state/prefs.tsx`: `premiumPreview` stands in for a real entitlement (RevenueCat / StoreKit / Play Billing).
- `config/app.ts`: pricing, trial length, and features are display config, not hard-coded.
