import { cn } from '@/lib/cn';
import { valueSpec } from '../data/noteValues';
import type { ScoreEvent } from '../data/score';
import styles from './rhythm.module.css';

interface ScoreStripProps {
  events: readonly ScoreEvent[];
  /** Which event is live; -1 for none. */
  index: number;
  /** Events already played, by index. */
  done: number;
  beatsPerBar: number;
}

/**
 * The written rhythm, drawn to length.
 *
 * Each event is as wide as it is long, so a whole note looks like four quarters
 * rather than like one of them — which is the thing a beginner is being asked
 * to feel. Rests are drawn the same width and left hollow: silence occupies the
 * road too.
 */
export function ScoreStrip({ events, index, done, beatsPerBar }: ScoreStripProps) {
  return (
    <ol className={styles.score} aria-label="The rhythm">
      {events.map((event) => (
        <li
          key={event.index}
          className={cn(
            styles.event,
            event.rest && styles.eventRest,
            event.downbeat && styles.eventDownbeat,
            event.index < done && styles.eventDone,
            event.index === index && styles.eventLive,
          )}
          style={{ flexGrow: valueSpec(event.value).beats }}
        >
          <span className={styles.eventCount}>{event.count}</span>
          <span className={styles.eventValue}>
            {event.rest ? 'rest' : valueSpec(event.value).label.toLowerCase()}
          </span>
          {event.beat === 0 && <span className={styles.eventBar} aria-hidden="true" />}
        </li>
      ))}
      <li className={styles.eventEnd} aria-hidden="true">
        {beatsPerBar}
      </li>
    </ol>
  );
}
