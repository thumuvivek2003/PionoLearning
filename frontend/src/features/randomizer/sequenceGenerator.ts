import type { Identifiable, SequenceStrategy } from './types';

export interface GenerateOptions<T extends Identifiable> {
  pool: readonly T[];
  strategy: SequenceStrategy;
  /** How many items to produce. */
  count: number;
  /** Items already played, so a top-up continues the same stream. */
  history?: readonly T[];
  random?: () => number;
  /** Per-item draw weights, for the strategies that adapt to them. */
  weights?: ReadonlyMap<string, number>;
}

/**
 * Produce `count` items by repeatedly asking the strategy for the next one.
 * The engine that drives the UI only ever calls this — swapping difficulty is
 * a matter of passing a different strategy.
 */
export function generateSequence<T extends Identifiable>({
  pool,
  strategy,
  count,
  history = [],
  random = Math.random,
  weights,
}: GenerateOptions<T>): T[] {
  if (pool.length === 0 || count <= 0) return [];

  const running: T[] = [...history];
  const produced: T[] = [];

  for (let index = 0; index < count; index += 1) {
    const next = strategy.pick({ pool, history: running, random, weights });
    produced.push(next);
    running.push(next);
  }

  return produced;
}
