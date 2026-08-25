import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import styles from './ui.module.css';

interface CoverProps {
  covered: boolean;
  /** Read on the cover itself, e.g. "Covered — reach from memory". */
  note: string;
  children: ReactNode;
}

/**
 * A cover over whatever it wraps — the app's version of looking away.
 *
 * It takes no pointer events, so the controls underneath stay live: you aim at
 * where you believe a key is and the press lands on whatever is really there.
 * That is what makes playing blind measurable rather than a matter of trust —
 * the board can say "one key too far left" because it knows.
 *
 * A composition wrapper rather than a prop on the keyboard, so anything can be
 * covered without knowing it is being covered (single responsibility).
 */
export function Cover({ covered, note, children }: CoverProps) {
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
