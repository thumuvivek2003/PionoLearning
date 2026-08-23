import { useMemo, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl } from '@/components/ui';
import {
  Choice,
  ChoicePills,
  ChoiceRow,
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  StageRow,
  StepStrip,
  usePacedSequence,
} from '@/features/practice-kit';
import type { PacedStep } from '@/features/practice-kit';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TAPPING_PATTERNS, fingerName, handShort, resolvePattern } from '../data/fingers';
import type { FingerNumber, Hand } from '../finger.types';
import { HandDiagram } from '../components/HandDiagram';

const HANDS = [
  { value: 'right', label: 'Right hand' },
  { value: 'left', label: 'Left hand' },
] as const;

/** Slow on purpose — this drill is about control, not speed. */
const TEMPOS: readonly number[] = [40, 50, 60, 80, 100];

/**
 * 2.1.2 — paced finger tapping.
 *
 * The screen is the metronome and the cue; the tapping happens on a table or
 * the closed keyboard lid. Keys 1–5 are optional — they let you confirm you hit
 * the finger the cue asked for, which catches the "wrong finger, right rhythm"
 * habit early.
 */
export function FingerTappingDrill() {
  const [hand, setHand] = useState<Hand>('right');
  const [patternId, setPatternId] = useState<string>(TAPPING_PATTERNS[0]?.id ?? 'up');
  const [bpm, setBpm] = useState(60);
  const [sequence, setSequence] = useState<readonly FingerNumber[]>(
    () => resolvePattern(TAPPING_PATTERNS[0] as (typeof TAPPING_PATTERNS)[number]),
  );
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  /** One confirmation per step, so holding a key cannot farm hits. */
  const [tapped, setTapped] = useState<number | null>(null);

  const pattern = useMemo(
    () => TAPPING_PATTERNS.find((entry) => entry.id === patternId) ?? TAPPING_PATTERNS[0],
    [patternId],
  );

  const steps = useMemo<readonly PacedStep<FingerNumber>[]>(
    () => sequence.map((finger) => ({ value: finger, ms: (60 / bpm) * 1000 })),
    [bpm, sequence],
  );

  const paced = usePacedSequence(steps, { loop: true });
  // Idle shows nothing rather than the first step, so the cue only ever means "tap now".
  const currentFinger = paced.isRunning ? paced.current ?? null : null;

  const start = () => {
    // A generated pattern is re-rolled per run, so "random" stays random.
    if (pattern) setSequence(resolvePattern(pattern));
    setHits(0);
    setMisses(0);
    setTapped(null);
    paced.start();
  };

  const registerTap = (finger: FingerNumber) => {
    if (!paced.isRunning || tapped === paced.index) return;
    setTapped(paced.index);
    if (finger === currentFinger) setHits((count) => count + 1);
    else setMisses((count) => count + 1);
  };

  useKeyboardShortcuts(
    useMemo(
      () => ({
        '1': () => registerTap(1),
        '2': () => registerTap(2),
        '3': () => registerTap(3),
        '4': () => registerTap(4),
        '5': () => registerTap(5),
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
      [paced.index, paced.isRunning, currentFinger, tapped],
    ),
  );

  return (
    <DrillShell
      goal="Command one finger at a time — the other four stay put and stay soft."
      steps={[
        'Rest the hand on a table or the closed lid. No pressing.',
        'Press START and tap the cued finger once per beat.',
        'Optional: press the same number on the keyboard to check you tapped the right one.',
        'Build up from 40 BPM only when nothing else twitches.',
      ]}
      watchFor="The other fingers flying up. If tapping 3 lifts 4 as well, that is the weakness this drill is for — slow down, don't push through."
      aside={
        <>
          <Field label="Hand">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>

          <Field label="Pattern">
            <ChoiceRow>
              {TAPPING_PATTERNS.map((entry) => (
                <Choice
                  key={entry.id}
                  active={entry.id === patternId}
                  onClick={() => setPatternId(entry.id)}
                >
                  {entry.label}
                </Choice>
              ))}
            </ChoiceRow>
          </Field>

          <Field label="Tempo" hint="One tap per beat.">
            <ChoicePills options={TEMPOS} value={bpm} onChange={setBpm} />
          </Field>

          <Button
            variant={paced.isRunning ? 'danger' : 'primary'}
            icon={paced.isRunning ? 'stop' : 'play'}
            onClick={paced.isRunning ? paced.stop : start}
            block
          >
            {paced.isRunning ? 'Stop' : 'Start'}
          </Button>

          <CounterRow>
            <Counter label="Passes" value={String(paced.cycles)} />
            <Counter
              label="Confirmed"
              value={String(hits)}
              hint={`${misses} wrong finger`}
            />
          </CounterRow>
        </>
      }
    >
      <DrillPrompt
        label={`${handShort(hand)} · ${pattern?.label ?? ''}`}
        footer={
          currentFinger ? (
            <Chip tone="accent">{fingerName(currentFinger)}</Chip>
          ) : (
            <Chip>Press start</Chip>
          )
        }
      >
        {currentFinger ?? '·'}
      </DrillPrompt>

      <StageRow>
        <HandDiagram
          hand={hand}
          highlight={currentFinger}
          done={paced.isRunning ? sequence.slice(0, paced.index) : []}
          showNumbers
          size={220}
        />
        <ProgressRing
          progress={paced.isRunning ? paced.progress : 0}
          value={currentFinger ? String(currentFinger) : '·'}
          unit={`${bpm} BPM`}
          size={104}
        />
      </StageRow>

      <StepStrip
        items={sequence}
        index={paced.index}
        showProgress={paced.isRunning}
        label="Tapping order"
      />
    </DrillShell>
  );
}
