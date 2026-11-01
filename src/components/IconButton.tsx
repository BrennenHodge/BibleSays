import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  color?: string;
  variant?: 'glass' | 'plain';
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  label,
  onPress,
  size = 22,
  color = colors.cream,
  variant = 'glass',
  selected,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={6}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.base,
        variant === 'glass' && styles.glass,
        (hovered || pressed) && styles.active,
        pressed && { transform: [{ scale: 0.94 }] },
        style,
      ]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    backgroundColor: 'rgba(244, 239, 230, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  active: { backgroundColor: 'rgba(244, 239, 230, 0.16)' },
});
