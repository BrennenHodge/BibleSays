import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { hashtag, scriptureReference } from '@/content/repository';
import type { Card } from '@/content/types';
import { colors, fonts, radius, space } from '@/theme/tokens';

import { CardImage } from './CardImage';

/** Compact list row for a question card: thumbnail, hashtag, question, reference. */
export function QuestionRow({ card, trailing }: { card: Card; trailing?: ReactNode }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/card/[slug]', params: { slug: card.slug } })}
      accessibilityRole="link"
      accessibilityLabel={`${card.question} ${scriptureReference(card)}`}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        (pressed || hovered) && styles.rowActive,
      ]}>
      <CardImage imageKey={card.image.key} alt="" width={58} height={74} style={styles.thumb} />
      <View style={styles.text}>
        <Text style={styles.tag}>{hashtag(card.primaryTopic)}</Text>
        <Text style={styles.question} numberOfLines={3}>
          {card.question}
        </Text>
        <Text style={styles.ref}>
          {scriptureReference(card)} · {card.scripture.translation}
        </Text>
      </View>
      {trailing ?? <Ionicons name="chevron-forward" size={18} color={colors.creamFaint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md + 2,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    marginHorizontal: -space.sm,
    borderRadius: radius.md,
  },
  rowActive: { backgroundColor: 'rgba(244,239,230,0.05)' },
  thumb: { borderRadius: 10 },
  text: { flex: 1 },
  tag: { color: colors.sage, fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 0.4 },
  question: {
    color: colors.cream,
    fontFamily: fonts.display,
    fontSize: 16.5,
    lineHeight: 21,
    marginTop: 3,
  },
  ref: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
});
