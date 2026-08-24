import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './geography.module.css';

interface BlindCoverProps {
  covered: boolean;
  /** Read on the cover itself, e.g. "Covered — reach from memory". */
  note: string;
  children: ReactNode;
}

/**
 * A cover over the keyboard — this app's version of looking away.
 *
 * The cover takes no pointer events, so the keys underneath stay live: you aim
 * at where you believe the key is and the press lands on whatever is really
 * there. That is what makes a blind reach measurable here rather than a matter
 * of trust — the board can say "one key too far left" because it knows.
 *
 * A composition wrapper rather than a keyboard prop, so it can cover any board
 * without the keyboard knowing it is being covered (single responsibility).
 */
export function BlindCover({ covered, note, children }: BlindCoverProps) {
  return (
    <div className={styles.blind}>
      {children}
      <div className={cn(styles.cover, covered && styles.coverOn)} aria-hidden={!covered}>
        <span className={styles.coverNote}>
          <Icon name="lock" size={16} />
          {note}
        </span>
      </div>
    </div>
  );
}
