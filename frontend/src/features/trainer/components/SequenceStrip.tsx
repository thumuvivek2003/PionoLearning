import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/cn';
import { SEQUENCE_LOOKAHEAD, SEQUENCE_LOOKBEHIND } from '@/lib/constants';
import type { TrainerItem } from '../types/trainer.types';
import styles from './trainer.module.css';

interface SequenceStripProps {
  sequence: readonly TrainerItem[];
  index: number;
  /** Blur the upcoming items when "show next" is off. */
  revealUpcoming: boolean;
}

/** The horizontal timeline: what just happened, what is now, what is coming. */
export function SequenceStrip({ sequence, index, revealUpcoming }: SequenceStripProps) {
  const currentRef = useRef<HTMLLIElement>(null);

  const window = useMemo(() => {
    const from = Math.max(0, index - SEQUENCE_LOOKBEHIND);
    const to = Math.min(sequence.length, index + SEQUENCE_LOOKAHEAD);
    return sequence.slice(from, to).map((item, offset) => ({ item, position: from + offset }));
  }, [index, sequence]);

  // Keep the current item centred as the run advances.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [index]);

  if (sequence.length === 0) return null;

  return (
    <div className={styles.sequence}>
      <header className={styles.sequenceHeader}>
        <h3 className={styles.sequenceTitle}>Upcoming sequence</h3>
        <span className={styles.sequenceTitle}>
          {index + 1} / {sequence.length}
        </span>
      </header>

      <ul className={styles.sequenceTrack}>
        {window.map(({ item, position }) => {
          const isCurrent = position === index;
          const isPast = position < index;
          const hidden = !revealUpcoming && position > index;

          return (
            <li
              key={`${position}-${item.id}`}
              ref={isCurrent ? currentRef : undefined}
              className={cn(
                styles.sequenceItem,
                isPast && styles.sequencePast,
                isCurrent && styles.sequenceCurrent,
                !isPast && !isCurrent && styles.sequenceNext,
                hidden && styles.sequenceHidden,
              )}
              aria-current={isCurrent ? 'true' : undefined}
            >
              {hidden ? '•' : item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
