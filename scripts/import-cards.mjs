#!/usr/bin/env node
/**
 * Imports drafted cards (e.g. from a writing/review batch) into content/cards.json and
 * records their Unsplash picks in scripts/data/image-picks.json.
 *
 * Input: a JSON file containing an array of drafts:
 *   { id, slug, priority, primaryCategory, primaryTopic, tags, question, passages: ["Ref"],
 *     fullPassage, explanation, keywords, interpretation, care: "none"|kind, relatedCardIds,
 *     image: { unsplashId, raw, author, authorUrl, page, downloadLocation, blurHash, color, size, alt },
 *     study: { context, relatedPassages: [{reference, note}], reflection, prayer, citations } }
 *
 * Then run: npm run images:sync -- --register && npm run scripture:fetch && npm run content:sync
 *
 * Usage: node scripts/import-cards.mjs drafts.json [--status published|in_review|draft]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [input] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!input) {
  console.error('Usage: node scripts/import-cards.mjs drafts.json [--status published]');
  process.exit(1);
}
const statusArg = process.argv.includes('--status') ? process.argv[process.argv.indexOf('--status') + 1] : 'draft';

const drafts = JSON.parse(readFileSync(input, 'utf8'));
const cardsPath = join(root, 'content/cards.json');
const picksPath = join(root, 'scripts/data/image-picks.json');
const cards = JSON.parse(readFileSync(cardsPath, 'utf8'));
const picks = JSON.parse(readFileSync(picksPath, 'utf8'));

let added = 0;
let updated = 0;
for (const d of drafts) {
  const card = {
    id: d.id,
    slug: d.slug,
    status: statusArg,
    priority: d.priority,
    primaryCategory: d.primaryCategory,
    primaryTopic: d.primaryTopic,
    tags: d.tags,
    question: d.question,
    scripture: { passages: d.passages.map((reference) => ({ reference })), fullPassage: d.fullPassage },
    explanation: d.explanation,
    keywords: d.keywords,
    interpretation: d.interpretation,
    ...(d.care && d.care !== 'none' ? { care: d.care } : {}),
    image: { key: d.id, alt: d.image.alt },
    relatedCardIds: d.relatedCardIds,
    study: {
      context: d.study.context,
      relatedPassages: d.study.relatedPassages.map(({ reference, note }) => ({ reference, note })),
      reflection: d.study.reflection,
      prayer: d.study.prayer,
      ...(d.study.citations?.length ? { citations: d.study.citations } : {}),
    },
  };
  const i = cards.findIndex((c) => c.id === card.id);
  if (i >= 0) {
    cards[i] = { ...cards[i], ...card, editorial: cards[i].editorial };
    updated++;
  } else {
    cards.push(card);
    added++;
  }
  picks[d.id] = {
    id: d.image.unsplashId,
    alt: d.image.alt,
    size: d.image.size,
    color: d.image.color,
    blurHash: d.image.blurHash,
    raw: d.image.raw,
    author: d.image.author,
    authorUrl: d.image.authorUrl.split('?')[0],
    page: d.image.page.split('?')[0],
    downloadLocation: d.image.downloadLocation,
  };
}

writeFileSync(cardsPath, JSON.stringify(cards, null, 2) + '\n');
writeFileSync(picksPath, JSON.stringify(picks, null, 2) + '\n');
console.log(`Imported ${added} new and ${updated} updated cards (status: ${statusArg}).`);
