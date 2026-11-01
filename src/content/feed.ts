/**
 * Deterministic MVP discovery: editorial priority, a boost for chosen interests,
 * and topic diversification so the same topic never appears twice in a row.
 */
import { publishedCards } from './repository';
import type { Card } from './types';

const INTEREST_BOOST = 12;

export function buildDiscoverFeed(interests: string[]): Card[] {
  const interestSet = new Set(interests);
  const scored = publishedCards
    .map((card) => ({
      card,
      score:
        card.priority +
        (interestSet.has(card.primaryTopic) || card.tags.some((t) => interestSet.has(t))
          ? INTEREST_BOOST
          : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.card);

  return diversify(scored);
}

/** Greedy pass: take the best card whose topic differs from the last two shown. */
export function diversify(cards: Card[]): Card[] {
  const pool = cards.slice();
  const out: Card[] = [];
  while (pool.length) {
    const recent = out.slice(-2).map((c) => c.primaryTopic);
    let idx = pool.findIndex((c) => !recent.includes(c.primaryTopic));
    if (idx === -1) idx = pool.findIndex((c) => c.primaryTopic !== recent[recent.length - 1]);
    if (idx === -1) idx = 0;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
