import { useMemo } from 'react';
import { AppShell } from '@/components/layout';
import { Card, EmptyState } from '@/components/ui';
import {
  formatAccuracy,
  formatDuration,
  sessionsByModule,
  summarise,
  useStatistics,
  weakestItems,
} from '@/features/statistics';
import { DEFAULT_MODULE_ID, getModule } from '@/modules/registry';
import { StatCard } from './StatCard';
import styles from './pages.module.css';

export function StatisticsPage() {
  const { sessions } = useStatistics();

  const summary = useMemo(() => summarise(sessions), [sessions]);
  const weakest = useMemo(() => weakestItems(sessions), [sessions]);
  const byModule = useMemo(() => sessionsByModule(sessions), [sessions]);

  return (
    <AppShell
      title="Statistics"
      subtitle="Everything is stored locally in your browser"
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <div className={styles.grid4}>
        <StatCard
          label="Items shown"
          value={String(summary.itemsShown)}
          icon="music-note"
          tone="accent"
          hint={`${summary.sessions} sessions`}
        />
        <StatCard
          label="Practice time"
          value={formatDuration(summary.practiceMs)}
          icon="clock"
          hint="Time with a run active"
        />
        <StatCard
          label="Accuracy"
          value={formatAccuracy(summary.accuracy)}
          icon="test"
          tone={summary.accuracy !== null && summary.accuracy >= 0.8 ? 'success' : 'default'}
          hint={`${summary.correct} correct · ${summary.wrong} wrong`}
        />
        <StatCard
          label="Avg. response"
          value={
            summary.averageResponseMs === null
              ? '—'
              : `${(summary.averageResponseMs / 1000).toFixed(1)}s`
          }
          icon="stats"
          hint="Test mode only"
        />
      </div>

      <div className={styles.grid2}>
        <Card title="Needs work" bare>
          {weakest.length === 0 ? (
            <EmptyState
              icon="test"
              title="Nothing graded yet"
              description="Run a Test-mode session and grade yourself to build this list."
            />
          ) : (
            <div className={styles.rows}>
              {weakest.map((item) => (
                <div key={item.itemId} className={styles.row}>
                  <span className={styles.rowTitle}>
                    <span className={styles.rowName}>{item.itemLabel}</span>
                    <span className={styles.rowMeta}>
                      {item.correct} correct · {item.wrong} wrong
                    </span>
                  </span>
                  <span style={{ gridColumn: 'span 3' }}>
                    <span className={styles.meter}>
                      <span
                        className={`${styles.meterFill} ${item.accuracy < 0.6 ? styles.meterFillWarn : ''}`}
                        style={{ width: `${Math.round(item.accuracy * 100)}%` }}
                      />
                    </span>
                  </span>
                  <span className={styles.numeric}>{formatAccuracy(item.accuracy)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="By trainer" bare>
          {byModule.size === 0 ? (
            <EmptyState icon="stats" title="No data yet" description="Complete a session first." />
          ) : (
            <div className={styles.rows}>
              {[...byModule.entries()].map(([moduleId, moduleSessions]) => {
                const moduleSummary = summarise(moduleSessions);
                return (
                  <div key={moduleId} className={styles.row}>
                    <span className={styles.rowTitle}>
                      <span className={styles.rowName}>
                        {getModule(moduleId)?.title ?? moduleId}
                      </span>
                      <span className={styles.rowMeta}>{moduleSessions.length} sessions</span>
                    </span>
                    <span className={styles.numeric}>{moduleSummary.itemsShown}</span>
                    <span className={styles.numeric}>
                      {formatDuration(moduleSummary.practiceMs)}
                    </span>
                    <span className={styles.numeric}>
                      {formatAccuracy(moduleSummary.accuracy)}
                    </span>
                    <span />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
