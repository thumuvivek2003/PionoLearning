import { useCallback, useMemo, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl } from '@/components/ui';
import {
  ChoicePills,
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  StageRow,
  usePacedSequence,
} from '@/features/practice-kit';
import type { PacedStep } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { FINGER_NUMBERS, fingerName, handShort, positionFor } from '../data/fingers';
import type { FingerNumber, Hand } from '../finger.types';
import { HandDiagram } from '../components/HandDiagram';
import { PositionStrip } from '../components/PositionStrip';

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
            <ChoicePills options={FINGER_NUMBERS} value={finger} onChange={setFinger} />
          </Field>

          <Field label="Phase length">
            <ChoicePills
              options={SECONDS}
              value={phaseSeconds}
              onChange={setPhaseSeconds}
              format={(seconds) => `${seconds}s`}
            />
          </Field>

          <Button
            variant={paced.isRunning ? 'danger' : 'primary'}
            icon={paced.isRunning ? 'stop' : 'play'}
            onClick={paced.isRunning ? paced.stop : paced.start}
            block
          >
            {paced.isRunning ? 'Stop' : 'Start'}
          </Button>

          <CounterRow>
            <Counter label="Cycles" value={String(paced.cycles)} />
          </CounterRow>
        </>
      }
    >
      <DrillPrompt
        label={`${handShort(hand)} ${finger} · ${fingerName(finger)} on ${slot?.letter ?? 'C'}`}
        wide
        footer={
          <Chip tone={active?.phase === 'relax' ? 'next' : 'accent'}>
            {active ? active.instruction : 'One key, four phases, no rush.'}
          </Chip>
        }
      >
        {active ? active.label : 'Ready'}
      </DrillPrompt>

      <StageRow>
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
      </StageRow>

      <PositionStrip hand={hand} highlight={pressing ? slotIndex : null} tone="accent" showFingers />
    </DrillShell>
  );
}
