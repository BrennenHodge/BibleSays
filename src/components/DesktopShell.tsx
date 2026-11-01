import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { appConfig } from '@/config/app';
import { getImage, getPrimaryTopics, hashtag, imageUrl } from '@/content/repository';
import { colors, fonts, phoneFrame, radius, space } from '@/theme/tokens';

/**
 * On phones the app is fully immersive. On wider screens it renders inside an
 * elegant, centered phone-sized viewport, with navigation panels on large screens.
 */
export function DesktopShell({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web' || width < phoneFrame.breakpoint) {
    return <View style={styles.fill}>{children}</View>;
  }

  const frameHeight = Math.min(phoneFrame.maxHeight, height - 48);
  const showPanels = width >= phoneFrame.sidePanels;
  const ambient = getImage('welcome');

  return (
    <View style={styles.desktop}>
      {ambient ? (
        <Image
          source={{ uri: imageUrl(ambient, 800, 600, 50) }}
          blurRadius={60}
          contentFit="cover"
          style={[StyleSheet.absoluteFill, { opacity: 0.28 }]}
          accessible={false}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(7,11,9,0.6)', 'rgba(7,11,9,0.92)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.row}>
        {showPanels ? <LeftPanel height={frameHeight} /> : null}
        <View style={[styles.frame, { width: phoneFrame.width, height: frameHeight }]}>{children}</View>
        {showPanels ? <RightPanel height={frameHeight} /> : null}
      </View>
    </View>
  );
}

type IconName = ComponentProps<typeof Ionicons>['name'];

const NAV: { label: string; href: string; icon: IconName; match: (p: string) => boolean }[] = [
  { label: 'Discover', href: '/', icon: 'albums-outline', match: (p) => p === '/' },
  { label: 'Explore', href: '/explore', icon: 'search-outline', match: (p) => p.startsWith('/explore') || p.startsWith('/topic') },
  { label: 'Saved', href: '/saved', icon: 'bookmark-outline', match: (p) => p.startsWith('/saved') },
  { label: 'Profile', href: '/profile', icon: 'person-outline', match: (p) => p.startsWith('/profile') },
];

function LeftPanel({ height }: { height: number }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <View style={[styles.panel, styles.leftPanel, { height }]}>
      <Text style={styles.brand}>{appConfig.appName}</Text>
      <Text style={styles.tagline}>{appConfig.tagline}</Text>
      <View style={styles.nav}>
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.navigate(item.href as never)}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.navItem,
                active && styles.navItemActive,
                hovered && !active && styles.navItemHover,
              ]}>
              <Ionicons name={item.icon} size={19} color={active ? colors.cream : colors.creamFaint} />
              <Text style={[styles.navText, active && { color: colors.cream }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Scroll, swipe, or use ↑ ↓ to move between cards.
        </Text>
      </View>
    </View>
  );
}

function RightPanel({ height }: { height: number }) {
  const router = useRouter();
  return (
    <ScrollView style={[styles.panel, { height }]} contentContainerStyle={styles.rightContent}>
      <Text style={styles.panelTitle}>Topics</Text>
      <View style={styles.chips}>
        {getPrimaryTopics().map((t) => (
          <Pressable
            key={t.id}
            onPress={() => router.push({ pathname: '/topic/[id]', params: { id: t.id } })}
            accessibilityRole="link"
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.chip, hovered && styles.chipHover]}>
            <Text style={styles.chipText}>{hashtag(t.id)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.panelTitle, { marginTop: space.xxl }]}>About this preview</Text>
      <Text style={styles.body}>
        Every card pairs a real-life question with a verified Bible passage and one short, honest
        explanation. Scripture is quoted from the {appConfig.translations[0].name} (public domain) while
        licensing for the NLT is arranged.
      </Text>
      <Pressable onPress={() => router.push('/studio')} accessibilityRole="link" style={styles.linkRow}>
        <Ionicons name="construct-outline" size={15} color={colors.sage} />
        <Text style={styles.link}>Content studio</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.night },
  desktop: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 48 },
  frame: {
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: colors.night,
    borderWidth: 1,
    borderColor: 'rgba(244,239,230,0.1)',
    boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 10px rgba(244,239,230,0.03)',
  },
  panel: { width: 260 },
  leftPanel: { justifyContent: 'center' },
  brand: { color: colors.cream, fontFamily: fonts.question, fontSize: 34, letterSpacing: -0.5 },
  tagline: {
    color: colors.creamMuted,
    fontFamily: fonts.displayItalic,
    fontSize: 21,
    lineHeight: 28,
    marginTop: space.md,
  },
  nav: { marginTop: 40, gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  navItemActive: { backgroundColor: 'rgba(244,239,230,0.08)' },
  navItemHover: { backgroundColor: 'rgba(244,239,230,0.04)' },
  navText: { color: colors.creamFaint, fontFamily: fonts.bodyMedium, fontSize: 15 },
  hint: { marginTop: 40, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.hairline },
  hintText: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  rightContent: { paddingVertical: 40, justifyContent: 'center', flexGrow: 1 },
  panelTitle: {
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
    borderWidth: 1,
    borderColor: 'rgba(168,195,160,0.3)',
  },
  chipHover: { backgroundColor: 'rgba(168,195,160,0.12)' },
  chipText: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 13 },
  body: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.lg },
  link: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 13.5 },
});
