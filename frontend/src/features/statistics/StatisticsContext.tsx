import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MAX_STORED_SESSIONS, STORAGE_KEYS } from '@/lib/constants';
import type { SessionRecord } from './statistics.types';

interface StatisticsContextValue {
  sessions: readonly SessionRecord[];
  record: (session: SessionRecord) => void;
  clear: () => void;
}

const StatisticsContext = createContext<StatisticsContextValue | null>(null);

export function StatisticsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions, clearSessions] = useLocalStorage<SessionRecord[]>(
    STORAGE_KEYS.statistics,
    [],
  );

  const record = useCallback(
    (session: SessionRecord) => {
      // Newest first, capped so localStorage never grows without bound.
      setSessions((current) => [session, ...current].slice(0, MAX_STORED_SESSIONS));
    },
    [setSessions],
  );

  const value = useMemo<StatisticsContextValue>(
    () => ({ sessions, record, clear: clearSessions }),
    [clearSessions, record, sessions],
  );

  return <StatisticsContext.Provider value={value}>{children}</StatisticsContext.Provider>;
}

export function useStatistics(): StatisticsContextValue {
  const context = useContext(StatisticsContext);
  if (!context) throw new Error('useStatistics must be used inside <StatisticsProvider>');
  return context;
}
