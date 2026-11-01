import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardImage } from '@/components/CardImage';
import { QuestionRow } from '@/components/QuestionRow';
import { useToast } from '@/components/Toast';
import {
  activeSubtopics,
  getAllTopics,
  getCategories,
  getTopicsInCategory,
  hashtag,
  popularQuestions,
  topicCardCount,
  topicCoverImage,
} from '@/content/repository';
import { search } from '@/content/search';
import type { Topic } from '@/content/types';
import { readJSON, writeJSON } from '@/state/storage';
import { colors, fonts, radius, space } from '@/theme/tokens';

const SUGGESTIONS = ['I’m afraid of losing my job', 'Is vaping wrong?', 'How do I pray?', 'Why did Jesus die?'];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [query, setQuery] = useState('');
  const results = useMemo(() => search(query), [query]);
  const searching = query.trim().length > 0;

  useEffect(() => {
    if (focus) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [focus]);

  const suggestQuestion = async () => {
    const list = await readJSON<string[]>('suggestions.v1', []);
    await writeJSON('suggestions.v1', [...list, query.trim()]);
    toast('Thanks — we’ll consider this question');
  };

  const openTopic = (id: string) => router.push({ pathname: '/topic/[id]', params: { id } });

  return (
    <View style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl }]}>
        <Text style={styles.title} accessibilityRole="header">
          Explore
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.creamFaint} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="What does the Bible say about…?"
            placeholderTextColor={colors.creamFaint}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search questions, topics and Bible references"
          />
          {searching ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.creamFaint} />
            </Pressable>
          ) : null}
        </View>

        {searching ? (
          <View style={styles.section}>
            {results.topics.length ? (
              <View style={[styles.chips, { marginBottom: space.lg }]}>
                {results.topics.slice(0, 6).map((t) => (
                  <TagChip key={t.id} topic={t} onPress={() => openTopic(t.id)} />
                ))}
              </View>
            ) : null}
            {results.cards.length ? (
              <>
                <Text style={styles.sectionLabel}>
                  {results.cards.length} {results.cards.length === 1 ? 'question' : 'questions'}
                </Text>
                {results.cards.map((c) => (
                  <QuestionRow key={c.id} card={c} />
                ))}
              </>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>We don’t have a card for that yet.</Text>
                <Text style={styles.emptyBody}>
                  New questions are written and reviewed carefully. You can suggest this one, or explore a
                  related topic.
                </Text>
                <Pressable onPress={suggestQuestion} style={styles.suggestBtn} accessibilityRole="button">
                  <Text style={styles.suggestText}>Suggest this question</Text>
                </Pressable>
                <View style={[styles.chips, { marginTop: space.xl }]}>
                  {getAllTopics()
                    .filter((t) => t.kind === 'primary')
                    .map((t) => (
                      <TagChip key={t.id} topic={t} onPress={() => openTopic(t.id)} />
                    ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={[styles.chips, { marginTop: space.md }]}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => setQuery(s)} style={styles.suggestion} accessibilityRole="button">
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>

            <FeaturedTopic onOpen={openTopic} />

            {getCategories().map((cat) => {
              const topics = getTopicsInCategory(cat.id).filter((t) => t.id !== 'anxiety');
              if (!topics.length) return null;
              return (
                <View key={cat.id} style={styles.section}>
                  <Text style={styles.sectionLabel}>{cat.name}</Text>
                  <View style={styles.grid}>
                    {topics.map((t) => (
                      <TopicTile key={t.id} topic={t} onPress={() => openTopic(t.id)} />
                    ))}
                  </View>
                </View>
              );
            })}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Popular questions</Text>
              {popularQuestions(6).map((c) => (
                <QuestionRow key={c.id} card={c} />
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>All hashtags</Text>
              <View style={styles.chips}>
                {getAllTopics()
                  .filter((t) => topicCardCount(t.id) > 0)
                  .map((t) => (
                    <TagChip key={t.id} topic={t} onPress={() => openTopic(t.id)} />
                  ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FeaturedTopic({ onOpen }: { onOpen: (id: string) => void }) {
  const cover = topicCoverImage('anxiety');
  const subs = activeSubtopics('anxiety');
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Featured collection</Text>
      <Pressable
        onPress={() => onOpen('anxiety')}
        accessibilityRole="link"
        accessibilityLabel="Open the Anxiety collection"
        style={styles.featured}>
        {cover ? <CardImage imageKey={cover.key} alt="" width={400} height={230} style={StyleSheet.absoluteFill} /> : null}
        <LinearGradient
          colors={['rgba(11,18,15,0.05)', 'rgba(11,18,15,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.featuredText}>
          <Text style={styles.featuredTag}>#Anxiety</Text>
          <Text style={styles.featuredDesc}>
            {topicCardCount('anxiety')} questions about worry, fear, sleep, money, and finding peace.
          </Text>
        </View>
      </Pressable>
      <View style={[styles.chips, { marginTop: space.md }]}>
        {subs.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push({ pathname: '/topic/[id]', params: { id: 'anxiety', sub: s.id } })}
            style={styles.subChip}
            accessibilityRole="link">
            <Text style={styles.subChipText}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TopicTile({ topic, onPress }: { topic: Topic; onPress: () => void }) {
  const cover = topicCoverImage(topic.id);
  const count = topicCardCount(topic.id);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${hashtag(topic.id)}, ${count} questions`}
      style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.98 }] }]}>
      {cover ? <CardImage imageKey={cover.key} alt="" width={200} height={130} style={StyleSheet.absoluteFill} /> : null}
      <LinearGradient colors={['rgba(11,18,15,0.1)', 'rgba(11,18,15,0.88)']} style={StyleSheet.absoluteFill} />
      <View style={styles.tileText}>
        <Text style={styles.tileTag} numberOfLines={1}>
          {hashtag(topic.id)}
        </Text>
        <Text style={styles.tileCount}>
          {count} {count === 1 ? 'question' : 'questions'}
        </Text>
      </View>
    </Pressable>
  );
}

function TagChip({ topic, onPress }: { topic: Topic; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.chip,
        (pressed || hovered) && { backgroundColor: 'rgba(168,195,160,0.16)' },
      ]}>
      <Text style={styles.chipText}>{topic.kind === 'primary' ? hashtag(topic.id) : hashtag(topic.id).toLowerCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { paddingHorizontal: space.gutter, paddingBottom: 48 },
  title: { color: colors.cream, fontFamily: fonts.question, fontSize: 34, letterSpacing: -0.5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: space.lg,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.forest,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  input: {
    flex: 1,
    color: colors.cream,
    fontFamily: fonts.body,
    fontSize: 16,
    height: '100%',
    outlineStyle: 'none',
  } as object,
  section: { marginTop: space.xxl },
  sectionLabel: {
    color: colors.creamFaint,
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: space.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,195,160,0.45)',
  },
  chipText: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 13 },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(244,239,230,0.06)',
  },
  suggestionText: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 13 },
  featured: { height: 210, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.forest },
  featuredText: { position: 'absolute', left: 20, right: 20, bottom: 18 },
  featuredTag: { color: colors.cream, fontFamily: fonts.question, fontSize: 30, letterSpacing: -0.5 },
  featuredDesc: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(244,239,230,0.06)',
  },
  subChipText: { color: colors.creamMuted, fontFamily: fonts.bodyMedium, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48.5%',
    height: 112,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.forest,
    flexGrow: 1,
  },
  tileText: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  tileTag: { color: colors.cream, fontFamily: fonts.question, fontSize: 18 },
  tileCount: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  empty: { paddingTop: space.md },
  emptyTitle: { color: colors.cream, fontFamily: fonts.display, fontSize: 20 },
  emptyBody: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 22, marginTop: 8 },
  suggestBtn: {
    alignSelf: 'flex-start',
    marginTop: space.lg,
    paddingHorizontal: 18,
    height: 42,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  suggestText: { color: colors.night, fontFamily: fonts.bodySemi, fontSize: 14 },
});
