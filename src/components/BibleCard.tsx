import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { hashtag, scriptureReference, scriptureText } from '@/content/repository';
import type { Card } from '@/content/types';
import { useTextScale, useTranslation } from '@/state/prefs';
import { colors, fonts, radius, space } from '@/theme/tokens';

import { CardImage } from './CardImage';
import { IconButton } from './IconButton';

export interface BibleCardProps {
  card: Card;
  width: number;
  height: number;
  active?: boolean;
  saved: boolean;
  /** Space reserved at the top for overlaid chrome (back button, search). */
  topInset?: number;
  onToggleSave: (card: Card) => void;
  onShare: (card: Card) => void;
  onGoDeeper: (card: Card) => void;
  onOpenTopic: (topicId: string) => void;
}

/**
 * The core experience. Exact order: primary hashtag → question → divider →
 * Scripture (+ reference & translation) → explanation → related hashtags → actions.
 * No section labels — hierarchy is carried by typography alone.
 */
function BibleCardBase({
  card,
  width,
  height,
  active = true,
  saved,
  topInset = 64,
  onToggleSave,
  onShare,
  onGoDeeper,
  onOpenTopic,
}: BibleCardProps) {
  const s = useTextScale();
  const translation = useTranslation();
  const compactHeight = height < 700;
  // Clamping is remembered per size/text-scale, so a resize re-measures from scratch.
  const sizeKey = `${width}x${height}@${s}`;
  const [clampedFor, setClampedFor] = useState<string | null>(null);
  const clamped = clampedFor === sizeKey;
  const [expanded, setExpanded] = useState(false);
  const [reveal] = useState(() => new Animated.Value(active ? 1 : 0));
  const hasRevealed = useRef(active);

  useEffect(() => {
    if (!active || hasRevealed.current) return;
    hasRevealed.current = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) reveal.setValue(1);
      else Animated.timing(reveal, { toValue: 1, duration: 520, useNativeDriver: true }).start();
    });
  }, [active, reveal]);

  const [contentHeight, setContentHeight] = useState(0);
  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setContentHeight(h);
    const available = height - topInset - 8;
    if (!clamped && h > available) setClampedFor(sizeKey);
  };

  // The image fills the space above the text (plus a soft overlap), so its subject
  // stays visible instead of sitting behind the question.
  const imageHeight = Math.round(
    contentHeight
      ? Math.min(height * 0.74, Math.max(height * 0.42, height - contentHeight + 150))
      : height * 0.6,
  );
  const questionSize = (compactHeight ? 27 : 31) * s;
  const verseSize = (compactHeight ? 19.5 : 21.5) * s;
  const bodySize = (compactHeight ? 14.5 : 15.5) * s;
  const relatedTags = card.tags.filter((t) => t !== card.primaryTopic).slice(0, 4);
  const reference = scriptureReference(card);

  return (
    <View
      style={[styles.card, { width, height }]}
      accessibilityLabel={card.question}
      accessible={false}>
      <CardImage
        imageKey={card.image.key}
        alt={card.image.alt}
        width={width}
        height={imageHeight}
        sourceHeight={height * 0.7}
        priority={active ? 'high' : 'normal'}
        style={styles.image}
      />
      {/* Top scrim keeps overlaid controls legible; main gradient blends image into the card. */}
      <LinearGradient
        colors={['rgba(7,11,9,0.55)', 'rgba(7,11,9,0)']}
        style={[styles.topScrim, { height: topInset + 48 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(11,18,15,0)', 'rgba(11,18,15,0.35)', 'rgba(11,18,15,0.88)', colors.night]}
        locations={[0, 0.4, 0.75, 0.97]}
        style={[styles.mainGradient, { height: imageHeight + 2 }]}
        pointerEvents="none"
      />

      <Animated.View
        onLayout={onContentLayout}
        style={[
          styles.content,
          {
            opacity: reveal,
            transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          },
        ]}>
        <Pressable
          onPress={() => onOpenTopic(card.primaryTopic)}
          accessibilityRole="link"
          accessibilityLabel={`Open topic ${hashtag(card.primaryTopic)}`}
          hitSlop={8}
          style={styles.primaryTagWrap}>
          <Text style={[styles.primaryTag, { fontSize: 13 * s }]}>{hashtag(card.primaryTopic)}</Text>
        </Pressable>

        <Text
          accessibilityRole="header"
          style={[styles.question, { fontSize: questionSize, lineHeight: questionSize * 1.14 }]}>
          {card.question}
        </Text>

        <LinearGradient
          colors={['rgba(227,207,164,0.75)', 'rgba(227,207,164,0.12)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.divider}
        />

        <Text
          selectable
          style={[styles.verse, { fontSize: verseSize, lineHeight: verseSize * 1.34 }]}
          numberOfLines={clamped ? 4 : undefined}>
          {scriptureText(card, translation)}
        </Text>
        <Text
          style={[styles.reference, { fontSize: 11.5 * s }]}
          accessibilityLabel={`${reference}, ${translation}`}>
          {reference.toUpperCase()}
          <Text style={styles.referenceDot}>{'  ·  '}</Text>
          {translation}
        </Text>

        <Text
          selectable
          style={[styles.explanation, { fontSize: bodySize, lineHeight: bodySize * 1.5 }]}
          numberOfLines={clamped ? 3 : undefined}>
          {card.explanation}
        </Text>
        {clamped ? (
          <Pressable onPress={() => setExpanded(true)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.readMore}>Read more</Text>
          </Pressable>
        ) : null}

        <View style={styles.tags}>
          {relatedTags.map((t) => (
            <Pressable
              key={t}
              onPress={() => onOpenTopic(t)}
              accessibilityRole="link"
              accessibilityLabel={`Open topic ${hashtag(t)}`}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.tag,
                (pressed || hovered) && styles.tagActive,
              ]}>
              <Text style={[styles.tagText, { fontSize: 13 * s }]}>{hashtag(t).toLowerCase()}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <IconButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={saved ? 'Remove from saved' : 'Save'}
            selected={saved}
            color={saved ? colors.gold : colors.cream}
            onPress={() => onToggleSave(card)}
          />
          <IconButton icon="share-outline" label="Share" onPress={() => onShare(card)} />
          <Pressable
            onPress={() => onGoDeeper(card)}
            accessibilityRole="button"
            accessibilityLabel="Go Deeper"
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.deeper,
              hovered && { backgroundColor: '#FFFFFF' },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}>
            <Text style={styles.deeperText}>Go Deeper</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.night} />
          </Pressable>
        </View>
      </Animated.View>

      {expanded ? (
        <View style={styles.expanded}>
          <ScrollView contentContainerStyle={[styles.expandedContent, { paddingTop: topInset }]}>
            <Text style={[styles.primaryTag, { fontSize: 13 * s }]}>{hashtag(card.primaryTopic)}</Text>
            <Text style={[styles.question, { fontSize: questionSize, lineHeight: questionSize * 1.14 }]}>
              {card.question}
            </Text>
            <View style={[styles.divider, { backgroundColor: 'rgba(227,207,164,0.5)' }]} />
            <Text selectable style={[styles.verse, { fontSize: verseSize, lineHeight: verseSize * 1.34 }]}>
              {scriptureText(card, translation)}
            </Text>
            <Text style={[styles.reference, { fontSize: 11.5 * s }]}>
              {reference.toUpperCase()}
              {'  ·  '}
              {translation}
            </Text>
            <Text selectable style={[styles.explanation, { fontSize: bodySize, lineHeight: bodySize * 1.5 }]}>
              {card.explanation}
            </Text>
          </ScrollView>
          <IconButton
            icon="close"
            label="Close"
            onPress={() => setExpanded(false)}
            style={[styles.closeExpanded, { top: Math.max(12, topInset - 52) }]}
          />
        </View>
      ) : null}
    </View>
  );
}

export const BibleCard = memo(BibleCardBase);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.night, overflow: 'hidden' },
  image: { position: 'absolute', top: 0, left: 0, right: 0 },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  mainGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.gutter,
    paddingBottom: space.xl,
  },
  primaryTagWrap: { alignSelf: 'flex-start', marginBottom: space.md },
  primaryTag: {
    color: colors.sage,
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.6,
  },
  question: {
    color: colors.cream,
    fontFamily: fonts.question,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  divider: { height: 1, width: '100%', marginTop: 20, marginBottom: 18 },
  verse: { color: colors.gold, fontFamily: fonts.scripture },
  reference: {
    color: colors.creamFaint,
    fontFamily: fonts.bodySemi,
    letterSpacing: 1.3,
    marginTop: 10,
  },
  referenceDot: { color: colors.creamFaint },
  explanation: {
    color: colors.creamMuted,
    fontFamily: fonts.body,
    marginTop: 18,
  },
  readMore: {
    color: colors.sage,
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    marginTop: 6,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: 18 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(168,195,160,0.45)',
    backgroundColor: 'rgba(168,195,160,0.06)',
  },
  tagActive: { backgroundColor: 'rgba(168,195,160,0.18)' },
  tagText: { color: colors.sage, fontFamily: fonts.bodyMedium },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: 22,
  },
  deeper: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  deeperText: { color: colors.night, fontFamily: fonts.bodySemi, fontSize: 15, letterSpacing: 0.2 },
  expanded: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.night,
  },
  expandedContent: { paddingHorizontal: space.gutter, paddingBottom: 48 },
  closeExpanded: { position: 'absolute', right: 16 },
});
