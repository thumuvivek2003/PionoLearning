import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { DrillPrompt, DrillShell, ScoreBoard, StageRow, useQuizDrill } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { instrument } from '@/lib/audio';
import { handShort, positionFor } from '../data/fingers';
import type { FingerNumber, Hand } from '../finger.types';
import { HandDiagram } from '../components/HandDiagram';
import { PositionStrip } from '../components/PositionStrip';

/** One key of the position, asked in one of the two directions. */
interface Prompt {
  id: string;
  /** Index into the hand's position — identifies both the note and the finger. */
  slot: number;
  direction: 'noteToFinger' | 'fingerToNote';
}

const DIRECTIONS = [
  { value: 'noteToFinger', label: 'To finger' },
  { value: 'fingerToNote', label: 'To note' },
  { value: 'mixed', label: 'Mixed' },
] as const;

type Direction = (typeof DIRECTIONS)[number]['value'];

const HANDS = [
  { value: 'right', label: 'Right hand' },
  { value: 'left', label: 'Left hand' },
] as const;

function buildPool(direction: Direction, slotCount: number): readonly Prompt[] {
  const slots = Array.from({ length: slotCount }, (_, index) => index);
  const noteToFinger = slots.map<Prompt>((slot) => ({
    id: `n2f-${slot}`,
    slot,
    direction: 'noteToFinger',
  }));
  const fingerToNote = slots.map<Prompt>((slot) => ({
    id: `f2n-${slot}`,
    slot,
    direction: 'fingerToNote',
  }));

  if (direction === 'noteToFinger') return noteToFinger;
  if (direction === 'fingerToNote') return fingerToNote;
  return [...noteToFinger, ...fingerToNote];
}

/**
 * 2.1.6 — note ↔ finger, the drill the bucket is really for.
 *
 * The answer is the position *slot*, not a note or a number, which is what lets
 * one prompt loop serve both directions: tapping E on the strip and tapping
 * finger 3 on the hand are the same answer said two ways.
 */
export function NoteFingerDrill() {
  const [hand, setHand] = useState<Hand>('right');
  const [direction, setDirection] = useState<Direction>('noteToFinger');
  const [assist, setAssist] = useState(true);
  const { settings } = useSettings();

  const slots = useMemo(() => positionFor(hand), [hand]);
  const pool = useMemo(() => buildPool(direction, slots.length), [direction, slots.length]);
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.slot, []);

  const drill = useQuizDrill<Prompt, number>({ pool, answerOf });
  const { question, verdict, given, stats } = drill;
  const settled = verdict !== 'waiting';
  const asked = slots[question.slot];

  /** Answer by finger: find the slot that finger owns in this hand. */
  const answerFinger = (finger: FingerNumber) => {
    const index = slots.findIndex((slot) => slot.finger === finger);
    if (index >= 0) drill.answer(index);
  };

  useKeyboardShortcuts(
    useMemo(
      () => ({
        '1': () => answerFinger(1),
        '2': () => answerFinger(2),
        '3': () => answerFinger(3),
        '4': () => answerFinger(4),
        '5': () => answerFinger(5),
      }),
      // answerFinger closes over the current hand and drill.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [drill, slots],
    ),
  );

  // Hearing the note on a right answer ties the name to a sound, not just a key.
  useEffect(() => {
    if (verdict === 'correct' && settings.soundEnabled && asked) {
      instrument.play([asked.pitchClass]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict, question.id]);

  const askingForFinger = question.direction === 'noteToFinger';
  const tone = verdict === 'wrong' ? 'danger' : verdict === 'correct' ? 'success' : 'accent';

  return (
    <DrillShell
      goal='Make "E → RH 3" boring. See the note, know the finger, then move — in that order.'
      steps={[
        'Put your hand in the C position: C D E F G under 1 2 3 4 5.',
        'Read the prompt and answer it before your hand moves.',
        'Answer on the hand (or press 1–5) for a finger, on the keys for a note.',
        'Then actually play it, and let the hand go loose again.',
      ]}
      watchFor="Moving first and working it out afterwards. The point of the drill is the half-second before the movement."
      aside={
        <>
          <Field label="Hand">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>
          <Field label="Direction">
            <SegmentedControl
              value={direction}
              options={DIRECTIONS}
              onChange={setDirection}
              block
              ariaLabel="Prompt direction"
            />
          </Field>
          <Toggle
            checked={assist}
            onChange={setAssist}
            label="Show the mapping"
            description="Turn it off for the mastery test — G → E → C → F → D with no map."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={`${handShort(hand)} · ${askingForFinger ? 'Which finger?' : 'Which note?'}`}
        footer={
          <>
            {verdict === 'correct' && asked && (
              <Chip tone="accent">
                {asked.letter} = {handShort(hand)} {asked.finger}
              </Chip>
            )}
            {verdict === 'wrong' && given !== null && (
              <Chip tone="danger">
                That is {slots[given]?.letter} / {slots[given]?.finger} — try again
              </Chip>
            )}
          </>
        }
      >
        {askingForFinger ? asked?.letter : asked?.finger}
      </DrillPrompt>

      <PositionStrip
        hand={hand}
        highlight={settled ? question.slot : given}
        tone={tone}
        onSelect={drill.answer}
        showFingers={assist || settled}
      />

      <StageRow>
        <HandDiagram
          hand={hand}
          highlight={
            settled ? asked?.finger ?? null : given === null ? null : slots[given]?.finger ?? null
          }
          tone={tone}
          onSelect={answerFinger}
          showNumbers={assist || settled}
          size={210}
        />
      </StageRow>
    </DrillShell>
  );
}
