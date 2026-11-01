import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardImage } from '@/components/CardImage';
import { IconButton } from '@/components/IconButton';
import { appConfig } from '@/config/app';
import { getCard, hashtag, scriptureReference, scriptureText } from '@/content/repository';
import { prototypeStudyProvider } from '@/services/study/prototype';
import { abuseMessage, careNote, crisisMessage, detectRisk } from '@/services/study/safety';
import { STUDY_PROMPTS, type StudyBlock, type StudyMessage, type StudyPromptId } from '@/services/study/types';
import { usePrefs, useTranslation } from '@/state/prefs';
import { readJSON, writeJSON } from '@/state/storage';
import { colors, fonts, radius, space } from '@/theme/tokens';

const STORE = 'study.v1';
let nextId = 0;
const uid = () => `${Date.now()}-${nextId++}`;

export default function GoDeeperScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, update } = usePrefs();
  const translation = useTranslation();
  const card = getCard(id);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [width, setWidth] = useState(400);
  const premium = prefs.premiumPreview;

  // Restore this card's private study history (stored on-device only).
  useEffect(() => {
    if (!card || !premium) return;
    readJSON<Record<string, StudyMessage[]>>(STORE, {}).then((all) => setMessages(all[card.id] ?? []));
  }, [card, premium]);

  const persist = (next: StudyMessage[]) => {
    if (!card) return;
    readJSON<Record<string, StudyMessage[]>>(STORE, {}).then((all) => writeJSON(STORE, { ...all, [card.id]: next }));
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!card) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.body}>This card isn’t available.</Text>
      </View>
    );
  }

  const ask = async (text: string, promptId?: StudyPromptId) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    // Safety always comes first and is never behind the paywall.
    const risk = detectRisk(trimmed);
    if (!premium && !risk) {
      setPaywall(true);
      return;
    }

    const userMsg: StudyMessage = { id: uid(), role: 'user', text: trimmed };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setDraft('');
    setThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    const blocks: StudyBlock[] = risk
      ? [{ type: 'care', text: risk === 'crisis' ? crisisMessage() : abuseMessage() }]
      : await prototypeStudyProvider.respond(card, { promptId, text: trimmed, translation }, withUser);

    const next = [...withUser, { id: uid(), role: 'assistant' as const, blocks }];
    setMessages(next);
    setThinking(false);
    if (premium && !risk) persist(next);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // After a safety response, don't immediately push more study prompts.
  const last = messages[messages.length - 1];
  const lastWasCare = last?.role === 'assistant' && last.blocks?.every((b) => b.type === 'care');

  const fullPassageUrl = card.scripture.fullPassage
    ? `https://www.biblegateway.com/passage/?search=${encodeURIComponent(card.scripture.fullPassage)}&version=${translation}`
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="chevron-down" label="Close Go Deeper" onPress={close} variant="plain" />
        <Text style={styles.headerTitle}>Go Deeper</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PROTOTYPE</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <CardImage imageKey={card.image.key} alt={card.image.alt} width={width} height={170} />
          <LinearGradient colors={['rgba(11,18,15,0.1)', colors.night]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroText}>
            <Text style={styles.heroTag}>{hashtag(card.primaryTopic)}</Text>
            <Text style={styles.heroQuestion}>{card.question}</Text>
          </View>
        </View>

        <View style={styles.pad}>
          <Text selectable style={styles.verse}>
            {scriptureText(card, translation)}
          </Text>
          <Text style={styles.reference}>
            {scriptureReference(card).toUpperCase()} · {translation}
          </Text>
          {fullPassageUrl ? (
            <Pressable onPress={() => Linking.openURL(fullPassageUrl)} accessibilityRole="link" style={styles.linkRow}>
              <Ionicons name="book-outline" size={15} color={colors.sage} />
              <Text style={styles.link}>Read the full passage · {card.scripture.fullPassage}</Text>
            </Pressable>
          ) : null}

          <Text selectable style={[styles.body, { marginTop: space.lg }]}>
            {card.explanation}
          </Text>

          {card.study?.context ? (
            <View style={styles.background}>
              <Text style={styles.kicker}>Background</Text>
              <Text selectable style={styles.body}>
                {card.study.context}
              </Text>
            </View>
          ) : null}

          {card.care ? (
            <View style={styles.care}>
              <Ionicons name="heart-outline" size={16} color={colors.gold} />
              <Text style={styles.careText}>{careNote(card.care)}</Text>
            </View>
          ) : null}

          <View style={styles.studyHead}>
            <Text style={styles.studyTitle}>Personal study</Text>
            {!premium ? (
              <View style={styles.premiumPill}>
                <Ionicons name="lock-closed" size={11} color={colors.gold} />
                <Text style={styles.premiumPillText}>PREMIUM</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.studyNote}>
            Ask about your own situation. Answers stay grounded in Scripture and clearly mark what is
            interpretation.
          </Text>

          {messages.length === 0 ? (
            <View style={styles.prompts}>
              {STUDY_PROMPTS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => ask(p.label, p.id)}
                  accessibilityRole="button"
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                    styles.prompt,
                    (pressed || hovered) && { backgroundColor: 'rgba(168,195,160,0.12)' },
                  ]}>
                  <Text style={styles.promptText}>{p.label}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.sage} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {messages.map((m) =>
            m.role === 'user' ? (
              <View key={m.id} style={styles.userBubble}>
                <Text style={styles.userText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={styles.answer}>
                {m.blocks?.map((b, i) => <Block key={i} block={b} />)}
              </View>
            ),
          )}
          {thinking ? <Text style={styles.thinking}>Searching the Scriptures…</Text> : null}

          {messages.length > 0 && !thinking && !lastWasCare ? (
            <View style={[styles.prompts, { marginTop: space.lg }]}>
              {STUDY_PROMPTS.filter((p) => !messages.some((m) => m.text === p.label)).slice(0, 3).map((p) => (
                <Pressable key={p.id} onPress={() => ask(p.label, p.id)} style={styles.followUp} accessibilityRole="button">
                  <Text style={styles.followUpText}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask about your situation…"
          placeholderTextColor={colors.creamFaint}
          style={styles.input}
          multiline
          onSubmitEditing={() => ask(draft)}
          blurOnSubmit
          accessibilityLabel="Ask a question about this card"
        />
        <IconButton
          icon="arrow-up"
          label="Send"
          onPress={() => ask(draft)}
          color={colors.night}
          style={[styles.send, !draft.trim() && { opacity: 0.4 }]}
        />
      </View>

      {paywall ? (
        <Paywall
          onClose={() => setPaywall(false)}
          onStart={() => {
            update({ premiumPreview: true });
            setPaywall(false);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Block({ block }: { block: StudyBlock }) {
  switch (block.type) {
    case 'scripture':
      return (
        <View style={styles.bScripture}>
          <Text style={styles.bLabel}>SCRIPTURE · {block.reference.toUpperCase()} ({block.translation})</Text>
          <Text selectable style={styles.bVerse}>
            {block.text}
          </Text>
          {block.note ? <Text style={styles.bNote}>{block.note}</Text> : null}
        </View>
      );
    case 'interpretation':
    case 'application':
      return (
        <View style={styles.bText}>
          <Text style={styles.bLabel}>{block.type === 'interpretation' ? 'INTERPRETATION' : 'APPLICATION'}</Text>
          <Text selectable style={styles.body}>
            {block.text}
          </Text>
        </View>
      );
    case 'reflection':
      return (
        <View style={styles.bText}>
          <Text style={styles.bLabel}>REFLECT</Text>
          <Text style={[styles.body, { fontFamily: fonts.displayItalic, fontSize: 19.5, lineHeight: 26, color: colors.cream }]}>
            {block.text}
          </Text>
        </View>
      );
    case 'prayer':
      return (
        <View style={styles.bText}>
          <Text style={styles.bLabel}>A PRAYER</Text>
          <Text style={[styles.body, { fontFamily: fonts.displayItalic, fontSize: 19.5, lineHeight: 26, color: colors.cream }]}>
            {block.text}
          </Text>
        </View>
      );
    case 'care':
      return (
        <View style={styles.care}>
          <Ionicons name="heart" size={16} color={colors.gold} />
          <Text style={styles.careText}>{block.text}</Text>
        </View>
      );
    case 'notice':
      return <Text style={styles.notice}>{block.text}</Text>;
  }
}

function Paywall({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const p = appConfig.premium;
  return (
    <View style={styles.paywallBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.paywall} accessibilityViewIsModal>
        <Text style={styles.paywallKicker}>{p.productName.toUpperCase()} PREMIUM</Text>
        <Text style={styles.paywallTitle}>Study this card with a personal guide.</Text>
        {p.features.map((f) => (
          <View key={f} style={styles.feature}>
            <Ionicons name="checkmark" size={17} color={colors.sage} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
        <Text style={styles.paywallFree}>
          Every card, verse, and explanation stays free. Always.
        </Text>
        <Pressable onPress={onStart} style={styles.paywallCta} accessibilityRole="button">
          <Text style={styles.paywallCtaText}>Start {p.trialDays}-day free trial</Text>
        </Pressable>
        <Text style={styles.paywallPrice}>
          Then {p.priceMonthly}/month or {p.priceYearly}/year · Prototype — no payment is taken
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" style={{ alignSelf: 'center', padding: 10 }}>
          <Text style={styles.notNow}>Not now</Text>
        </Pressable>
      </View>
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
  headerTitle: { color: colors.cream, fontFamily: fonts.bodySemi, fontSize: 16, flex: 1 },
  badge: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: space.md,
  },
  badgeText: { color: colors.creamFaint, fontFamily: fonts.bodySemi, fontSize: 9.5, letterSpacing: 1 },
  scroll: { paddingBottom: 40 },
  hero: { height: 170, justifyContent: 'flex-end' },
  heroText: { position: 'absolute', left: space.gutter, right: space.gutter, bottom: 6 },
  heroTag: { color: colors.sage, fontFamily: fonts.bodySemi, fontSize: 12.5 },
  heroQuestion: { color: colors.cream, fontFamily: fonts.question, fontSize: 23, lineHeight: 27, marginTop: 4 },
  pad: { paddingHorizontal: space.gutter, paddingTop: space.lg },
  verse: { color: colors.gold, fontFamily: fonts.scripture, fontSize: 21, lineHeight: 28 },
  reference: { color: colors.creamFaint, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, marginTop: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  link: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 13 },
  body: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  background: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  kicker: {
    color: colors.creamFaint,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  care: {
    flexDirection: 'row',
    gap: 10,
    marginTop: space.lg,
    padding: space.md + 2,
    borderRadius: radius.md,
    backgroundColor: 'rgba(227,207,164,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(227,207,164,0.3)',
  },
  careText: { flex: 1, color: colors.creamMuted, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20 },
  studyHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.xxl },
  studyTitle: { color: colors.cream, fontFamily: fonts.question, fontSize: 22 },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(227,207,164,0.12)',
  },
  premiumPillText: { color: colors.gold, fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1 },
  studyNote: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  prompts: { marginTop: space.md, gap: 8 },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,195,160,0.4)',
  },
  promptText: { color: colors.cream, fontFamily: fonts.bodyMedium, fontSize: 14.5, flex: 1 },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors.moss,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: space.xl,
  },
  userText: { color: colors.cream, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21 },
  answer: { marginTop: space.lg, gap: space.lg },
  bScripture: { borderLeftWidth: 2, borderLeftColor: 'rgba(227,207,164,0.6)', paddingLeft: 14 },
  bVerse: { color: colors.gold, fontFamily: fonts.scripture, fontSize: 19, lineHeight: 26, marginTop: 4 },
  bNote: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  bText: {},
  bLabel: { color: colors.creamFaint, fontFamily: fonts.bodySemi, fontSize: 10.5, letterSpacing: 1.2, marginBottom: 4 },
  notice: {
    color: colors.creamFaint,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  thinking: { color: colors.creamFaint, fontFamily: fonts.displayItalic, fontSize: 17, marginTop: space.lg },
  followUp: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(168,195,160,0.1)',
  },
  followUpText: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    backgroundColor: colors.night,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.forest,
    color: colors.cream,
    fontFamily: fonts.body,
    fontSize: 15,
    outlineStyle: 'none',
  } as object,
  send: { backgroundColor: colors.cream, borderWidth: 0 },
  paywallBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  paywall: {
    backgroundColor: colors.forest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: space.xl,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: 'rgba(227,207,164,0.25)',
  },
  paywallKicker: { color: colors.gold, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.4 },
  paywallTitle: {
    color: colors.cream,
    fontFamily: fonts.question,
    fontSize: 26,
    lineHeight: 31,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  feature: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  featureText: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20, flex: 1 },
  paywallFree: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 13.5, marginTop: space.sm },
  paywallCta: {
    marginTop: space.xl,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallCtaText: { color: colors.night, fontFamily: fonts.bodySemi, fontSize: 16 },
  paywallPrice: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 12, textAlign: 'center', marginTop: 10 },
  notNow: { color: colors.creamMuted, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
