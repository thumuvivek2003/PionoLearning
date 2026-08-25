import { cn } from '@/lib/cn';
import { barCount } from '../data/noteValues';
import styles from './rhythm.module.css';

interface BeatBarProps {
  beatsPerBar: number;
  /** Which count of the bar is live; -1 for none. */
  beat: number;
  /** Counts inside each beat: 1, 2 or 4. */
  subdivision?: number;
  /** Counts this practice asks you to mark. */
  playOn?: readonly boolean[];
  /** The first beat carries the accent. */
  accentFirst?: boolean;
  /** The click has dropped out and the pulse is yours to keep. */
  silent?: boolean;
}

/**
 * The bar, drawn as it is counted.
 *
 * A pulse is hard to argue with when you can see it: the live beat lights, the
 * beats you are asked to mark are outlined, and a silent bar dims the whole
 * thing without stopping it — which is exactly the point being made.
 */
export function BeatBar({
  beatsPerBar,
  beat,
  subdivision = 1,
  playOn,
  accentFirst = false,
  silent = false,
}: BeatBarProps) {
  const labels = barCount(beatsPerBar, subdivision as 1 | 2 | 4);

  return (
    <div className={cn(styles.bar, silent && styles.barSilent)} aria-label="The bar">
      {labels.map((label, index) => {
        const marked = playOn?.[index] ?? true;
        // Offbeats are drawn smaller, so the shape of the bar reads at a glance.
        const offbeat = index % subdivision !== 0;
        return (
          <span
            key={index}
            className={cn(
              styles.beat,
              offbeat && styles.beatOff,
              marked && styles.beatMarked,
              index === beat && styles.beatLive,
              accentFirst && index === 0 && styles.beatAccent,
            )}
          >
            {label}
          </span>
        );
      })}
      {silent && <span className={styles.barNote}>silent — keep the pulse</span>}
    </div>
  );
}
