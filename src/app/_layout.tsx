import '@/global.css';

import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DesktopShell } from '@/components/DesktopShell';
import { ToastProvider } from '@/components/Toast';
import { PrefsProvider, usePrefs } from '@/state/prefs';
import { SavedProvider } from '@/state/saved';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.night, card: colors.night, primary: colors.sage },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <PrefsProvider>
          <SavedProvider>
            <Gate ready={fontsLoaded || !!fontError} />
          </SavedProvider>
        </PrefsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Gate({ ready }: { ready: boolean }) {
  const { ready: prefsReady } = usePrefs();
  const allReady = ready && prefsReady;

  useEffect(() => {
    if (allReady) SplashScreen.hideAsync().catch(() => {});
  }, [allReady]);

  if (!allReady) return null;

  return (
    <DesktopShell>
      <ToastProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.night },
            animation: 'fade_from_bottom',
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="topic/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="card/[slug]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="deeper/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="studio" />
        </Stack>
      </ToastProvider>
    </DesktopShell>
  );
}
