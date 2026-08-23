import { cn } from '@/lib/cn';
import styles from './kit.module.css';

interface StepStripProps {
  /** What each step shows — a finger number, a note name. */
  items: readonly (string | number)[];
  /** Which step is live; -1 for none. */
  index?: number;
  /** Steps before `index` are drawn as done. Off while a run is idle. */
  showProgress?: boolean;
  /** Marks the live step as a miss instead of current. */
  wrong?: boolean;
  label: string;
}

/**
 * A run laid out left to right, with the current step marked.
 *
 * Used both as a cue (tap this one now) and as a record (this is how far the
 * pass got), which is why progress can be switched off while idle.
 */
export function StepStrip({
  items,
  index = -1,
  showProgress = true,
  wrong = false,
  label,
}: StepStripProps) {
  return (
    <ol className={styles.steps4} aria-label={label}>
      {items.map((item, position) => (
        <li
          key={`${item}-${position}`}
          className={cn(
            styles.step,
            showProgress && position < index && styles.stepDone,
            showProgress && position === index && (wrong ? styles.stepWrong : styles.stepCurrent),
          )}
        >
          {item}
        </li>
      ))}
    </ol>
  );
}
