import Ionicons from '@expo/vector-icons/Ionicons';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={StyleSheet.flatten([styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }])}>
        <TabTrigger name="discover" href="/" asChild>
          <TabButton icon="albums-outline" activeIcon="albums" label="Discover" />
        </TabTrigger>
        <TabTrigger name="explore" href="/explore" asChild>
          <TabButton icon="search-outline" activeIcon="search" label="Explore" />
        </TabTrigger>
        <TabTrigger name="saved" href="/saved" asChild>
          <TabButton icon="bookmark-outline" activeIcon="bookmark" label="Saved" />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon="person-outline" activeIcon="person" label="Profile" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps extends TabTriggerSlotProps {
  icon: IconName;
  activeIcon: IconName;
  label: string;
}

function TabButton({ icon, activeIcon, label, isFocused, ref, ...props }: TabButtonProps) {
  return (
    <Pressable
      // expo-router's slot ref type predates RN 0.88's element types; the runtime value is correct.
      ref={ref as never}
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={styles.button}>
      <Ionicons name={isFocused ? activeIcon : icon} size={22} color={isFocused ? colors.cream : colors.creamFaint} />
      <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.night,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: 8,
  },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 },
  label: { color: colors.creamFaint, fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.3 },
  labelActive: { color: colors.cream },
});
