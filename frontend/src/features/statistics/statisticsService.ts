import type { ItemStat, SessionRecord, StatisticsSummary } from './statistics.types';

/** Pure reducers over stored sessions — no React, easy to unit-test. */
export function summarise(sessions: readonly SessionRecord[]): StatisticsSummary {
  const totals = sessions.reduce(
    (acc, session) => {
      acc.itemsShown += session.itemsShown;
      acc.practiceMs += session.durationMs;
      acc.correct += session.correct;
      acc.wrong += session.wrong;
      for (const answer of session.answers) {
        acc.responseMs += answer.responseMs;
        acc.responseCount += 1;
      }
      return acc;
    },
    { itemsShown: 0, practiceMs: 0, correct: 0, wrong: 0, responseMs: 0, responseCount: 0 },
  );

  const graded = totals.correct + totals.wrong;

  return {
    sessions: sessions.length,
    itemsShown: totals.itemsShown,
    practiceMs: totals.practiceMs,
    correct: totals.correct,
    wrong: totals.wrong,
    accuracy: graded > 0 ? totals.correct / graded : null,
    averageResponseMs: totals.responseCount > 0 ? totals.responseMs / totals.responseCount : null,
  };
}

/** Per-item accuracy, worst first — this is your practice to-do list. */
export function weakestItems(sessions: readonly SessionRecord[], limit = 8): ItemStat[] {
  const byItem = new Map<string, ItemStat>();

  for (const session of sessions) {
    for (const answer of session.answers) {
      const stat = byItem.get(answer.itemId) ?? {
        itemId: answer.itemId,
        itemLabel: answer.itemLabel,
        correct: 0,
        wrong: 0,
        accuracy: 0,
      };
      if (answer.verdict === 'correct') stat.correct += 1;
      else stat.wrong += 1;
      byItem.set(answer.itemId, stat);
    }
  }

  return [...byItem.values()]
    .map((stat) => ({ ...stat, accuracy: stat.correct / (stat.correct + stat.wrong) }))
    .sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong)
    .slice(0, limit);
}

export function sessionsByModule(
  sessions: readonly SessionRecord[],
): Map<string, SessionRecord[]> {
  const grouped = new Map<string, SessionRecord[]>();
  for (const session of sessions) {
    const bucket = grouped.get(session.moduleId);
    if (bucket) bucket.push(session);
    else grouped.set(session.moduleId, [session]);
  }
  return grouped;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function formatAccuracy(accuracy: number | null): string {
  return accuracy === null ? '—' : `${Math.round(accuracy * 100)}%`;
}
