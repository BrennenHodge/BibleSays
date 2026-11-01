import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

import { appConfig } from '@/config/app';
import { hashtag, scriptureReference, scriptureText } from '@/content/repository';
import type { Card } from '@/content/types';

export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed';

export function cardUrl(card: Card): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : appConfig.share.webOrigin;
  return `${origin}/card/${card.slug}`;
}

/** Public card content only — private study conversations are never included. */
export function shareText(card: Card): string {
  return [
    card.question,
    '',
    `“${scriptureText(card)}”`,
    `— ${scriptureReference(card)} (${card.scripture.translation})`,
    '',
    card.explanation,
    '',
    hashtag(card.primaryTopic),
  ].join('\n');
}

export async function shareCard(card: Card): Promise<ShareResult> {
  const url = cardUrl(card);
  const text = shareText(card);
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.share) {
        await nav.share({ title: card.question, text, url });
        return 'shared';
      }
      await Clipboard.setStringAsync(`${text}\n\n${url}`);
      return 'copied';
    }
    const result = await Share.share({ title: card.question, message: `${text}\n\n${url}`, url });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch (e) {
    // AbortError = user closed the share sheet.
    if (e instanceof Error && e.name === 'AbortError') return 'dismissed';
    try {
      await Clipboard.setStringAsync(`${text}\n\n${url}`);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
