import type { Identifiable, SequenceStrategy, StrategyContext } from '../types';

/** How far back the weighting looks when measuring "recently seen". */
const LOOKBACK = 8;

/**
 * Weighted draw that favours items you have not seen for a while, so every
 * note in the set gets roughly equal practice without feeling ordered.
 */
export const spreadWeightedStrategy: SequenceStrategy = {
  id: 'spread',
  name: 'Even spread',
  description: 'Favours items you have not seen recently. Best for coverage.',
  pick<T extends Identifiable>({ pool, history, random }: StrategyContext<T>): T {
    const recent = history.slice(-LOOKBACK);
    const previousId = history[history.length - 1]?.id;

    const weights = pool.map((item) => {
      if (item.id === previousId && pool.length > 1) return 0;
      const lastSeen = recent.map((entry) => entry.id).lastIndexOf(item.id);
      const staleness = lastSeen === -1 ? recent.length + 1 : recent.length - lastSeen;
      return staleness * staleness;
    });

    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) return pool[Math.floor(random() * pool.length)] as T;

    let ticket = random() * total;
    for (let index = 0; index < pool.length; index += 1) {
      ticket -= weights[index] as number;
      if (ticket <= 0) return pool[index] as T;
    }
    return pool[pool.length - 1] as T;
  },
};
