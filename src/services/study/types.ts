import type { Card } from '@/content/types';

export type StudyPromptId = 'apply' | 'verses' | 'context' | 'reflect' | 'pray';

export const STUDY_PROMPTS: { id: StudyPromptId; label: string }[] = [
  { id: 'apply', label: 'How does this apply to my situation?' },
  { id: 'verses', label: 'What other verses speak about this?' },
  { id: 'context', label: 'Explain this passage more deeply.' },
  { id: 'reflect', label: 'Help me reflect on this today.' },
  { id: 'pray', label: 'Help me pray about this.' },
];

/**
 * Responses are structured so the UI can visibly separate the biblical text from
 * interpretation, application, and care guidance.
 */
export type StudyBlock =
  | { type: 'scripture'; reference: string; translation: string; text: string; note?: string }
  | { type: 'interpretation'; text: string }
  | { type: 'application'; text: string }
  | { type: 'reflection'; text: string }
  | { type: 'prayer'; text: string }
  | { type: 'care'; text: string }
  | { type: 'notice'; text: string };

export interface StudyMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  blocks?: StudyBlock[];
}

export interface StudyInput {
  promptId?: StudyPromptId;
  text: string;
  /** Reader's translation; Scripture blocks are quoted from its verified text. */
  translation: string;
}

export interface StudyProvider {
  respond(card: Card, input: StudyInput, history: StudyMessage[]): Promise<StudyBlock[]>;
}
