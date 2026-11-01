import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { CardFeed } from '@/components/CardFeed';
import { FeedEnd } from '@/components/FeedEnd';
import { getCard, relatedCards } from '@/content/repository';
import { colors, fonts } from '@/theme/tokens';

/**
 * A single card (deep link, saved card, search result) followed by related cards,
 * so the reader can keep swiping vertically.
 * `?preview=1` lets the content studio preview unpublished cards.
 */
export default function CardScreen() {
  const { slug, preview } = useLocalSearchParams<{ slug: string; preview?: string }>();
  const card = getCard(slug);
  const visible = card && (card.status === 'published' || preview === '1');
  const cards = useMemo(() => (card ? [card, ...relatedCards(card)] : []), [card]);
  const renderEnd = useCallback(
    (size: { width: number; height: number }) => <FeedEnd {...size} />,
    [],
  );

  if (!visible) {
    return (
      <View style={styles.missing}>
        <BackButton />
        <Text style={styles.text}>This card isn’t available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CardFeed cards={cards} renderEnd={renderEnd} />
      <BackButton />
      {card.status !== 'published' ? (
        <View style={styles.previewBadge} pointerEvents="none">
          <Text style={styles.previewText}>PREVIEW · {card.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  missing: { flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 15 },
  previewBadge: {
    position: 'absolute',
    top: 22,
    alignSelf: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewText: { color: colors.night, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1 },
});
