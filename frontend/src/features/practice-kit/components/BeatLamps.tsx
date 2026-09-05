import { cn } from '@/lib/cn';
import styles from './kit.module.css';

interface BeatLampsProps {
  /** Which beat of the bar is live; -1 for none. */
  beat: number;
  /** Beats in a bar. */
  perBar?: number;
  label?: string;
}

/**
 * The beat, drawn as a row of lamps.
 *
 * Playing away from the screen means the click is the only thing keeping time,
 * and a click alone is easy to lose count of — knowing you are on beat 3 is
 * what tells you where the bar is. Lamps are readable at the edge of vision, so
 * a learner can follow the bar without taking their eyes off their hands.
 */
export function BeatLamps({ beat, perBar = 4, label = 'The beat' }: BeatLampsProps) {
  return (
    <ul className={styles.beatLamps} aria-label={label} aria-hidden={beat < 0}>
      {Array.from({ length: perBar }, (_, position) => (
        <li
          key={position}
          className={cn(
            styles.beatLamp,
            position === beat && styles.beatLampOn,
            position === beat && position === 0 && styles.beatLampBar,
          )}
        />
      ))}
    </ul>
  );
}
