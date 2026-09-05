import type { ReactNode } from 'react';
import { Button, Field, SegmentedControl } from '@/components/ui';
import { useSettings } from '@/features/settings';
import styles from './kit.module.css';

/** Which instrument the learner is actually sitting at. */
export type PlaySurface = 'screen' | 'external';

const OPTIONS = [
  { value: 'screen' as PlaySurface, label: 'On screen' },
  { value: 'external' as PlaySurface, label: 'On my keyboard' },
];

interface PlayWhereProps {
  value: PlaySurface;
  onChange: (value: PlaySurface) => void;
  /** Replaces the default hint where a drill needs to say something else. */
  hint?: string;
}

/**
 * The same choice, worded the same way, on every drill that offers it.
 *
 * Worth sharing rather than repeating: switching instrument changes what a
 * drill can measure, and a learner should not have to work out what a
 * differently-named toggle means from one practice to the next.
 */
export function PlayWhere({ value, onChange, hint }: PlayWhereProps) {
  return (
    <Field
      label="Where you play"
      hint={hint ?? 'On my keyboard turns this into a click and a cue to follow.'}
    >
      <SegmentedControl
        value={value}
        options={OPTIONS}
        onChange={onChange}
        block
        ariaLabel="Where you play"
      />
    </Field>
  );
}

/**
 * What the drill gives up by leaving the screen.
 *
 * Shown wherever guided mode is on, because the counters it replaces are the
 * reason to trust the drill. Saying plainly that nothing is being measured is
 * better than leaving a learner to assume a number is still watching them.
 */
export function GuidedNote({ children }: { children?: ReactNode }) {
  return (
    <p className={styles.guidedNote}>
      {children ??
        'Nothing can be measured from here — the click keeps the tempo and the cue keeps your place. Judge the notes with your ears.'}
    </p>
  );
}

/**
 * The one thing that stops a guided run working, and the fix for it.
 *
 * Sound is off by default, which is right for a drill you answer by clicking —
 * and wrong for one you follow by ear from across the room. Without the click a
 * guided run is a silently moving highlight, so this says so and offers the
 * switch rather than leaving someone to conclude the mode is broken.
 */
export function GuidedSound() {
  const { settings, update } = useSettings();
  if (settings.soundEnabled) return null;

  return (
    <div className={styles.guidedWarn}>
      <p className={styles.guidedWarnText}>
        Sound is off, so there is no click to play against — only the lamps.
      </p>
      <Button
        variant="primary"
        icon="sound-on"
        size="sm"
        onClick={() => update('soundEnabled', true)}
        block
      >
        Turn the click on
      </Button>
    </div>
  );
}
