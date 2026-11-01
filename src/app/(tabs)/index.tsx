import { Redirect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardFeed } from '@/components/CardFeed';
import { FeedEnd } from '@/components/FeedEnd';
import { IconButton } from '@/components/IconButton';
import { appConfig } from '@/config/app';
import { buildDiscoverFeed } from '@/content/feed';
import { usePrefs } from '@/state/prefs';
import { colors, fonts, space } from '@/theme/tokens';

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs } = usePrefs();
  const interestsKey = prefs.interests.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const feed = useMemo(() => buildDiscoverFeed(prefs.interests), [interestsKey]);
  const renderEnd = useCallback(
    (size: { width: number; height: number }) => <FeedEnd {...size} />,
    [],
  );

  if (!prefs.onboarded) return <Redirect href="/welcome" />;

  const topInset = insets.top + 60;

  return (
    <View style={styles.root}>
      <CardFeed cards={feed} renderEnd={renderEnd} topInset={topInset} />
      <View style={[styles.topBar, { paddingTop: insets.top + space.md }]} pointerEvents="box-none">
        <Text style={styles.brand} accessibilityRole="header">
          {appConfig.appName}
        </Text>
        <IconButton
          icon="search-outline"
          label="Search: What does the Bible say about…?"
          onPress={() => router.navigate({ pathname: '/explore', params: { focus: '1' } })}
          size={20}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  brand: {
    color: colors.cream,
    fontFamily: fonts.question,
    fontSize: 21,
    letterSpacing: -0.2,
    marginLeft: space.sm,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 10,
  },
});
