import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { instrument } from '@/lib/audio';
import { LAYOUT_OPTIONS, WIDE_LAYOUT_ID } from '../data/layouts';
import { OCTAVE_HINT, keyLabel, octavesOf } from '../data/octaves';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import styles from '../components/geography.module.css';

/** Middle C's octave — the one number worth naming on the answer keys. */
const MIDDLE_OCTAVE = 4;

/** Which way round the drill asks. */
type Direction = 'name' | 'find' | 'mixed';

/** Which keys can be asked about. */
type Scope = 'white' | 'all';

interface Prompt {
  id: string;
  key: PianoKey;
  /** True for "find C4" — false for "which octave is lit?". */
  toKey: boolean;
}

const DIRECTIONS = [
  { value: 'name' as Direction, label: 'Name it' },
  { value: 'find' as Direction, label: 'Find it' },
  { value: 'mixed' as Direction, label: 'Mixed' },
];

const SCOPES = [
  { value: 'white' as Scope, label: 'White keys' },
  { value: 'all' as Scope, label: 'All keys' },
];

/**
 * Answers of both directions in one space.
 *
 * Naming an octave and pressing a key are different acts with different answer
 * sets, so they are tagged rather than merged: one pool can then serve both and
 * the grading stays a plain equality check.
 */
const octaveAnswer = (octave: number) => `o${octave}`;
const keyAnswer = (midi: number) => `m${midi}`;

function buildPool(
  layout: KeyboardLayout,
  scope: Scope,
  direction: Direction,
): readonly Prompt[] {
  const keys = layout.keys.filter((key) => scope === 'all' || !key.isBlack);
  const prompts: Prompt[] = [];

  if (direction !== 'find') {
    prompts.push(...keys.map<Prompt>((key) => ({ id: `n-${key.midi}`, key, toKey: false })));
  }
  if (direction !== 'name') {
    prompts.push(...keys.map<Prompt>((key) => ({ id: `k-${key.midi}`, key, toKey: true })));
  }

  return prompts;
}

/**
 * 1.3.7 — note *and* octave, both ways round.
 *
 * The closing drill of the bucket, and the one that needs the other six: Name
 * it lights a key and asks which octave it is, Find it asks for an exact key —
 * "F4" — and only a press will do. Landmarks place the letter, the C below it
 * names the octave; nothing here can be answered by counting from the edge of
 * the board.
 */
export function OctaveNameDrill() {
  const [layoutId, setLayoutId] = useState(WIDE_LAYOUT_ID);
  const [direction, setDirection] = useState<Direction>('name');
  const [scope, setScope] = useState<Scope>('white');
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const pool = useMemo(() => buildPool(layout, scope, direction), [direction, layout, scope]);
  const answerOf = useMemo(
    () => (prompt: Prompt) =>
      prompt.toKey ? keyAnswer(prompt.key.midi) : octaveAnswer(prompt.key.octave),
    [],
  );

  const drill = useQuizDrill<Prompt, string>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  // A new prompt clears the last press so the board starts clean.
  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  const options = useMemo(
    () =>
      octavesOf(layout).map((octave) => ({
        value: octaveAnswer(octave),
        label: String(octave),
        sub: octave === MIDDLE_OCTAVE ? 'middle' : undefined,
      })),
    [layout],
  );

  const nameOctave = useCallback(
    (answer: string) => {
      if (settings.soundEnabled) instrument.playMidis([question.key.midi]);
      drill.answer(answer);
    },
    [drill, question.key.midi, settings.soundEnabled],
  );

  const press = (key: PianoKey) => {
    if (!question.toKey) return;
    setLastPressed(key.midi);
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(keyAnswer(key.midi));
  };

  // The octave numbers double as their own shortcuts — but only when a number
  // is what is being asked for.
  const shortcuts = useMemo(
    () =>
      Object.fromEntries(
        options.map((option) => [option.label, () => nameOctave(option.value)]),
      ),
    [nameOctave, options],
  );
  useKeyboardShortcuts(shortcuts, !question.toKey);

  const givenKey = layout.keys.find((key) => keyAnswer(key.midi) === given);

  return (
    <DrillShell
      goal="Note and octave together: name the lit key's octave, and find an exact key by name."
      steps={[
        'Name it: find the C at or below the lit key — that C names the octave.',
        'Find it: place the letter from its landmark first, then count octaves from middle C.',
        'Answer with a number button or the number keys; in Find it, press the key itself.',
      ]}
      watchFor="Counting octaves from the left edge of the board. Middle C is the anchor — everything is one or two octaves from it."
      aside={
        <>
          <Field label="Direction" hint="Find it is the harder half — and the real test.">
            <SegmentedControl
              value={direction}
              options={DIRECTIONS}
              onChange={setDirection}
              block
              ariaLabel="Direction"
            />
          </Field>
          <Field label="Keyboard" hint="A wider board has more octaves to tell apart.">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Field label="Keys" hint="A black key takes the number of the C below it, like any other.">
            <SegmentedControl
              value={scope}
              options={SCOPES}
              onChange={setScope}
              block
              ariaLabel="Keys asked about"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="The letters help you find the key; the octave is still yours to work out."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={question.toKey ? 'Find this exact key' : 'Which octave is lit?'}
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">{keyLabel(question.key)}</Chip>}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {question.toKey
                  ? `That was ${givenKey ? keyLabel(givenKey) : 'the wrong key'}`
                  : `Not octave ${given?.slice(1)} — find the C below`}
              </Chip>
            )}
            {!settled && (
              <Chip>
                {question.toKey ? 'Landmark first, then the octave' : 'The number turns over at every C'}
              </Chip>
            )}
          </>
        }
      >
        {question.toKey
          ? keyLabel(question.key)
          : verdict === 'correct'
            ? question.key.octave
            : '?'}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          // Name it lights the key being asked about; Find it only shows where
          // a right answer landed.
          litMidis={
            question.toKey
              ? verdict === 'correct' && lastPressed !== null
                ? [lastPressed]
                : undefined
              : [question.key.midi]
          }
          secondaryMidis={
            question.toKey && verdict === 'wrong' && lastPressed !== null
              ? [lastPressed]
              : undefined
          }
          showNames={showNames || settled}
          onKeyPress={question.toKey ? press : undefined}
          footerNote={
            question.toKey ? 'Press the exact key asked for' : 'Name the octave of the lit key'
          }
        />
      </div>

      {!question.toKey && (
        <LabelButtons
          options={options}
          onAnswer={nameOctave}
          correct={settled ? expected : null}
          wrong={verdict === 'wrong' ? given : null}
        />
      )}

      <p className={styles.landmark}>{OCTAVE_HINT}</p>
    </DrillShell>
  );
}
