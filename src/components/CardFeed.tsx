import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { Card } from '@/content/types';
import { shareCard } from '@/services/share';
import { useSaved } from '@/state/saved';
import { colors } from '@/theme/tokens';

import { BibleCard } from './BibleCard';
import { prefetchCardImages } from './CardImage';
import { useToast } from './Toast';

type Page =
  | { kind: 'cover'; key: string }
  | { kind: 'card'; key: string; card: Card }
  | { kind: 'end'; key: string };

interface Props {
  cards: Card[];
  /** Optional first page (e.g. a topic landing view), rendered at full page size. */
  renderCover?: (size: { width: number; height: number }) => ReactNode;
  /** Optional last page. */
  renderEnd?: (size: { width: number; height: number }) => ReactNode;
  topInset?: number;
  onActiveIndexChange?: (index: number) => void;
}

/**
 * Full-screen vertical pager. Swipe/scroll up and down only — there is no
 * horizontal navigation anywhere in the feed. Keyboard: ↑/↓, PageUp/PageDown, j/k.
 */
export function CardFeed({ cards, renderCover, renderEnd, topInset = 64, onActiveIndexChange }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { isSaved, toggle } = useSaved();
  const listRef = useRef<FlatList<Page>>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const pages = useMemo<Page[]>(() => {
    const out: Page[] = [];
    if (renderCover) out.push({ kind: 'cover', key: 'cover' });
    for (const card of cards) out.push({ kind: 'card', key: card.id, card });
    if (renderEnd) out.push({ kind: 'end', key: 'end' });
    return out;
  }, [cards, renderCover, renderEnd]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) {
      setSize({ width, height });
      // Keep the current card aligned after a resize (e.g. browser window change).
      requestAnimationFrame(() =>
        listRef.current?.scrollToOffset({ offset: activeRef.current * height, animated: false }),
      );
    }
  };

  const setActiveIndex = useCallback(
    (index: number) => {
      if (index === activeRef.current) return;
      activeRef.current = index;
      setActive(index);
      onActiveIndexChange?.(index);
      const upcoming = pages
        .slice(index + 1, index + 3)
        .flatMap((p) => (p.kind === 'card' ? [p.card.image.key] : []));
      if (size.width) prefetchCardImages(upcoming, size.width, size.height * 0.7);
    },
    [pages, size, onActiveIndexChange],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!size.height) return;
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.y / size.height));
  };

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, index));
      listRef.current?.scrollToOffset({ offset: clamped * size.height, animated: true });
    },
    [pages.length, size.height],
  );

  // Web keyboard navigation, attached only while this screen is focused.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return;
      const onKey = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && /input|textarea|select/i.test(target.tagName)) return;
        if (['ArrowDown', 'PageDown', 'j'].includes(e.key)) {
          e.preventDefault();
          goTo(activeRef.current + 1);
        } else if (['ArrowUp', 'PageUp', 'k'].includes(e.key)) {
          e.preventDefault();
          goTo(activeRef.current - 1);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [goTo]),
  );

  const onToggleSave = useCallback(
    (card: Card) => toast(toggle(card.id) ? 'Saved' : 'Removed from saved'),
    [toggle, toast],
  );
  const onShare = useCallback(
    async (card: Card) => {
      const result = await shareCard(card);
      if (result === 'copied') toast('Card copied to clipboard');
      if (result === 'failed') toast('Sharing isn’t available here');
    },
    [toast],
  );
  const onGoDeeper = useCallback(
    (card: Card) => router.push({ pathname: '/deeper/[id]', params: { id: card.id } }),
    [router],
  );
  const onOpenTopic = useCallback(
    (topicId: string) => router.push({ pathname: '/topic/[id]', params: { id: topicId } }),
    [router],
  );

  const renderItem = ({ item, index }: { item: Page; index: number }) => {
    if (item.kind === 'cover') return <View style={size}>{renderCover?.(size)}</View>;
    if (item.kind === 'end') return <View style={size}>{renderEnd?.(size)}</View>;
    return (
      <BibleCard
        card={item.card}
        width={size.width}
        height={size.height}
        active={Math.abs(index - active) <= 0}
        saved={isSaved(item.card.id)}
        topInset={topInset}
        onToggleSave={onToggleSave}
        onShare={onShare}
        onGoDeeper={onGoDeeper}
        onOpenTopic={onOpenTopic}
      />
    );
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      {size.height > 0 ? (
        <FlatList
          ref={listRef}
          data={pages}
          keyExtractor={(p) => p.key}
          renderItem={renderItem}
          extraData={{ active, isSaved, size }}
          pagingEnabled
          snapToInterval={Platform.OS === 'web' ? undefined : size.height}
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
          getItemLayout={(_, index) => ({ length: size.height, offset: size.height * index, index })}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          {...(Platform.OS === 'web' ? ({ dataSet: { feed: 'true' } } as object) : {})}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
});
