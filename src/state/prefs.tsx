import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { appConfig } from '@/config/app';
import { resolveTranslation } from '@/content/repository';

import { readJSON, writeJSON } from './storage';

export type TextSize = 'small' | 'default' | 'large';

export interface Prefs {
  onboarded: boolean;
  interests: string[];
  textSize: TextSize;
  translation: string;
  /** True once the reader picks a translation themselves (vs. inheriting the default). */
  translationChosen: boolean;
  /** Prototype-only entitlement flag. Replace with real subscription state in Phase 2. */
  premiumPreview: boolean;
}

const DEFAULTS: Prefs = {
  onboarded: false,
  interests: [],
  textSize: 'default',
  translation: appConfig.defaultTranslation,
  translationChosen: false,
  premiumPreview: false,
};

const KEY = 'prefs.v1';

interface PrefsContextValue {
  prefs: Prefs;
  ready: boolean;
  update: (patch: Partial<Prefs>) => void;
  reset: () => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readJSON<Partial<Prefs>>(KEY, {}).then((stored) => {
      const next = { ...DEFAULTS, ...stored };
      // Readers who never chose a translation follow the current default.
      if (!next.translationChosen) next.translation = appConfig.defaultTranslation;
      setPrefs(next);
      setReady(true);
    });
  }, []);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writeJSON(KEY, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPrefs(DEFAULTS);
    writeJSON(KEY, DEFAULTS);
  }, []);

  const value = useMemo(() => ({ prefs, ready, update, reset }), [prefs, ready, update, reset]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}

const SCALE: Record<TextSize, number> = { small: 0.92, default: 1, large: 1.12 };

export function useTextScale() {
  return SCALE[usePrefs().prefs.textSize];
}

/** The reader's Bible translation, guaranteed to be an available one. */
export function useTranslation() {
  return resolveTranslation(usePrefs().prefs.translation);
}
