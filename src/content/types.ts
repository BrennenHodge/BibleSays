/**
 * Content model: Categories → Topics/Hashtags → Cards → Scripture → Related content.
 * Source data lives in /content/*.json so the library can grow without code changes.
 */

export type EditorialStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';

export type InterpretationClass =
  | 'direct-teaching'
  | 'modern-application'
  | 'disputed-interpretation'
  | 'sensitive-personal';

/** Which supportive care note (if any) to show alongside sensitive content. */
export type CareKind = 'mental-health' | 'abuse' | 'health' | 'grief';

export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Subtopic {
  id: string;
  label: string;
}

export interface Topic {
  id: string;
  /** Rendered as a hashtag, e.g. "Anxiety" → #Anxiety */
  label: string;
  /** Primary topics get tiles and landing pages; tags are lighter-weight hashtags. */
  kind: 'primary' | 'tag';
  categoryId: string;
  description: string;
  order?: number;
  related?: string[];
  subtopics?: Subtopic[];
  coverImageKey?: string;
}

/** Cards store references only; text comes from the verified per-translation store. */
export interface ScripturePassage {
  reference: string;
}

export interface CardScripture {
  passages: ScripturePassage[];
  /** Reference for "read the full passage". */
  fullPassage?: string;
}

/** One verified passage in one translation (content/scripture/<code>.json). */
export interface VerifiedPassage {
  reference: string;
  text: string;
  verses: { verse: string; text: string }[];
  license: string;
  source: string;
  fetchedAt: string;
}

export interface ImageAsset {
  provider: 'unsplash' | 'generated' | 'original' | 'licensed';
  providerId?: string;
  url: string;
  width: number;
  height: number;
  color?: string;
  blurHash?: string;
  /** expo-image contentPosition, e.g. 'center', 'top', '30% 40%'. */
  focus?: string;
  author?: string;
  authorUrl?: string;
  sourceUrl?: string;
  license: string;
  licenseUrl?: string;
}

export interface CardImageRef {
  key: string;
  alt: string;
}

export interface RelatedPassage {
  reference: string;
  note: string;
}

export interface CardStudy {
  context: string;
  relatedPassages: RelatedPassage[];
  reflection: string;
  prayer: string;
  /** Other references quoted in `context`, so quotes can be verified in every translation. */
  citations?: string[];
}

export interface EditorialMeta {
  version: number;
  createdBy: string;
  reviewer: string | null;
  theologicalReview: 'pending' | 'approved' | 'changes-requested';
  publishedAt: string | null;
  updatedAt: string;
}

export interface Card {
  id: string;
  slug: string;
  status: EditorialStatus;
  priority: number;
  primaryCategory: string;
  primaryTopic: string;
  subtopic?: string;
  /** 2–4 related hashtags shown on the card (topic ids). */
  tags: string[];
  question: string;
  scripture: CardScripture;
  explanation: string;
  /** Everyday-language search terms ("vaping", "lost my job"). */
  keywords: string[];
  interpretation: InterpretationClass;
  care?: CareKind;
  image: CardImageRef;
  relatedCardIds: string[];
  study?: CardStudy;
  editorial?: EditorialMeta;
}
