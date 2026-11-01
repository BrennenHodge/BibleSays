import { passageText, scriptureReference, scriptureText } from '@/content/repository';
import type { Card } from '@/content/types';

import { abuseMessage, careNote, crisisMessage, detectRisk } from './safety';
import type { StudyBlock, StudyInput, StudyProvider } from './types';

/**
 * Prototype study provider. It composes responses only from the card's reviewed
 * content and verified Scripture — it never generates Bible text. The Phase 2 AI
 * provider implements the same interface (see systemPrompt.ts).
 */
export const prototypeStudyProvider: StudyProvider = {
  async respond(card: Card, input: StudyInput): Promise<StudyBlock[]> {
    await new Promise((r) => setTimeout(r, 650));

    const risk = detectRisk(input.text);
    if (risk === 'crisis') return [{ type: 'care', text: crisisMessage() }];
    if (risk === 'abuse') return [{ type: 'care', text: abuseMessage() }];

    const study = card.study;
    const translation = input.translation;
    const main: StudyBlock = {
      type: 'scripture',
      reference: scriptureReference(card),
      translation,
      text: scriptureText(card, translation),
    };

    switch (input.promptId) {
      case 'context':
        return [
          main,
          { type: 'interpretation', text: study?.context ?? card.explanation },
          ...(card.interpretation === 'disputed-interpretation'
            ? [
                {
                  type: 'notice',
                  text: 'Christians from different traditions read this passage in more than one way. The note above explains the main views rather than picking one as the only option.',
                } as StudyBlock,
              ]
            : []),
        ];
      case 'verses':
        return [
          ...(study?.relatedPassages ?? [])
            .map((p) => ({ p, verified: passageText(p.reference, translation) }))
            .filter(({ verified }) => verified.text)
            .map(
              ({ p, verified }): StudyBlock => ({
                type: 'scripture',
                reference: p.reference.replace('-', '–'),
                translation: verified.translation,
                text: verified.text,
                note: p.note,
              }),
            ),
        ];
      case 'reflect':
        return [
          main,
          { type: 'reflection', text: study?.reflection ?? 'What stands out to you in this passage today?' },
        ];
      case 'pray':
        return [
          {
            type: 'prayer',
            text: study?.prayer ?? 'God, help me understand Your Word and live it today.',
          },
          {
            type: 'notice',
            text: 'This is a suggested prayer written by our editors — feel free to use your own words.',
          },
        ];
      case 'apply':
      default: {
        const blocks: StudyBlock[] = [];
        if (!input.promptId) {
          blocks.push({
            type: 'notice',
            text: 'Prototype: in the full version, your study companion responds to exactly what you shared, citing Scripture. For now, here’s where this card would begin.',
          });
        }
        blocks.push(
          { type: 'application', text: card.explanation },
          { type: 'reflection', text: study?.reflection ?? 'Where do you see this in your own life?' },
        );
        if (card.care) blocks.push({ type: 'care', text: careNote(card.care) });
        return blocks;
      }
    }
  },
};
