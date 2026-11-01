/**
 * Plain-language search over questions, everyday keywords, hashtags and references.
 * Simple and transparent on purpose; swap for a search service in Phase 2.
 */
import { getAllTopics, publishedCards } from './repository';
import type { Card, Topic } from './types';

const STOPWORDS = new Set(
  'a an and are am about after again all also be been being but by can could did do does doing for from had has have how i if im in into is it its just me my of on or our should so than that the their them then there these they this to too us was we were what when where which who why will with would you your god bible say says said wrong okay ok'.split(
    ' ',
  ),
);

function stem(word: string): string {
  return word.replace(/(ing|ed|es|s)$/, '').replace(/'.*$/, '');
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .split(/[^a-z0-9']+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem)
    .filter((w) => w.length > 1);
}

export interface SearchResults {
  cards: Card[];
  topics: Topic[];
}

export function search(query: string): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { cards: [], topics: [] };
  const tokens = tokenize(q);
  if (!tokens.length) return { cards: [], topics: [] };

  const scored = publishedCards
    .map((card) => {
      let score = 0;
      const question = tokenize(card.question);
      const explanation = tokenize(card.explanation);
      const tags = card.tags.concat(card.primaryTopic).map((t) => t.replace('-', ''));
      const reference = card.scripture.passages.map((p) => p.reference.toLowerCase()).join(' ');

      for (const kw of card.keywords) {
        // Whole-word/phrase hit on an everyday term ("sin" must not match "losing").
        if (new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q)) score += 6;
      }
      for (const t of tokens) {
        if (question.includes(t)) score += 3;
        if (tags.some((tag) => stem(tag) === t)) score += 4;
        if (card.keywords.some((kw) => tokenize(kw).includes(t))) score += 3;
        if (explanation.includes(t)) score += 1;
        if (reference.includes(t)) score += 3;
      }
      return { card, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.card.priority - a.card.priority);

  // Drop weak tail matches once there's a strong result.
  const best = scored[0]?.score ?? 0;
  const relevant = scored.filter((s) => s.score >= Math.max(3, best * 0.3));

  const topics = getAllTopics().filter((t) =>
    tokens.some((tok) => stem(t.label.toLowerCase()).startsWith(tok) || stem(t.id).startsWith(tok)),
  );

  return { cards: relevant.map((s) => s.card), topics };
}
