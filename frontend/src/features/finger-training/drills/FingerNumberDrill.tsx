import { useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/cn';
import { FINGERS, FINGER_NUMBERS, fingerName, handLabel, handShort } from '../data/fingers';
import type { FingerNumber, Hand, QuizDirection } from '../finger.types';
import { useQuizDrill } from '../hooks/useQuizDrill';
import { DrillShell } from '../components/DrillShell';
import { HandDiagram } from '../components/HandDiagram';
import { ScoreBoard } from '../components/ScoreBoard';
import styles from '../components/finger.module.css';

/** A prompt is one finger asked in one of the two directions. */
interface Prompt {
  id: string;
  finger: FingerNumber;
  direction: 'toNumber' | 'toName';
}

const DIRECTIONS = [
  { value: 'toNumber', label: 'To number' },
  { value: 'toName', label: 'To finger' },
  { value: 'mixed', label: 'Mixed' },
] as const;

function buildPool(direction: QuizDirection): readonly Prompt[] {
  const toNumber = FINGER_NUMBERS.map<Prompt>((finger) => ({
    id: `name-${finger}`,
    finger,
    direction: 'toNumber',
  }));
  const toName = FINGER_NUMBERS.map<Prompt>((finger) => ({
    id: `num-${finger}`,
    finger,
    direction: 'toName',
  }));

  if (direction === 'toNumber') return toNumber;
  if (direction === 'toName') return toName;
  return [...toNumber, ...toName];
}

/**
 * 2.1.1 — finger numbers, both directions.
 *
 * The same component serves the right and left hand because the numbering is
 * the same: 1 is the thumb on both, and the only difference is which side of
 * the diagram it sits on.
 */
export function FingerNumberDrill({ hand }: { hand: Hand }) {
  const [direction, setDirection] = useState<QuizDirection>('mixed');
  const [assist, setAssist] = useState(true);

  const pool = useMemo(() => buildPool(direction), [direction]);
  const drill = useQuizDrill<Prompt, FingerNumber>({
    pool,
    answerOf: (prompt) => prompt.finger,
  });

  const { question, verdict, given, stats } = drill;
  const settled = verdict !== 'waiting';

  useKeyboardShortcuts(
    useMemo(
      () => ({
        '1': () => drill.answer(1),
        '2': () => drill.answer(2),
        '3': () => drill.answer(3),
        '4': () => drill.answer(4),
        '5': () => drill.answer(5),
      }),
      [drill],
    ),
  );

  const askingForNumber = question.direction === 'toNumber';

  return (
    <DrillShell
      goal={`Turn "${fingerName(3)} = 3" into something you know rather than count — ${handLabel(hand).toLowerCase()}.`}
      steps={[
        'Read the prompt and answer before you move anything.',
        'Answer by tapping the finger on the hand, tapping a chip, or pressing 1–5.',
        'Then wiggle that finger on your real hand to close the loop.',
      ]}
      watchFor="Counting up from the thumb. If you catch yourself doing that, slow the prompt down rather than guessing."
      aside={
        <>
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
            label="Show the numbers"
            description="Leave off once you know them — reading the answer is not recall."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <div className={styles.promptRow}>
        <span className={styles.promptLabel}>
          {handShort(hand)} · {askingForNumber ? 'Which number?' : 'Which finger?'}
        </span>
        <p className={cn(styles.prompt, styles.promptWide)}>
          {askingForNumber ? fingerName(question.finger) : question.finger}
        </p>
        <span className={styles.verdictLine}>
          {verdict === 'correct' && <Chip tone="accent">Correct</Chip>}
          {verdict === 'wrong' && (
            <Chip tone="danger">
              {given} is {fingerName(given as FingerNumber)} — try again
            </Chip>
          )}
        </span>
      </div>

      <HandDiagram
        hand={hand}
        highlight={settled ? question.finger : given}
        tone={verdict === 'wrong' ? 'danger' : verdict === 'correct' ? 'success' : 'accent'}
        onSelect={drill.answer}
        showNumbers={assist || settled}
      />

      <div className={styles.answers}>
        {FINGERS.map((finger) => (
          <button
            key={finger.number}
            type="button"
            className={cn(
              styles.answer,
              settled && finger.number === question.finger && styles.answerCorrect,
              verdict === 'wrong' && finger.number === given && styles.answerWrong,
            )}
            onClick={() => drill.answer(finger.number)}
          >
            <span className={styles.answerNumber}>{finger.number}</span>
            {finger.name}
          </button>
        ))}
      </div>
    </DrillShell>
  );
}
