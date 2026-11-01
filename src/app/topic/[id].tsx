import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { CardFeed } from '@/components/CardFeed';
import { CardImage } from '@/components/CardImage';
import { FeedEnd } from '@/components/FeedEnd';
import {
  activeSubtopics,
  cardsForTopic,
  getTopic,
  hashtag,
  topicCoverImage,
} from '@/content/repository';
import { colors, fonts, radius, space } from '@/theme/tokens';

export default function TopicScreen() {
  const { id, sub } = useLocalSearchParams<{ id: string; sub?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topic = getTopic(id);
  const cards = useMemo(() => cardsForTopic(id, sub), [id, sub]);
  const subtopics = useMemo(() => activeSubtopics(id), [id]);
  const cover = topicCoverImage(id);
  const activeSub = subtopics.find((s) => s.id === sub);

  const renderCover = useCallback(
    ({ width, height }: { width: number; height: number }) => (
      <View style={{ width, height, backgroundColor: colors.night }}>
        {cover ? (
          <CardImage imageKey={cover.key} alt={cover.alt} width={width} height={height * 0.72} priority="high" />
        ) : null}
        <LinearGradient
          colors={['rgba(11,18,15,0.25)', 'rgba(11,18,15,0.55)', colors.night]}
          locations={[0, 0.45, 0.78]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.coverContent, { paddingBottom: insets.bottom + 40 }]}>
          <Text style={styles.coverTag} accessibilityRole="header">
            {hashtag(id)}
          </Text>
          <Text style={styles.coverDesc}>{topic?.description}</Text>
          <Text style={styles.count}>
            {cards.length} {cards.length === 1 ? 'question' : 'questions'}
            {activeSub ? ` · ${activeSub.label}` : ''}
          </Text>

          {subtopics.length > 1 ? (
            <View style={styles.subs}>
              <SubChip label="All" on={!sub} onPress={() => router.setParams({ sub: undefined })} />
              {subtopics.map((s) => (
                <SubChip key={s.id} label={s.label} on={sub === s.id} onPress={() => router.setParams({ sub: s.id })} />
              ))}
            </View>
          ) : null}

          {topic?.related?.length ? (
            <View style={styles.relatedRow}>
              <Text style={styles.relatedLabel}>Related</Text>
              {topic.related.map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="link"
                  onPress={() => router.push({ pathname: '/topic/[id]', params: { id: r } })}>
                  <Text style={styles.relatedTag}>{hashtag(r).toLowerCase()}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.swipeHint} accessibilityElementsHidden importantForAccessibility="no">
            <Ionicons name="chevron-up" size={18} color={colors.creamFaint} />
            <Text style={styles.swipeText}>Swipe up to begin</Text>
          </View>
        </View>
      </View>
    ),
    [cover, cards.length, id, insets.bottom, router, sub, subtopics, topic, activeSub],
  );

  const renderEnd = useCallback(
    (size: { width: number; height: number }) => (
      <FeedEnd
        {...size}
        title={`That’s all of ${hashtag(id)} for now.`}
        body="New questions are added as they’re reviewed. Try a related topic, or explore the full library."
      />
    ),
    [id],
  );

  if (!topic) {
    return (
      <View style={styles.missing}>
        <BackButton />
        <Text style={styles.coverDesc}>We couldn’t find that topic.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* key forces a fresh feed (back to the cover) when the subtopic filter changes */}
      <CardFeed key={sub ?? 'all'} cards={cards} renderCover={renderCover} renderEnd={renderEnd} />
      <BackButton />
    </View>
  );
}

function SubChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.sub, on && styles.subOn]}>
      <Text style={[styles.subText, on && styles.subTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  missing: { flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  coverContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.gutter,
  },
  coverTag: {
    color: colors.cream,
    fontFamily: fonts.question,
    fontSize: 44,
    letterSpacing: -0.8,
  },
  coverDesc: {
    color: colors.creamMuted,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    marginTop: space.sm,
  },
  count: {
    color: colors.sage,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: space.lg,
  },
  subs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.lg },
  sub: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(244,239,230,0.05)',
  },
  subOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  subText: { color: colors.creamMuted, fontFamily: fonts.bodyMedium, fontSize: 13 },
  subTextOn: { color: colors.night },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: space.xl },
  relatedLabel: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 13 },
  relatedTag: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 14 },
  swipeHint: { alignItems: 'center', marginTop: space.xxl, gap: 2 },
  swipeText: { color: colors.creamFaint, fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 0.4 },
});
