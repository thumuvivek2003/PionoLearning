import { cn } from '@/lib/cn';
import type { FingerNumber, Hand, PositionSlot } from '../finger.types';
import { positionFor } from '../data/fingers';
import styles from './finger.module.css';

interface PositionStripProps {
  hand: Hand;
  /** The key being asked for or cued. */
  highlight?: number | null;
  tone?: 'accent' | 'success' | 'danger';
  /** Makes the keys answerable; the index is the slot's position in the hand. */
  onSelect?: (slotIndex: number) => void;
  /** Print the finger number under each key — the answer, so usually off. */
  showFingers?: boolean;
}

/**
 * The five keys of the C position with the fingers that own them.
 *
 * Five keys rather than the app's 61-key keyboard: this bucket is about one
 * hand sitting still on one position, and a full keyboard invites the eye to
 * wander off it.
 */
export function PositionStrip({
  hand,
  highlight = null,
  tone = 'accent',
  onSelect,
  showFingers = true,
}: PositionStripProps) {
  const slots = positionFor(hand);
  const interactive = onSelect !== undefined;

  return (
    <div className={styles.strip} role={interactive ? 'group' : 'img'} aria-label="C five-finger position">
      {slots.map((slot: PositionSlot, index) => {
        const lit = highlight === index;
        const content = (
          <>
            <span className={styles.stripLetter}>{slot.letter}</span>
            <span className={styles.stripFinger}>
              {showFingers ? (slot.finger as FingerNumber) : '·'}
            </span>
          </>
        );

        const className = cn(
          styles.stripKey,
          lit && styles.stripKeyLit,
          lit && tone === 'success' && styles.stripKeySuccess,
          lit && tone === 'danger' && styles.stripKeyDanger,
        );

        return interactive ? (
          <button
            key={slot.letter}
            type="button"
            className={className}
            onClick={() => onSelect?.(index)}
            aria-label={`${slot.letter}${showFingers ? `, finger ${slot.finger}` : ''}`}
          >
            {content}
          </button>
        ) : (
          <span key={slot.letter} className={className}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
