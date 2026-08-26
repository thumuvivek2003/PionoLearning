import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ProgressProvider } from '@/features/curriculum';
import { LessonsProvider } from '@/features/lessons';
import { PracticeClockProvider } from '@/features/practice-kit';
import { SettingsProvider } from '@/features/settings';
import { StatisticsProvider } from '@/features/statistics';

/** One place to add cross-cutting providers. Order matters: outermost first. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <StatisticsProvider>
          <LessonsProvider>
            <ProgressProvider>
              <PracticeClockProvider>{children}</PracticeClockProvider>
            </ProgressProvider>
          </LessonsProvider>
        </StatisticsProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
