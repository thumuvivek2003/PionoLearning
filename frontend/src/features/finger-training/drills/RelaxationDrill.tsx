import { useCallback, useMemo, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl } from '@/components/ui';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { FINGERS, fingerName, handShort, positionFor } from '../data/fingers';
import type { FingerNumber, Hand } from '../finger.types';
import { usePacedSequence } from '../hooks/usePacedSequence';
import type { PacedStep } from '../hooks/usePacedSequence';
import { DrillShell } from '../components/DrillShell';
import { HandDiagram } from '../components/HandDiagram';
import { PositionStrip } from '../components/PositionStrip';
import styles from '../components/finger.module.css';

const HANDS = [
  { value: 'right', label: 'Right hand' },
  { value: 'left', label: 'Left hand' },
] as const;

const SECONDS: readonly number[] = [1, 1.5, 2, 3];

type Phase = 'press' | 'hold' | 'release' | 'relax';

const PHASES: readonly { phase: Phase; label: string; instruction: string }[] = [
  { phase: 'press', label: 'Press', instruction: 'Let the key down. Only as far as it goes — no further.' },
  { phase: 'hold', label: 'Hold', instruction: 'Keep it down. Where is the effort — wrist, shoulder, the other fingers?' },
  { phase: 'release', label: 'Release', instruction: 'Let the key come back up. The hand stays on the keys.' },
  { phase: 'relax', label: 'Relax', instruction: 'Resting, not preparing. Nothing is holding on.' },
];

/**
 * 2.1.4 — press, hold, release, relax.
 *
 * Four named phases at a walking pace, because the bad habit this prevents is
 * an invisible one: staying braced between notes. Naming the release makes it
 * something you do rather than something that happens.
 */
export function RelaxationDrill() {
  const [hand, setHand] = useState<Hand>('right');
  const [finger, setFinger] = useState<FingerNumber>(1);
  const [phaseSeconds, setPhaseSeconds] = useState(1.5);
  const { settings } = useSettings();

  const slots = useMemo(() => positionFor(hand), [hand]);
  const slotIndex = slots.findIndex((slot) => slot.finger === finger);
  const slot = slots[slotIndex];

  const steps = useMemo<readonly PacedStep<Phase>[]>(
    () => PHASES.map((entry) => ({ value: entry.phase, ms: phaseSeconds * 1000 })),
    [phaseSeconds],
  );

  // Sound the note as the press begins, so the ear marks the start of the cycle.
  const onStep = useCallback(
    (index: number) => {
      if (index === 0 && settings.soundEnabled && slot) instrument.play([slot.pitchClass]);
    },
    [settings.soundEnabled, slot],
  );

  const paced = usePacedSequence(steps, { loop: true, onStep });
  const active = paced.isRunning ? PHASES[paced.index] : undefined;
  const pressing = active?.phase === 'press' || active?.phase === 'hold';

  return (
    <DrillShell
      goal="Press → hold → release → relax, with the relax as deliberate as the press."
      steps={[
        `Put ${handShort(hand)} finger ${finger} on ${slot?.letter ?? 'C'} and rest the other fingers on their keys.`,
        'Follow the phase on screen. One key, no rhythm to keep.',
        'On RELAX, ask what is still holding — then let that go.',
      ]}
      watchFor='The "ready to attack" hand: raised wrist, curled spare fingers, shoulder up. You are resting on the keyboard, not braced over it.'
      aside={
        <>
          <Field label="Hand">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>

          <Field label="Finger" hint={slot ? `Plays ${slot.letter} in the C position.` : undefined}>
            <div className={styles.chipRow}>
              {FINGERS.map((entry) => (
                <button
                  key={entry.number}
                  type="button"
                  className={cn(styles.choice, entry.number === finger && styles.choiceActive)}
                  onClick={() => setFinger(entry.number)}
                >
                  {entry.number}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Phase length">
            <div className={styles.chipRow}>
              {SECONDS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={cn(styles.choice, seconds === phaseSeconds && styles.choiceActive)}
                  onClick={() => setPhaseSeconds(seconds)}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </Field>

          <div className={styles.transport}>
            <Button
              variant={paced.isRunning ? 'danger' : 'primary'}
              icon={paced.isRunning ? 'stop' : 'play'}
              onClick={paced.isRunning ? paced.stop : paced.start}
              block
            >
              {paced.isRunning ? 'Stop' : 'Start'}
            </Button>
          </div>

          <div className={styles.scores}>
            <span className={styles.stat}>
              <span className={styles.statLabel}>Cycles</span>
              <span className={styles.statValue}>{paced.cycles}</span>
            </span>
          </div>
        </>
      }
    >
      <div className={styles.promptRow}>
        <span className={styles.promptLabel}>
          {handShort(hand)} {finger} · {fingerName(finger)} on {slot?.letter}
        </span>
        <p className={cn(styles.prompt, styles.promptWide)}>
          {active ? active.label : 'Ready'}
        </p>
        <span className={styles.verdictLine}>
          <Chip tone={active?.phase === 'relax' ? 'next' : 'accent'}>
            {active ? active.instruction : 'One key, four phases, no rush.'}
          </Chip>
        </span>
      </div>

      <div className={styles.stageRow}>
        <HandDiagram
          hand={hand}
          highlight={pressing ? finger : null}
          tone="accent"
          showNumbers
          size={220}
        />
        <ProgressRing
          progress={paced.isRunning ? paced.progress : 0}
          value={paced.isRunning ? paced.secondsLeft.toFixed(1) : '0.0'}
          unit={active?.label.toLowerCase() ?? 'idle'}
          size={104}
        />
      </div>

      <PositionStrip
        hand={hand}
        highlight={pressing ? slotIndex : null}
        tone="accent"
        showFingers
      />
    </DrillShell>
  );
}
