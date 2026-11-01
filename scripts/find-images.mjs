#!/usr/bin/env node
/**
 * Editorial helper: searches Unsplash (official API) for portrait candidates.
 * Requires UNSPLASH_ACCESS_KEY in .env. Prints candidates as JSON so an editor
 * can choose one per card and record it in content/cards.json.
 *
 * Usage: node scripts/find-images.mjs "mountain sunrise person" ["another query" ...]
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const key = process.env.UNSPLASH_ACCESS_KEY;
if (!key) {
  console.error('UNSPLASH_ACCESS_KEY is not set.');
  process.exit(1);
}

const queries = process.argv.slice(2);
const out = {};
for (const q of queries) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&orientation=portrait&per_page=8&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } });
  if (!res.ok) {
    out[q] = { error: res.status };
    continue;
  }
  const data = await res.json();
  out[q] = data.results.map((p) => ({
    id: p.id,
    alt: p.alt_description,
    likes: p.likes,
    size: `${p.width}x${p.height}`,
    color: p.color,
    blurHash: p.blur_hash,
    raw: p.urls.raw,
    author: p.user.name,
    authorUrl: p.user.links.html,
    page: p.links.html,
    downloadLocation: p.links.download_location,
  }));
}
console.log(JSON.stringify(out, null, 2));
