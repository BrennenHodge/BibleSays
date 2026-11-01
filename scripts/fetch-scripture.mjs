#!/usr/bin/env node
/**
 * Fetches verified text, in every supported translation, for every reference used
 * in the content library (card passages, related passages, and study citations).
 * Writes content/scripture/<translation>.json, keyed by reference.
 *
 * Usage: node scripts/fetch-scripture.mjs [--only NKJV] [--refresh]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRANSLATIONS, fetchPassage } from './lib/scripture-providers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'content/scripture');
mkdirSync(outDir, { recursive: true });

const cards = JSON.parse(readFileSync(join(root, 'content/cards.json'), 'utf8'));
const argv = process.argv.slice(2);
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1].toUpperCase() : null;
const refresh = argv.includes('--refresh');

const refs = new Set();
for (const card of cards) {
  for (const p of card.scripture.passages) refs.add(p.reference);
  for (const r of card.study?.relatedPassages ?? []) refs.add(r.reference);
  for (const r of card.study?.citations ?? []) refs.add(r);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;

for (const code of TRANSLATIONS.filter((t) => !only || t === only)) {
  const file = join(outDir, `${code.toLowerCase()}.json`);
  const store = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  let fetched = 0;
  for (const ref of [...refs].sort()) {
    if (store[ref] && !refresh) continue;
    try {
      store[ref] = await fetchPassage(code, ref);
      fetched++;
      console.log(`✓ ${code} ${ref}`);
      writeFileSync(file, JSON.stringify(sortKeys(store), null, 2) + '\n');
    } catch (e) {
      failures++;
      console.error(`✗ ${code} ${ref}: ${e.message}`);
    }
    await sleep(code === 'NKJV' ? 400 : 2200); // bible-api.com rate-limits more strictly
  }
  writeFileSync(file, JSON.stringify(sortKeys(store), null, 2) + '\n');
  console.log(`${code}: ${fetched} fetched, ${Object.keys(store).length} stored`);
}

function sortKeys(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}

process.exit(failures ? 1 : 0);
