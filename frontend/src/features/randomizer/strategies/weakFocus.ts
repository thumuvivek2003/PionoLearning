import type { Identifiable, SequenceStrategy, StrategyContext } from '../types';

/** How far back the weighting looks when measuring "recently seen". */
const LOOKBACK = 8;

/**
 * Draw that leans on what you keep getting wrong.
 *
 * Even spread asks "what have I not seen lately"; this also asks "what do I
 * keep missing", and multiplies the two. Weight comes from the caller, so what
 * counts as weak stays the drill's business — this only decides how hard to
 * lean on it (Dependency Inversion).
 *
 * Weights never reach zero, so a mastered item still reappears: the drill has
 * to stay a test of everything, not a tour of your mistakes.
 */
export const weakFocusStrategy: SequenceStrategy = {
  id: 'weak-focus',
  name: 'Focus weak spots',
  description: 'Favours the items you miss or answer slowly. Best for closing gaps.',
  pick<T extends Identifiable>({ pool, history, random, weights }: StrategyContext<T>): T {
    const recent = history.slice(-LOOKBACK).map((entry) => entry.id);
    const previousId = history[history.length - 1]?.id;

    const scored = pool.map((item) => {
      if (item.id === previousId && pool.length > 1) return 0;
      const lastSeen = recent.lastIndexOf(item.id);
      const staleness = lastSeen === -1 ? recent.length + 1 : recent.length - lastSeen;
      return staleness * (weights?.get(item.id) ?? 1);
    });

    const total = scored.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) return pool[Math.floor(random() * pool.length)] as T;

    let ticket = random() * total;
    for (let index = 0; index < pool.length; index += 1) {
      ticket -= scored[index] as number;
      if (ticket <= 0) return pool[index] as T;
    }

    return pool[pool.length - 1] as T;
  },
};
