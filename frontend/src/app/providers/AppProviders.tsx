import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LessonsProvider } from '@/features/lessons';
import { SettingsProvider } from '@/features/settings';
import { StatisticsProvider } from '@/features/statistics';

/** One place to add cross-cutting providers. Order matters: outermost first. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <StatisticsProvider>
          <LessonsProvider>{children}</LessonsProvider>
        </StatisticsProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
