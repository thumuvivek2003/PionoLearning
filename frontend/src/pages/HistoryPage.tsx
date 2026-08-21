import { useState } from 'react';
import { AppShell } from '@/components/layout';
import { Button, Card, Chip, EmptyState } from '@/components/ui';
import { formatAccuracy, formatDuration, useStatistics } from '@/features/statistics';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
import styles from './pages.module.css';

function formatWhen(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryPage() {
  const { sessions, clear } = useStatistics();
  const [confirming, setConfirming] = useState(false);

  return (
    <AppShell
      title="History"
      subtitle={`${sessions.length} saved ${sessions.length === 1 ? 'session' : 'sessions'}`}
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <Card
        title="Practice sessions"
        bare
        action={
          sessions.length > 0 &&
          (confirming ? (
            <span style={{ display: 'flex', gap: 8 }}>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  clear();
                  setConfirming(false);
                }}
              >
                Delete all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirming(true)}>
              Clear
            </Button>
          ))
        }
      >
        {sessions.length === 0 ? (
          <EmptyState
            icon="history"
            title="No sessions yet"
            description="Finish a run with STOP and it will show up here."
          />
        ) : (
          <div className={styles.rows}>
            <div className={`${styles.row} ${styles.rowHead}`}>
              <span>Session</span>
              <span className={styles.numeric}>Shown</span>
              <span className={styles.numeric}>Accuracy</span>
              <span className={styles.numeric}>Length</span>
              <span>Mode</span>
            </div>

            {sessions.map((session) => {
              const graded = session.correct + session.wrong;
              return (
                <div key={session.id} className={styles.row}>
                  <span className={styles.rowTitle}>
                    <span className={styles.rowName}>
                      {session.moduleTitle} — {session.setLabel}
                    </span>
                    <span className={styles.rowMeta}>
                      {formatWhen(session.startedAt)} · {session.intervalSeconds}s per item
                    </span>
                  </span>
                  <span className={styles.numeric}>{session.itemsShown}</span>
                  <span className={styles.numeric}>
                    {graded > 0 ? formatAccuracy(session.correct / graded) : '—'}
                  </span>
                  <span className={styles.numeric}>{formatDuration(session.durationMs)}</span>
                  <Chip tone={session.mode === 'test' ? 'next' : 'accent'}>{session.mode}</Chip>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
