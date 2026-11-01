#!/usr/bin/env node
/**
 * Editorial validation for /content (run after scripture:fetch).
 *
 *  1. Every reference (card passages, related passages, study citations) has verified
 *     text in EVERY supported translation (content/scripture/<code>.json).
 *  2. Quote integrity: any quoted phrase (3+ words) in an explanation, background note,
 *     related-passage note, or reflection must appear word-for-word in every translation
 *     of that card's Scripture — so switching translations never shows a false quote.
 *  3. References between cards, topics, categories and images resolve.
 *  4. Quality: explanation length 35–70 words, 2–4 tags, unique image per published card.
 *
 * Usage: node scripts/content-sync.mjs [--check]   (--check = validate only, no writes)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRANSLATIONS } from './lib/scripture-providers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const checkOnly = process.argv.includes('--check');

const cards = read('content/cards.json');
const topics = read('content/topics.json');
const categories = read('content/categories.json');
const images = read('content/images.json');
const stores = Object.fromEntries(TRANSLATIONS.map((t) => [t, read(`content/scripture/${t.toLowerCase()}.json`)]));

const topicIds = new Set(topics.map((t) => t.id));
const categoryIds = new Set(categories.map((c) => c.id));
const cardIds = new Set(cards.map((c) => c.id));
const errors = [];
const warnings = [];
const today = new Date().toISOString().slice(0, 10);

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[“”"‘’']/g, '')
    .replace(/[.,;:!?()—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const imageUse = new Map();

for (const card of cards) {
  const where = `[${card.id}]`;
  const refs = [
    ...card.scripture.passages.map((p) => p.reference),
    ...(card.study?.relatedPassages ?? []).map((r) => r.reference),
    ...(card.study?.citations ?? []),
  ];

  // 1. Verified text in every translation
  for (const ref of refs) {
    for (const t of TRANSLATIONS) {
      if (!stores[t][ref]?.text) errors.push(`${where} no verified ${t} text for ${ref} — run npm run scripture:fetch`);
    }
  }

  // 2. Quote integrity across translations
  const quotedFields = [
    ['explanation', card.explanation],
    ['background', card.study?.context ?? ''],
    ['reflection', card.study?.reflection ?? ''],
    ...(card.study?.relatedPassages ?? []).map((r) => [`note on ${r.reference}`, r.note]),
  ];
  for (const [field, text] of quotedFields) {
    for (const m of text.matchAll(/“([^”]+)”/g)) {
      const phrase = norm(m[1]);
      if (phrase.split(' ').length < 3) continue;
      const missing = TRANSLATIONS.filter(
        (t) => !refs.some((ref) => norm(stores[t][ref]?.text ?? '').includes(phrase)),
      );
      if (missing.length)
        errors.push(`${where} ${field} quotes “${m[1]}”, which isn't in the ${missing.join('/')} text of its passages`);
    }
  }

  // Editorial metadata defaults
  card.editorial = {
    version: 1,
    createdBy: 'Prototype seed library',
    reviewer: null,
    theologicalReview: 'pending',
    publishedAt: card.status === 'published' ? today : null,
    updatedAt: today,
    ...card.editorial,
  };

  // 3. References
  if (!categoryIds.has(card.primaryCategory)) errors.push(`${where} unknown category ${card.primaryCategory}`);
  if (!topicIds.has(card.primaryTopic)) errors.push(`${where} unknown primary topic ${card.primaryTopic}`);
  for (const t of card.tags) if (!topicIds.has(t)) errors.push(`${where} unknown tag ${t}`);
  if (!images[card.image.key]) errors.push(`${where} missing image ${card.image.key}`);
  if (!card.image.alt) errors.push(`${where} missing alt text`);
  for (const id of card.relatedCardIds) if (!cardIds.has(id)) errors.push(`${where} unknown related card ${id}`);
  if (card.subtopic) {
    const topic = topics.find((t) => t.id === card.primaryTopic);
    if (!topic?.subtopics?.some((s) => s.id === card.subtopic))
      errors.push(`${where} unknown subtopic ${card.subtopic}`);
  }
  if (card.status === 'published') {
    const prev = imageUse.get(card.image.key);
    if (prev) errors.push(`${where} reuses image ${card.image.key} (also on ${prev})`);
    imageUse.set(card.image.key, card.id);
  }

  // 4. Quality
  const words = card.explanation.split(/\s+/).length;
  if (words < 35 || words > 70) warnings.push(`${where} explanation is ${words} words (target 35–70)`);
  if (card.tags.length < 2 || card.tags.length > 4) warnings.push(`${where} has ${card.tags.length} tags (target 2–4)`);
  if (!card.tags.includes(card.primaryTopic)) warnings.push(`${where} tags don't include its primary topic`);
}

for (const t of topics) {
  if (!categoryIds.has(t.categoryId)) errors.push(`[topic ${t.id}] unknown category ${t.categoryId}`);
  if (t.coverImageKey && !images[t.coverImageKey]) errors.push(`[topic ${t.id}] missing cover image`);
  for (const r of t.related ?? []) if (!topicIds.has(r)) errors.push(`[topic ${t.id}] unknown related ${r}`);
  if (t.kind === 'primary' && !cards.some((c) => c.status === 'published' && c.primaryTopic === t.id))
    warnings.push(`[topic ${t.id}] primary topic has no published cards`);
}
for (const c of categories) {
  if (!topics.some((t) => t.kind === 'primary' && t.categoryId === c.id))
    warnings.push(`[category ${c.id}] has no primary topics`);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

const published = cards.filter((c) => c.status === 'published').length;
const primary = topics.filter((t) => t.kind === 'primary').length;
console.log(
  `\n${cards.length} cards (${published} published), ${categories.length} categories, ${primary} primary topics, ` +
    `${topics.length} topics/tags, ${Object.keys(images).length} images, translations ${TRANSLATIONS.join('/')} — ` +
    `${errors.length} errors, ${warnings.length} warnings`,
);

if (!checkOnly && !errors.length) {
  writeFileSync(join(root, 'content/cards.json'), JSON.stringify(cards, null, 2) + '\n');
  console.log('content/cards.json updated.');
}
process.exit(errors.length ? 1 : 0);
