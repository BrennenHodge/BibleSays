import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getPrimaryTopics, hashtag } from '@/content/repository';
import { colors, fonts, radius, space } from '@/theme/tokens';

interface Props {
  width: number;
  height: number;
  title?: string;
  body?: string;
}

/** A calm stopping point instead of an endless feed. */
export function FeedEnd({ width, height, title, body }: Props) {
  const router = useRouter();
  return (
    <View style={[styles.root, { width, height }]}>
      <Text style={styles.mark}>✦</Text>
      <Text style={styles.title}>{title ?? 'You’ve reached a quiet place.'}</Text>
      <Text style={styles.body}>
        {body ??
          'That’s every card for now. Take a moment with what stood out to you — or keep exploring a topic.'}
      </Text>
      <View style={styles.chips}>
        {getPrimaryTopics().map((t) => (
          <Pressable
            key={t.id}
            onPress={() => router.push({ pathname: '/topic/[id]', params: { id: t.id } })}
            accessibilityRole="link"
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
            <Text style={styles.chipText}>{hashtag(t.id)}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => router.navigate('/explore')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
        <Text style={styles.buttonText}>Explore all topics</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.night,
    justifyContent: 'center',
    paddingHorizontal: space.gutter + 4,
  },
  mark: { color: colors.gold, fontSize: 22, marginBottom: space.lg },
  title: { color: colors.cream, fontFamily: fonts.question, fontSize: 28, lineHeight: 33 },
  body: {
    color: colors.creamMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    marginTop: space.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.xl },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,195,160,0.45)',
  },
  chipText: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 13 },
  button: {
    marginTop: space.xxl,
    alignSelf: 'flex-start',
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    height: 46,
    justifyContent: 'center',
  },
  buttonText: { color: colors.night, fontFamily: fonts.bodySemi, fontSize: 15 },
});
