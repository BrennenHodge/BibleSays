#!/usr/bin/env node
/**
 * Editorial sync + validation for /content.
 *
 *  1. Fills Scripture text on each card (and related passages) from the verified
 *     cache produced by fetch-scripture.mjs, and stamps verification metadata.
 *  2. Validates references between cards, topics and images.
 *  3. Flags quality issues: explanation length, tag count, and quoted phrases in
 *     explanations that don't appear in the card's verified Scripture.
 *
 * Usage: node scripts/content-sync.mjs [--check]   (--check = validate only, no writes)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const checkOnly = process.argv.includes('--check');

const cards = read('content/cards.json');
const topics = read('content/topics.json');
const categories = read('content/categories.json');
const images = read('content/images.json');
const cache = read('scripts/data/scripture-cache.json');

const topicIds = new Set(topics.map((t) => t.id));
const categoryIds = new Set(categories.map((c) => c.id));
const cardIds = new Set(cards.map((c) => c.id));
const errors = [];
const warnings = [];
const today = new Date().toISOString().slice(0, 10);

const norm = (s) => s.toLowerCase().replace(/[“”"’‘']/g, "'").replace(/\s+/g, ' ');

for (const card of cards) {
  const where = `[${card.id}]`;
  const translation = card.scripture.translation.toLowerCase();

  // 1. Scripture text from verified cache
  let allVerified = true;
  for (const p of card.scripture.passages) {
    const hit = cache[`${translation}:${p.reference}`];
    if (!hit) {
      allVerified = false;
      errors.push(`${where} no verified ${card.scripture.translation} text for ${p.reference} — run fetch-scripture`);
      continue;
    }
    if (p.text && norm(p.text) !== norm(hit.text)) {
      allVerified = false;
      errors.push(`${where} text for ${p.reference} does not match verified source`);
      continue;
    }
    p.text = hit.text;
  }
  for (const r of card.study?.relatedPassages ?? []) {
    const hit = cache[`${translation}:${r.reference}`];
    if (hit) r.text = hit.text;
    else warnings.push(`${where} related passage ${r.reference} not verified`);
  }
  if (allVerified) {
    const first = cache[`${translation}:${card.scripture.passages[0].reference}`];
    card.scripture.verification = {
      status: 'verified',
      source: 'bible-api.com',
      license: first.license,
      verifiedAt: card.scripture.verification?.verifiedAt ?? today,
    };
  } else {
    card.scripture.verification = { status: 'unverified', source: '', license: '', verifiedAt: '' };
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

  // 2. References
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

  // 3. Quality
  const words = card.explanation.split(/\s+/).length;
  if (words < 35 || words > 70) warnings.push(`${where} explanation is ${words} words (target 35–70)`);
  if (card.tags.length < 2 || card.tags.length > 4) warnings.push(`${where} has ${card.tags.length} tags (target 2–4)`);
  const scripture = norm(
    card.scripture.passages.map((p) => p.text).join(' ') +
      ' ' +
      (card.study?.relatedPassages ?? []).map((r) => r.text ?? '').join(' '),
  );
  for (const m of card.explanation.matchAll(/“([^”]+)”/g)) {
    const phrase = norm(m[1]).replace(/[.,]$/, '');
    if (phrase.split(' ').length >= 3 && !scripture.includes(phrase))
      warnings.push(`${where} quoted phrase not found in card Scripture: “${m[1]}”`);
  }
}

// Images used by topics
for (const t of topics) {
  if (t.coverImageKey && !images[t.coverImageKey]) errors.push(`[topic ${t.id}] missing cover image`);
  for (const r of t.related ?? []) if (!topicIds.has(r)) errors.push(`[topic ${t.id}] unknown related ${r}`);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

const published = cards.filter((c) => c.status === 'published').length;
console.log(
  `\n${cards.length} cards (${published} published), ${topics.length} topics, ${Object.keys(images).length} images — ${errors.length} errors, ${warnings.length} warnings`,
);

if (!checkOnly && !errors.length) {
  writeFileSync(join(root, 'content/cards.json'), JSON.stringify(cards, null, 2) + '\n');
  console.log('content/cards.json updated.');
}
process.exit(errors.length ? 1 : 0);
