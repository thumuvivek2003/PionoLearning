import type { Identifiable, SequenceStrategy, StrategyContext } from '../types';

/** Uniform draw — the same item can appear twice in a row. */
export const pureRandomStrategy: SequenceStrategy = {
  id: 'pure-random',
  name: 'Pure random',
  description: 'Every item is equally likely, repeats included. Hardest.',
  pick<T extends Identifiable>({ pool, random }: StrategyContext<T>): T {
    return pool[Math.floor(random() * pool.length)] as T;
  },
};
