import { noImmediateRepeatStrategy } from './strategies/noImmediateRepeat';
import { pureRandomStrategy } from './strategies/pureRandom';
import { spreadWeightedStrategy } from './strategies/spreadWeighted';
import type { SequenceStrategy, StrategyId } from './types';

/** Ordered easiest → hardest, which is also the order shown in Settings. */
export const STRATEGIES: readonly SequenceStrategy[] = [
  spreadWeightedStrategy,
  noImmediateRepeatStrategy,
  pureRandomStrategy,
];

export const DEFAULT_STRATEGY_ID: StrategyId = 'no-repeat';

export function getStrategy(id: string): SequenceStrategy {
  return STRATEGIES.find((strategy) => strategy.id === id) ?? noImmediateRepeatStrategy;
}
