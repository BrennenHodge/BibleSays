import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme/tokens';

import { IconButton } from './IconButton';

/** Overlaid back control for full-screen feeds. Returns to the previous position. */
export function BackButton({ icon = 'chevron-back' as const }: { icon?: 'chevron-back' | 'close' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { top: insets.top + space.md }]} pointerEvents="box-none">
      <IconButton
        icon={icon}
        label="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, zIndex: 10 },
  button: { backgroundColor: 'rgba(11,18,15,0.45)' },
});
