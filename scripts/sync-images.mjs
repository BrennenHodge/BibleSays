#!/usr/bin/env node
/**
 * Builds content/images.json from editorial picks (scripts/data/image-picks.json),
 * keyed by image key. Each record keeps provider, license, and attribution metadata.
 *
 * Unsplash API guidelines: images are hotlinked from images.unsplash.com, the
 * photographer is credited, and the photo's download endpoint is pinged once
 * when the photo is selected for use (pass --register to do that).
 *
 * Usage: node scripts/sync-images.mjs [--register]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const picks = JSON.parse(readFileSync(join(root, 'scripts/data/image-picks.json'), 'utf8'));
const outPath = join(root, 'content/images.json');
const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {};

const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const register = process.argv.includes('--register');
const utm = 'utm_source=bible_discovery_app&utm_medium=referral';

const images = { ...existing };
for (const [rawKey, p] of Object.entries(picks)) {
  const key = rawKey.replace(/^_/, '');
  const [w, h] = p.size.split('x').map(Number);
  images[key] = {
    provider: 'unsplash',
    providerId: p.id,
    // Base URL; the app appends imgix sizing params (w, h, fit, q, auto=format).
    url: p.raw.split('?')[0] + '?ixlib=rb-4.1.0',
    width: w,
    height: h,
    color: p.color,
    blurHash: p.blurHash,
    focus: existing[key]?.focus ?? 'center',
    author: p.author,
    authorUrl: `${p.authorUrl}?${utm}`,
    sourceUrl: `${p.page}?${utm}`,
    license: 'Unsplash License',
    licenseUrl: 'https://unsplash.com/license',
  };
  if (register && process.env.UNSPLASH_ACCESS_KEY) {
    const res = await fetch(p.downloadLocation, {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    });
    console.log(`${res.ok ? '✓' : '✗'} registered ${key}`);
  }
}

writeFileSync(outPath, JSON.stringify(images, null, 2) + '\n');
console.log(`Wrote ${Object.keys(images).length} images to content/images.json`);
