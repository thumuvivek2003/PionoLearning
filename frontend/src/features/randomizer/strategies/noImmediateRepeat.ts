import type { Identifiable, SequenceStrategy, StrategyContext } from '../types';

/**
 * Uniform draw that never repeats the item just shown, so practice stays
 * "C → G → D" rather than "C → C → C".
 */
export const noImmediateRepeatStrategy: SequenceStrategy = {
  id: 'no-repeat',
  name: 'No immediate repeat',
  description: 'Never shows the same item twice in a row. Recommended.',
  pick<T extends Identifiable>({ pool, history, random }: StrategyContext<T>): T {
    const previous = history[history.length - 1];
    const candidates =
      pool.length > 1 && previous ? pool.filter((item) => item.id !== previous.id) : pool;
    return candidates[Math.floor(random() * candidates.length)] as T;
  },
};
