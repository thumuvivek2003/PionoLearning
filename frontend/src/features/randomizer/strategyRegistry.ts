import { noImmediateRepeatStrategy } from './strategies/noImmediateRepeat';
import { pureRandomStrategy } from './strategies/pureRandom';
import { spreadWeightedStrategy } from './strategies/spreadWeighted';
import { weakFocusStrategy } from './strategies/weakFocus';
import type { SequenceStrategy, StrategyId } from './types';

/**
 * Session presets, ordered easiest → hardest. This is the list Settings shows.
 *
 * Weak-focus is deliberately absent: it needs per-item weights, which only the
 * drills that keep a score book can supply, so offering it to a plain trainer
 * session would promise adaptation it cannot deliver.
 */
export const STRATEGIES: readonly SequenceStrategy[] = [
  spreadWeightedStrategy,
  noImmediateRepeatStrategy,
  pureRandomStrategy,
];

/** Everything resolvable by id, presets plus the drill-only policies. */
const ALL_STRATEGIES: readonly SequenceStrategy[] = [...STRATEGIES, weakFocusStrategy];

export const DEFAULT_STRATEGY_ID: StrategyId = 'no-repeat';

export function getStrategy(id: string): SequenceStrategy {
  return ALL_STRATEGIES.find((strategy) => strategy.id === id) ?? noImmediateRepeatStrategy;
}
