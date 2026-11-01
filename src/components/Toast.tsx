import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme/tokens';

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      AccessibilityInfo.announceForAccessibility?.(msg);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() =>
          setMessage(null),
        );
      }, 2200);
    },
    [opacity],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <View pointerEvents="none" style={styles.wrap}>
          <Animated.View style={[styles.toast, { opacity }]} accessibilityLiveRegion="polite">
            <Text style={styles.text}>{message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 76, alignItems: 'center', zIndex: 100 },
  toast: {
    backgroundColor: 'rgba(244, 239, 230, 0.96)',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.pill,
    maxWidth: 340,
  },
  text: { color: colors.night, fontFamily: fonts.bodyMedium, fontSize: 14, textAlign: 'center' },
});
