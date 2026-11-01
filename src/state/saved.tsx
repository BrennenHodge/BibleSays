import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { readJSON, writeJSON } from './storage';

export interface SavedEntry {
  cardId: string;
  savedAt: string;
}

const KEY = 'saved.v1';

interface SavedContextValue {
  saved: SavedEntry[];
  isSaved: (cardId: string) => boolean;
  toggle: (cardId: string) => boolean;
  remove: (cardId: string) => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedEntry[]>([]);

  useEffect(() => {
    readJSON<SavedEntry[]>(KEY, []).then(setSaved);
  }, []);

  const persist = useCallback((next: SavedEntry[]) => {
    setSaved(next);
    writeJSON(KEY, next);
  }, []);

  const isSaved = useCallback((id: string) => saved.some((s) => s.cardId === id), [saved]);

  /** Returns the new saved state. */
  const toggle = useCallback(
    (id: string) => {
      if (saved.some((s) => s.cardId === id)) {
        persist(saved.filter((s) => s.cardId !== id));
        return false;
      }
      persist([{ cardId: id, savedAt: new Date().toISOString() }, ...saved]);
      return true;
    },
    [saved, persist],
  );

  const remove = useCallback((id: string) => persist(saved.filter((s) => s.cardId !== id)), [saved, persist]);

  const value = useMemo(() => ({ saved, isSaved, toggle, remove }), [saved, isSaved, toggle, remove]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used inside SavedProvider');
  return ctx;
}
