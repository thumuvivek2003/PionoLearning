import { Icon } from '@/components/ui';
import type { TrainerItem } from '../types/trainer.types';
import styles from './trainer.module.css';

interface NoteDisplayProps {
  previous: TrainerItem | null;
  current: TrainerItem | null;
  next: TrainerItem | null;
  /** Hidden in Test mode, and optional in Practice, to stop you reading ahead. */
  showNext: boolean;
  idleHint: string;
  onPrevious: () => void;
  onNext: () => void;
  navigationEnabled: boolean;
}

/**
 * Previous · CURRENT · Next.
 * Current is deliberately enormous and the neighbours are muted, so your eyes
 * stay on the note you are actually playing.
 */
export function NoteDisplay({
  previous,
  current,
  next,
  showNext,
  idleHint,
  onPrevious,
  onNext,
  navigationEnabled,
}: NoteDisplayProps) {
  return (
    <div className={styles.display}>
      <button
        type="button"
        className={styles.navButton}
        onClick={onPrevious}
        disabled={!navigationEnabled || !previous}
        aria-label="Previous item"
      >
        <Icon name="chevron-left" size={20} />
      </button>

      <div className={styles.slot}>
        <span className={styles.slotLabel}>Previous</span>
        <span className={`${styles.sideValue} ${styles.previousValue}`}>
          {previous?.label ?? '—'}
        </span>
      </div>

      <div className={styles.slot}>
        <span className={styles.slotLabel}>Current</span>
        {current ? (
          <>
            <span className={styles.currentValue}>{current.label}</span>
            {current.sublabel && <span className={styles.currentSub}>{current.sublabel}</span>}
          </>
        ) : (
          <span className={styles.placeholder}>
            Ready
            <span className={styles.placeholderHint}>{idleHint}</span>
          </span>
        )}
      </div>

      <div className={styles.slot}>
        <span className={styles.slotLabel}>Next</span>
        <span className={`${styles.sideValue} ${styles.nextValue}`}>
          {showNext ? (next?.label ?? '—') : '•••'}
        </span>
      </div>

      <button
        type="button"
        className={styles.navButton}
        onClick={onNext}
        disabled={!navigationEnabled}
        aria-label="Next item"
      >
        <Icon name="chevron-right" size={20} />
      </button>
    </div>
  );
}
