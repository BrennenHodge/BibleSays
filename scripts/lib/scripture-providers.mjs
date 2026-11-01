/**
 * Scripture text providers. Every displayed verse must come from one of these —
 * never typed from memory or generated.
 *
 *  NKJV → bolls.life (verified against Faithlife/biblia.com samples).
 *         NKJV © 1982 Thomas Nelson; confirm digital-use permission before launch.
 *  WEB, KJV → bible-api.com (public domain).
 */

export const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];
const ALIASES = { psalm: 'Psalms', 'song of songs': 'Song of Solomon' };

/** "Philippians 4:6-7" → { book: 'Philippians', bookNumber: 50, chapter: 4, from: 6, to: 7 } */
export function parseReference(ref) {
  const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:[-–](\d+))?$/);
  if (!m) throw new Error(`Unsupported reference format: "${ref}" (use "Book C:V" or "Book C:V-V")`);
  const raw = m[1].toLowerCase();
  const book = ALIASES[raw] ?? BOOKS.find((b) => b.toLowerCase() === raw);
  if (!book) throw new Error(`Unknown book in "${ref}"`);
  const from = Number(m[3]);
  const to = m[4] ? Number(m[4]) : from;
  if (to < from) throw new Error(`Bad verse range in "${ref}"`);
  return { book, bookNumber: BOOKS.indexOf(book) + 1, chapter: Number(m[2]), from, to };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch with backoff — bible-api.com rate-limits bursts (HTTP 429). */
async function fetchRetry(url) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url);
    if ((res.status !== 429 && res.status < 500) || attempt >= 6) return res;
    await sleep(3000 * (attempt + 1));
  }
}

const clean = (t) =>
  t
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

async function fromBolls(code, ref) {
  const p = parseReference(ref);
  const url = `https://bolls.life/get-text/${code}/${p.bookNumber}/${p.chapter}/`;
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`bolls.life HTTP ${res.status} for ${ref}`);
  const chapter = await res.json();
  const verses = chapter
    .filter((v) => v.verse >= p.from && v.verse <= p.to)
    .map((v) => ({ verse: `${p.chapter}:${v.verse}`, text: clean(v.text) }));
  if (verses.length !== p.to - p.from + 1) throw new Error(`bolls.life missing verses for ${ref}`);
  return { verses, source: `https://bolls.life/get-text/${code}/${p.bookNumber}/${p.chapter}/` };
}

async function fromBibleApi(code, ref) {
  parseReference(ref); // validate format
  const url = `https://bible-api.com/${encodeURIComponent(ref.replace(/–/g, '-'))}?translation=${code.toLowerCase()}`;
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`bible-api.com HTTP ${res.status} for ${ref}`);
  const data = await res.json();
  return {
    verses: data.verses.map((v) => ({ verse: `${v.chapter}:${v.verse}`, text: clean(v.text) })),
    source: url,
  };
}

export const PROVIDERS = {
  NKJV: { fetch: (ref) => fromBolls('NKJV', ref), license: 'NKJV © 1982 Thomas Nelson. Used by permission.' },
  WEB: { fetch: (ref) => fromBibleApi('WEB', ref), license: 'Public domain' },
  KJV: { fetch: (ref) => fromBibleApi('KJV', ref), license: 'Public domain' },
};

export const TRANSLATIONS = Object.keys(PROVIDERS);

export async function fetchPassage(code, ref) {
  const provider = PROVIDERS[code];
  if (!provider) throw new Error(`No provider for ${code}`);
  const { verses, source } = await provider.fetch(ref);
  return {
    reference: ref,
    text: verses.map((v) => v.text).join(' '),
    verses,
    license: provider.license,
    source,
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
}
