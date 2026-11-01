import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardImage } from '@/components/CardImage';
import { IconButton } from '@/components/IconButton';
import { getAllCardsForStudio, getImage, hashtag, scriptureReference } from '@/content/repository';
import type { EditorialStatus } from '@/content/types';
import { colors, fonts, radius, space } from '@/theme/tokens';

const STATUS_COLORS: Record<EditorialStatus, string> = {
  draft: colors.creamFaint,
  in_review: colors.gold,
  approved: colors.sage,
  published: colors.sageDeep,
  archived: colors.danger,
};

/**
 * Internal editorial view: every card regardless of status, with Scripture
 * verification, review state, and image licensing at a glance. Cards are edited
 * in content/cards.json and checked with `npm run content:check`.
 */
export default function StudioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<EditorialStatus | 'all'>('all');
  const cards = useMemo(
    () => getAllCardsForStudio().filter((c) => filter === 'all' || c.status === filter),
    [filter],
  );
  const all = getAllCardsForStudio();
  const statuses: (EditorialStatus | 'all')[] = ['all', 'published', 'in_review', 'approved', 'draft', 'archived'];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="chevron-back" label="Back" variant="plain" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
        <Text style={styles.headerTitle}>Content studio</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.note}>
          {all.length} cards · {all.filter((c) => c.scripture.verification?.status === 'verified').length} with verified
          Scripture · {all.filter((c) => c.editorial?.theologicalReview === 'approved').length} theologically approved.
          Edit content/cards.json, then run npm run content:sync.
        </Text>
        <View style={styles.filters}>
          {statuses.map((s) => (
            <Pressable
              key={s}
              onPress={() => setFilter(s)}
              style={[styles.filter, filter === s && styles.filterOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === s }}>
              <Text style={[styles.filterText, filter === s && { color: colors.night }]}>
                {s.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>

        {cards.map((c) => {
          const img = getImage(c.image.key);
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/card/[slug]', params: { slug: c.slug, preview: '1' } })}
              style={styles.row}
              accessibilityRole="link">
              <CardImage imageKey={c.image.key} alt="" width={52} height={68} style={{ borderRadius: 8 }} />
              <View style={{ flex: 1 }}>
                <View style={styles.metaRow}>
                  <Text style={[styles.status, { color: STATUS_COLORS[c.status] }]}>
                    ● {c.status.replace('_', ' ')}
                  </Text>
                  <Text style={styles.meta}>{hashtag(c.primaryTopic)}</Text>
                </View>
                <Text style={styles.q}>{c.question}</Text>
                <Text style={styles.meta}>
                  {scriptureReference(c)} {c.scripture.translation} ·{' '}
                  {c.scripture.verification?.status === 'verified' ? '✓ verified' : '✗ unverified'} · review{' '}
                  {c.editorial?.theologicalReview ?? 'pending'} · {c.interpretation.replace(/-/g, ' ')}
                </Text>
                <Text style={styles.meta}>
                  Image: {img ? `${img.author} · ${img.license}` : 'missing'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  headerTitle: { color: colors.cream, fontFamily: fonts.bodySemi, fontSize: 16 },
  content: { padding: space.gutter, paddingBottom: 60 },
  note: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.lg, marginBottom: space.md },
  filter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  filterOn: { backgroundColor: colors.cream },
  filterText: { color: colors.creamMuted, fontFamily: fonts.bodyMedium, fontSize: 12, textTransform: 'capitalize' },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  metaRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  status: { fontFamily: fonts.bodySemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  q: { color: colors.cream, fontFamily: fonts.display, fontSize: 15.5, lineHeight: 20, marginVertical: 3 },
  meta: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16 },
});
