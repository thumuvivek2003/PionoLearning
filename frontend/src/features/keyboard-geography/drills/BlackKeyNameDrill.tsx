import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PitchClass } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { BLACK_KEYS, blackKeySpec, groupLabel } from '../data/blackKeys';
import type { BlackNaming } from '../data/blackKeyDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import styles from '../components/geography.module.css';

type Direction = 'toName' | 'toKey' | 'mixed';

interface Prompt {
  id: string;
  pitchClass: PitchClass;
  /** Set for "name this lit key" prompts. */
  midi?: number;
  toKey: boolean;
}

const DIRECTIONS = [
  { value: 'toName' as Direction, label: 'Name it' },
  { value: 'toKey' as Direction, label: 'Find it' },
  { value: 'mixed' as Direction, label: 'Mixed' },
];

const NAMING_COPY: Readonly<
  Record<BlackNaming, { goal: string; steps: readonly string[]; watchFor: string; noun: string }>
> = {
  position: {
    noun: 'position',
    goal: 'Random black key → where it sits in its group, with no note name involved.',
    steps: [
      'Look at the lit key and find its group first — 2 or 3.',
      'Then say which one of the group it is.',
      'Find mode reverses it: you are given a position, go and press that key.',
    ],
    watchFor:
      'Reaching for a note name. This step is pure position — naming comes next, and it is easier once this is automatic.',
  },
  sharp: {
    noun: 'sharp name',
    goal: 'Random black key → its sharp name in about a second.',
    steps: [
      'Group first, then position, then the name.',
      'Say it out loud and play it on your real keyboard.',
      'Do not only run left to right — the drill jumps around on purpose.',
    ],
    watchFor:
      'Counting up from C to name it. Use the group: the pair is C# D#, the three are F# G# A#.',
  },
  flat: {
    noun: 'flat name',
    goal: 'The same five keys under their flat names — one key, a second name.',
    steps: [
      'Group first, then position, then the flat name.',
      'Say both names as you play it: "D flat, also C sharp".',
      'Find mode asks for a flat and you press the key.',
    ],
    watchFor:
      'Treating flats as new keys. Db is not a different key from C# — it is the same one with another name.',
  },
};

function optionsFor(naming: BlackNaming) {
  return BLACK_KEYS.map((spec) => ({
    value: spec.pitchClass,
    label:
      naming === 'position'
        ? spec.positionLabel
        : naming === 'sharp'
          ? spec.sharpName
          : spec.flatName,
    sub: naming === 'position' ? groupLabel(spec.group) : undefined,
  }));
}

function buildPool(direction: Direction, layoutId: string): readonly Prompt[] {
  const prompts: Prompt[] = [];

  if (direction !== 'toKey') {
    // One prompt per physical black key, so the same name is met all over the board.
    for (const key of getKeyboardLayout(layoutId).keys) {
      if (!key.isBlack) continue;
      prompts.push({ id: `n-${key.midi}`, pitchClass: key.pitchClass, midi: key.midi, toKey: false });
    }
  }

  if (direction !== 'toName') {
    for (const spec of BLACK_KEYS) {
      prompts.push({ id: `k-${spec.pitchClass}`, pitchClass: spec.pitchClass, toKey: true });
    }
  }

  return prompts;
}

/**
 * 1.2.10 – 1.2.12 — the five black keys by position, by sharp name, by flat name.
 *
 * One screen with three vocabularies: the question and the answer set change,
 * the route does not. Group → position → name is the order the bucket teaches,
 * and the three drills are those three steps.
 */
export function BlackKeyNameDrill({ naming }: { naming: BlackNaming }) {
  const [direction, setDirection] = useState<Direction>('toName');
  const [layoutId, setLayoutId] = useState('25');
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const copy = NAMING_COPY[naming];
  const options = useMemo(() => optionsFor(naming), [naming]);
  const pool = useMemo(() => buildPool(direction, layoutId), [direction, layoutId]);
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.pitchClass, []);

  const drill = useQuizDrill<Prompt, PitchClass>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';
  const spec = blackKeySpec(question.pitchClass);
  const askedLabel = options.find((option) => option.value === question.pitchClass)?.label ?? '?';

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  const press = (key: PianoKey) => {
    if (!key.isBlack) return;
    setLastPressed(key.midi);
    if (settings.soundEnabled) instrument.play([key.pitchClass]);
    drill.answer(key.pitchClass);
  };

  return (
    <DrillShell
      goal={copy.goal}
      steps={copy.steps}
      watchFor={copy.watchFor}
      aside={
        <>
          <Field label="Direction">
            <SegmentedControl
              value={direction}
              options={DIRECTIONS}
              onChange={setDirection}
              block
              ariaLabel="Direction"
            />
          </Field>
          <Field label="Keyboard">
            <SegmentedControl
              value={layoutId}
              options={[
                { value: '25', label: '25 keys' },
                { value: '49', label: '49 keys' },
                { value: '61', label: '61 keys' },
              ]}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="The keys are printed with both names — leave it off to make this recall."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={question.toKey ? `Find this ${copy.noun}` : `Which ${copy.noun}?`}
        wide={question.toKey && naming === 'position'}
        footer={
          <>
            {verdict === 'correct' && spec && (
              <Chip tone="accent">
                {spec.sharpName} / {spec.flatName} · {spec.positionLabel}
              </Chip>
            )}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                That is {blackKeySpec(given ?? -1)?.sharpName ?? 'a white key'} — try again
              </Chip>
            )}
            {!settled && (
              <Chip>{question.toKey ? 'Press it on the keyboard' : 'Group, then position'}</Chip>
            )}
          </>
        }
      >
        {question.toKey ? askedLabel : '?'}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={
            question.toKey
              ? settled && verdict === 'correct' && lastPressed !== null
                ? [lastPressed]
                : undefined
              : question.midi !== undefined
                ? [question.midi]
                : undefined
          }
          secondaryMidis={
            question.toKey && verdict === 'wrong' && lastPressed !== null ? [lastPressed] : undefined
          }
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote={question.toKey ? 'Press the black key asked for' : 'Name the lit black key'}
        />
      </div>

      {!question.toKey && (
        <LabelButtons
          options={options}
          onAnswer={drill.answer}
          correct={settled ? expected : null}
          wrong={verdict === 'wrong' ? given : null}
        />
      )}
    </DrillShell>
  );
}
