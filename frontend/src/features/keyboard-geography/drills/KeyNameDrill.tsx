import { useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { KEYBOARD_LAYOUTS, getKeyboardLayout } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LANDMARK_HINT, NATURALS } from '../data/naturals';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { NoteButtons } from '../components/NoteButtons';
import styles from '../components/geography.module.css';

/** One lit key, somewhere on the board. */
interface Prompt {
  id: string;
  midi: number;
  letter: Letter;
  octave: number;
}

const LAYOUT_OPTIONS = KEYBOARD_LAYOUTS.map((layout) => ({
  value: layout.id,
  label: `${layout.keyCount} keys`,
}));

function buildPool(layoutId: string): readonly Prompt[] {
  return getKeyboardLayout(layoutId)
    .keys.filter((key) => !key.isBlack)
    .map<Prompt>((key) => ({
      id: `k-${key.midi}`,
      midi: key.midi,
      letter: key.sharpName as Letter,
      octave: key.octave,
    }));
}

/**
 * 1.1.6 — a key lights up, name it.
 *
 * The prompt is the keyboard itself and the names are off by default, because
 * the pass condition is naming a random white key in about a second from the
 * black-key groups alone. Widening the layout is drill 3 from the notes: the
 * same seven letters, anywhere on the board.
 */
export function KeyNameDrill() {
  const [layoutId, setLayoutId] = useState<string>('25');
  const [showNames, setShowNames] = useState(false);

  const pool = useMemo(() => buildPool(layoutId), [layoutId]);
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.letter, []);

  const drill = useQuizDrill<Prompt, Letter>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';

  const answerLetters = useMemo(
    () =>
      Object.fromEntries(
        NATURALS.map((letter) => [letter.toLowerCase(), () => drill.answer(letter)]),
      ),
    [drill],
  );
  useKeyboardShortcuts(answerLetters);

  const underTarget = stats.averageMs !== null && stats.averageMs <= 1000;

  return (
    <DrillShell
      goal="Random white key → its name, in about a second, without counting from C."
      steps={[
        'Look at the lit key and name it before you reach for an answer.',
        'Answer with a letter button or the C–B keys.',
        'Widen the keyboard once one octave is easy — the letter is the same everywhere.',
      ]}
      watchFor='Silently reciting "C, D, E…" up to the key. Use the black-key groups instead: they tell you where you are instantly.'
      aside={
        <>
          <Field label="Keyboard" hint="Wider boards spread the same seven letters further apart.">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Only for the first minute. With names on, this is reading, not recognition."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label="Which note is lit?"
        footer={
          <>
            {verdict === 'correct' && (
              <Chip tone="accent">
                {expected}
                {question.octave}
              </Chip>
            )}
            {verdict === 'wrong' && <Chip tone="danger">Not {given} — look again</Chip>}
            {!settled && (
              <Chip tone={underTarget ? 'accent' : 'neutral'}>Target ≤ 1s per key</Chip>
            )}
          </>
        }
      >
        ?
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={[question.midi]}
          showNames={showNames || settled}
          footerNote="Name the lit key"
        />
      </div>

      <NoteButtons
        onAnswer={drill.answer}
        correct={settled ? expected : null}
        wrong={verdict === 'wrong' ? given : null}
      />

      <p className={styles.landmark}>{LANDMARK_HINT}</p>
    </DrillShell>
  );
}
