import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/Toast';
import { appConfig } from '@/config/app';
import { getAllImages, getPrimaryTopics } from '@/content/repository';
import { usePrefs, type TextSize } from '@/state/prefs';
import { useSaved } from '@/state/saved';
import { writeJSON } from '@/state/storage';
import { colors, fonts, radius, space } from '@/theme/tokens';

const SIZES: { id: TextSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { prefs, update, reset } = usePrefs();
  const { saved, remove } = useSaved();

  const toggleInterest = (id: string) =>
    update({
      interests: prefs.interests.includes(id)
        ? prefs.interests.filter((x) => x !== id)
        : [...prefs.interests, id],
    });

  const credits = Object.entries(getAllImages());

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl }]}>
      <Text style={styles.title} accessibilityRole="header">
        Profile
      </Text>
      <Text style={styles.sub}>Browsing as a guest. No account needed to read, save, or share.</Text>

      <Section title="Your interests" note="Shapes the order of your Discover feed.">
        <View style={styles.chips}>
          {getPrimaryTopics().map((t) => {
            const on = prefs.interests.includes(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() => toggleInterest(t.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>#{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Text size">
        <View style={styles.segment} accessibilityRole="radiogroup">
          {SIZES.map((s) => {
            const on = prefs.textSize === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => update({ textSize: s.id })}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.segmentItem, on && styles.segmentOn]}>
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Bible translation">
        {appConfig.translations.map((t) => {
          const on = prefs.translation === t.code;
          return (
            <Pressable
              key={t.code}
              disabled={!t.available}
              onPress={() => update({ translation: t.code })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: !t.available }}
              style={[styles.option, !t.available && { opacity: 0.55 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>
                  {t.name} <Text style={styles.code}>({t.code})</Text>
                </Text>
                <Text style={styles.optionNote}>{t.available ? t.license : t.license + ' — coming soon'}</Text>
              </View>
              <Ionicons
                name={on ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={on ? colors.sage : colors.creamFaint}
              />
            </Pressable>
          );
        })}
      </Section>

      <Section title={appConfig.premium.productName}>
        <View style={styles.premiumCard}>
          <Text style={styles.premiumTitle}>
            {prefs.premiumPreview ? 'Premium preview is on' : 'Personal Bible study'}
          </Text>
          <Text style={styles.optionNote}>
            {appConfig.premium.priceMonthly}/month or {appConfig.premium.priceYearly}/year after a{' '}
            {appConfig.premium.trialDays}-day free trial. Scripture, explanations, and Gospel content are always free.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.optionTitle}>Premium preview (prototype)</Text>
            <Switch
              value={prefs.premiumPreview}
              onValueChange={(v) => update({ premiumPreview: v })}
              trackColor={{ true: colors.sageDeep, false: colors.moss }}
              thumbColor={colors.cream}
              accessibilityLabel="Premium preview"
            />
          </View>
        </View>
      </Section>

      <Section title="Privacy">
        <Text style={styles.optionNote}>
          Saved cards, preferences, and Go Deeper conversations are stored only on this device in this preview.
          Shared cards never include your personal study conversations.
        </Text>
        <Row
          icon="trash-outline"
          label={`Clear saved cards (${saved.length})`}
          onPress={() => {
            saved.forEach((s) => remove(s.cardId));
            toast('Saved cards cleared');
          }}
        />
        <Row
          icon="chatbubbles-outline"
          label="Delete study conversations"
          onPress={() => {
            writeJSON('study.v1', {});
            toast('Study conversations deleted');
          }}
        />
      </Section>

      <Section title="About">
        <Text style={styles.optionNote}>
          Scripture quotations are from the World English Bible (public domain), verified against bible-api.com.
          Photography from Unsplash, used under the Unsplash License.
        </Text>
        <Row icon="construct-outline" label="Content studio" onPress={() => router.push('/studio')} />
        <Row icon="refresh-outline" label="Show welcome again" onPress={() => { reset(); router.replace('/welcome'); }} />
        <Text style={[styles.sectionTitle, { marginTop: space.xl }]}>Photo credits</Text>
        {credits.map(([key, img]) => (
          <Pressable key={key} onPress={() => img.sourceUrl && Linking.openURL(img.sourceUrl)} accessibilityRole="link">
            <Text style={styles.credit}>
              {img.author} · <Text style={{ color: colors.creamFaint }}>{img.license}</Text>
            </Text>
          </Pressable>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={[styles.optionNote, { marginBottom: space.md }]}>{note}</Text> : null}
      {children}
    </View>
  );
}

function Row({ icon, label, onPress }: { icon: 'trash-outline' | 'chatbubbles-outline' | 'construct-outline' | 'refresh-outline'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <Ionicons name={icon} size={18} color={colors.sage} />
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.creamFaint} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { paddingHorizontal: space.gutter, paddingBottom: 64 },
  title: { color: colors.cream, fontFamily: fonts.question, fontSize: 34, letterSpacing: -0.5 },
  sub: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  section: { marginTop: space.xxl },
  sectionTitle: {
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
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipOn: { backgroundColor: 'rgba(168,195,160,0.2)', borderColor: colors.sage },
  chipText: { color: colors.creamMuted, fontFamily: fonts.bodyMedium, fontSize: 13 },
  chipTextOn: { color: colors.cream },
  segment: { flexDirection: 'row', backgroundColor: colors.forest, borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentOn: { backgroundColor: colors.moss },
  segmentText: { color: colors.creamFaint, fontFamily: fonts.bodyMedium, fontSize: 14 },
  segmentTextOn: { color: colors.cream },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  optionTitle: { color: colors.cream, fontFamily: fonts.bodyMedium, fontSize: 15 },
  code: { color: colors.creamFaint, fontFamily: fonts.body },
  optionNote: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginTop: 2 },
  premiumCard: {
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(227,207,164,0.25)',
  },
  premiumTitle: { color: colors.gold, fontFamily: fonts.display, fontSize: 19, marginBottom: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowText: { color: colors.cream, fontFamily: fonts.body, fontSize: 15 },
  credit: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 20 },
});
