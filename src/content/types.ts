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
export type CareKind = 'mental-health' | 'abuse' | 'health';

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

export interface ScripturePassage {
  reference: string;
  text: string;
}

export interface ScriptureVerification {
  status: 'verified' | 'unverified' | 'mismatch';
  source: string;
  license: string;
  verifiedAt: string;
}

export interface CardScripture {
  translation: string;
  passages: ScripturePassage[];
  /** Reference for "read the full passage". */
  fullPassage?: string;
  verification?: ScriptureVerification;
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
  /** Filled from verified Scripture by the content sync step. */
  text?: string;
}

export interface CardStudy {
  context: string;
  relatedPassages: RelatedPassage[];
  reflection: string;
  prayer: string;
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
