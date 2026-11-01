import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardImage } from '@/components/CardImage';
import { appConfig } from '@/config/app';
import { getPrimaryTopics } from '@/content/repository';
import { usePrefs } from '@/state/prefs';
import { colors, fonts, radius, space } from '@/theme/tokens';

const INTEREST_IDS = ['anxiety', 'identity', 'relationships', 'loneliness', 'purpose', 'work', 'money', 'grief', 'faith-questions', 'jesus'];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, update } = usePrefs();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [picked, setPicked] = useState<string[]>(prefs.interests);
  const window = useWindowDimensions();
  const topics = getPrimaryTopics().filter((t) => INTEREST_IDS.includes(t.id));

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const start = (interests: string[]) => {
    update({ onboarded: true, interests });
    router.replace('/');
  };

  const w = layout.width || window.width;
  const h = layout.height || window.height;

  return (
    <View
      style={styles.root}
      onLayout={(e) => setLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      <CardImage
        imageKey="welcome"
        alt="Tall grass glowing in golden evening sunlight."
        width={w}
        height={h * 0.75}
        priority="high"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(11,18,15,0.15)', 'rgba(11,18,15,0.45)', 'rgba(11,18,15,0.94)', colors.night]}
        locations={[0, 0.3, 0.6, 0.8]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + space.xl, minHeight: h },
        ]}>
        <Text style={styles.brand}>{appConfig.appName}</Text>
        <View style={{ flex: 1, minHeight: 80 }} />
        <Text style={styles.headline} accessibilityRole="header">
          The Bible, explained for the life you’re actually living.
        </Text>
        <Text style={styles.sub}>
          Real questions about anxiety, relationships, money, purpose, and faith — answered through
          Scripture, one card at a time.
        </Text>

        <Text style={styles.pickLabel}>What’s on your mind lately? (optional)</Text>
        <View style={styles.chips}>
          {topics.map((t) => {
            const on = picked.includes(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() => toggle(t.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {t.id === 'faith-questions' ? 'Faith questions' : t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => start(picked)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }] }]}>
          <Text style={styles.ctaText}>Start Exploring</Text>
        </Pressable>
        <Pressable onPress={() => start([])} accessibilityRole="button" style={styles.skip} hitSlop={8}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { paddingHorizontal: space.gutter + 4 },
  brand: { color: colors.cream, fontFamily: fonts.question, fontSize: 22, letterSpacing: -0.2 },
  headline: {
    color: colors.cream,
    fontFamily: fonts.question,
    fontSize: 36,
    lineHeight: 41,
    letterSpacing: -0.6,
  },
  sub: {
    color: colors.creamMuted,
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 23,
    marginTop: space.lg,
  },
  pickLabel: {
    color: colors.creamFaint,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(244,239,230,0.04)',
  },
  chipOn: { backgroundColor: 'rgba(168,195,160,0.2)', borderColor: colors.sage },
  chipText: { color: colors.creamMuted, fontFamily: fonts.bodyMedium, fontSize: 14 },
  chipTextOn: { color: colors.cream },
  cta: {
    marginTop: space.xxl,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: colors.night, fontFamily: fonts.bodySemi, fontSize: 16, letterSpacing: 0.2 },
  skip: { alignSelf: 'center', marginTop: space.lg, padding: space.sm },
  skipText: { color: colors.creamFaint, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
