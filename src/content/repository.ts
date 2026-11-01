/**
 * Content repository. Phase 1 reads the bundled JSON library; Phase 2 can swap this
 * module for an API-backed implementation with the same function signatures.
 */
import cardsJson from '../../content/cards.json';
import categoriesJson from '../../content/categories.json';
import imagesJson from '../../content/images.json';
import topicsJson from '../../content/topics.json';

import type { Card, Category, ImageAsset, Topic } from './types';

const allCards = cardsJson as Card[];
const categories = (categoriesJson as Category[]).slice().sort((a, b) => a.order - b.order);
const topics = topicsJson as Topic[];
const images = imagesJson as Record<string, ImageAsset>;

const cardById = new Map(allCards.map((c) => [c.id, c]));
const cardBySlug = new Map(allCards.map((c) => [c.slug, c]));
const topicById = new Map(topics.map((t) => [t.id, t]));

/** Only published cards are visible in public surfaces. */
export const publishedCards: Card[] = allCards
  .filter((c) => c.status === 'published')
  .sort((a, b) => b.priority - a.priority);

export function getAllCardsForStudio(): Card[] {
  return allCards;
}

export function getCard(idOrSlug: string): Card | undefined {
  return cardById.get(idOrSlug) ?? cardBySlug.get(idOrSlug);
}

export function getTopic(id: string): Topic | undefined {
  return topicById.get(id);
}

export function getCategories(): Category[] {
  return categories;
}

export function getPrimaryTopics(): Topic[] {
  return topics
    .filter((t) => t.kind === 'primary')
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getTopicsInCategory(categoryId: string): Topic[] {
  return getPrimaryTopics().filter((t) => t.categoryId === categoryId);
}

export function getAllTopics(): Topic[] {
  return topics;
}

/** "#Anxiety" for primary topics, "#fear" for lighter tags. */
export function hashtag(topicId: string): string {
  const topic = topicById.get(topicId);
  return `#${topic?.label ?? topicId}`;
}

export function cardsForTopic(topicId: string, subtopic?: string): Card[] {
  return publishedCards
    .filter((c) => c.primaryTopic === topicId || c.tags.includes(topicId))
    .filter((c) => !subtopic || c.subtopic === subtopic)
    .sort((a, b) => {
      const primary = Number(b.primaryTopic === topicId) - Number(a.primaryTopic === topicId);
      return primary || b.priority - a.priority;
    });
}

export function topicCardCount(topicId: string): number {
  return cardsForTopic(topicId).length;
}

/** Subtopics of a topic that actually have published cards. */
export function activeSubtopics(topicId: string) {
  const topic = topicById.get(topicId);
  if (!topic?.subtopics) return [];
  const used = new Set(cardsForTopic(topicId).map((c) => c.subtopic));
  return topic.subtopics.filter((s) => used.has(s.id));
}

export function relatedCards(card: Card, limit = 4): Card[] {
  const seen = new Set([card.id]);
  const out: Card[] = [];
  for (const id of card.relatedCardIds) {
    const c = cardById.get(id);
    if (c && c.status === 'published' && !seen.has(c.id)) {
      out.push(c);
      seen.add(c.id);
    }
  }
  for (const c of publishedCards) {
    if (out.length >= limit) break;
    if (seen.has(c.id)) continue;
    if (c.tags.some((t) => card.tags.includes(t))) {
      out.push(c);
      seen.add(c.id);
    }
  }
  return out.slice(0, limit);
}

export function popularQuestions(limit = 6): Card[] {
  return publishedCards.slice(0, limit);
}

export function getImage(key: string): ImageAsset | undefined {
  return images[key];
}

export function getAllImages(): Record<string, ImageAsset> {
  return images;
}

export function topicCoverImage(topicId: string): { key: string; alt: string } | undefined {
  const topic = topicById.get(topicId);
  if (topic?.coverImageKey) return { key: topic.coverImageKey, alt: `${topic.label} cover image` };
  const first = cardsForTopic(topicId)[0];
  return first?.image;
}

// Requests snap to a few standard sizes so renditions are shared across devices
// (warm in the CDN and the local cache) instead of generated per exact pixel size.
const WIDTH_BUCKETS = [160, 320, 480, 640, 828, 1080, 1440];
const RATIO_BUCKETS = [0.6, 0.75, 1, 1.25, 1.4, 1.6, 1.8];

/** Builds an optimized CDN URL for a given render size. */
export function imageUrl(asset: ImageAsset, width: number, height?: number, quality = 72): string {
  if (asset.provider !== 'unsplash') return asset.url;
  const w = WIDTH_BUCKETS.find((b) => b >= width) ?? 1600;
  const params = [`w=${w}`, 'fit=crop', `q=${quality}`, 'auto=format'];
  if (height) {
    const ratio = RATIO_BUCKETS.reduce((best, r) =>
      Math.abs(r - height / width) < Math.abs(best - height / width) ? r : best,
    );
    params.push(`h=${Math.round(w * ratio)}`, 'crop=entropy');
  }
  return `${asset.url}&${params.join('&')}`;
}

export function scriptureText(card: Card): string {
  return card.scripture.passages.map((p) => p.text).join(' ');
}

export function scriptureReference(card: Card): string {
  return card.scripture.passages.map((p) => p.reference.replace('-', '–')).join('; ');
}
