/** Anything the randomizer can shuffle needs a stable identity. */
export interface Identifiable {
  id: string;
}

export interface StrategyContext<T extends Identifiable> {
  /** Everything that may be drawn. Never empty when a strategy is called. */
  pool: readonly T[];
  /** Items already drawn, oldest first. */
  history: readonly T[];
  /** Random source, injected so sequences can be made deterministic in tests. */
  random: () => number;
  /**
   * Optional per-item draw weight, keyed by item id — higher means "ask this
   * more". Supplied by drills that track how you are doing per item; strategies
   * that do not care about difficulty simply ignore it.
   */
  weights?: ReadonlyMap<string, number>;
}

/**
 * A pick-the-next-item policy.
 *
 * Strategies are the only place that decides *how* random the practice feels,
 * which keeps difficulty tuning out of the session engine (Open/Closed).
 */
export interface SequenceStrategy {
  id: string;
  name: string;
  description: string;
  pick<T extends Identifiable>(context: StrategyContext<T>): T;
}

export type StrategyId = 'no-repeat' | 'spread' | 'pure-random' | 'weak-focus';
