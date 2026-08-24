import { Button } from '@/components/ui';
import { formatMs } from './Counters';
import type { ItemScore } from '../scoring';
import styles from './kit.module.css';

interface WeakSpotsProps {
  /** Worst first — what `weakSpots()` returned. */
  spots: readonly ItemScore[];
  /** Shown while nothing is weak enough to name yet. */
  emptyNote?: string;
  /** Offered when the ledger can be wiped — after working on what it named. */
  onClear?: () => void;
}

/**
 * The three things to work on, named.
 *
 * A score of 84% tells you to try harder; "B♭ 2 of 5, 2.4s" tells you what to
 * do next. Items answered right and quickly never appear here — a list of
 * everything would be no list at all.
 */
export function WeakSpots({
  spots,
  emptyNote = 'Keep going — nothing weak yet.',
  onClear,
}: WeakSpotsProps) {
  return (
    <div className={styles.weak}>
      <span className={styles.weakLabel}>Work on</span>
      {spots.length === 0 ? (
        <span className={styles.weakEmpty}>{emptyNote}</span>
      ) : (
        <ul className={styles.weakList}>
          {spots.map((spot) => (
            <li key={spot.key} className={styles.weakItem}>
              <span className={styles.weakKey}>{spot.key}</span>
              <span className={styles.weakStat}>
                {spot.correct}/{spot.asked}
              </span>
              <span className={styles.weakStat}>{formatMs(spot.averageMs)}</span>
            </li>
          ))}
        </ul>
      )}
      {onClear && spots.length > 0 && (
        <Button variant="ghost" icon="reset" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
