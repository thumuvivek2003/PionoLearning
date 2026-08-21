import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import { DEFAULT_SETTINGS } from './settings.types';
import type { AppSettings } from './settings.types';

interface SettingsContextValue {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored, resetStored] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS,
  );

  // Merge forward so a settings key added in a later version still gets a value.
  const settings = useMemo<AppSettings>(() => ({ ...DEFAULT_SETTINGS, ...stored }), [stored]);

  const update = useCallback<SettingsContextValue['update']>(
    (key, value) => setStored((current) => ({ ...DEFAULT_SETTINGS, ...current, [key]: value })),
    [setStored],
  );

  // The theme lives on <html> so tokens.css can drive the whole document.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;
  }, [settings.accent, settings.theme]);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, update, reset: resetStored }),
    [resetStored, settings, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside <SettingsProvider>');
  return context;
}
