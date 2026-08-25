import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { SHARP_NAMES, noteKey, noteLabel } from '@/features/music-theory';
import type { PitchClass } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  WeakSpots,
  useQuizDrill,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { anchorOf, blackPlace, groupSizeOf } from '../data/blackKeyFocus';
import type { BlackKeyConfig, BlackTask } from '../data/blackKeyFocus';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** Two octaves is plenty: every group appears more than once. */
const LAYOUT_ID = '25';

/** What a black key should cost once it is a place rather than a calculation. */
const TARGET_MS = 1500;

const MIXED = 'mixed';

const TASK_LABELS: Readonly<Record<BlackTask, string>> = {
  find: 'Find it',
  name: 'Name it',
  group: 'Which group',
  white: 'Its white key',
};

interface Prompt {
  id: string;
  task: BlackTask;
  pitchClass: PitchClass;
  /** The lit key, for the tasks that show one. */
  midi?: number;
  /** Which spelling the prompt uses, for the ones that name it. */
  flat?: boolean;
}

/** Answers of every task in one space: a key pressed, or a group named. */
const keyAnswer = (pitchClass: PitchClass) => `k${pitchClass}`;
const groupAnswer = (size: 2 | 3) => `g${size}`;

function buildPool(
  layout: KeyboardLayout,
  config: BlackKeyConfig,
  task: string,
): readonly Prompt[] {
  const wanted = task === MIXED ? config.tasks : config.tasks.filter((entry) => entry === task);
  const lit = layout.keys.filter((key) => config.keys.includes(key.pitchClass));
  const prompts: Prompt[] = [];

  // Naming a key asks about one physical key; finding one accepts any octave.
  for (const entry of wanted) {
    if (entry === 'find') {
      for (const pitchClass of config.keys) {
        const spellings = config.naming === 'both' ? [false, true] : [config.naming === 'flat'];
        for (const flat of spellings) {
          prompts.push({ id: `f-${pitchClass}-${flat}`, task: entry, pitchClass, flat });
        }
      }
      continue;
    }
    for (const key of lit) {
      prompts.push({ id: `${entry}-${key.midi}`, task: entry, pitchClass: key.pitchClass, midi: key.midi });
    }
  }

  return prompts;
}

/**
 * 2.9.1 – 2.9.6 and 2.9.8 — the five black keys as places.
 *
 * The reference asks for three directions and this drill runs all of them: name
 * to key, key to name, and the geography underneath both — which group is this,
 * and which white key does the group hang off. Everything it needs comes from
 * the pitch class, so a prompt knows where it sits without anyone writing it
 * down.
 *
 * Scores are kept per *spelling* rather than per key, which is the part worth
 * having: almost everyone reaches C# faster than Db even though they are one
 * key, and a ledger that merged them could never say so.
 */
export function BlackKeyFocusDrill({ config }: { config: BlackKeyConfig }) {
  const [task, setTask] = useState<string>(config.tasks[0] ?? MIXED);
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const pool = useMemo(() => buildPool(layout, config, task), [config, layout, task]);

  const answerOf = useMemo(
    () => (prompt: Prompt) => {
      if (prompt.task === 'group') return groupAnswer(groupSizeOf(prompt.pitchClass));
      if (prompt.task === 'white') return keyAnswer(anchorOf(prompt.pitchClass));
      return keyAnswer(prompt.pitchClass);
    },
    [],
  );
  /** Spellings are scored apart — Db being slower than C# is worth knowing. */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) =>
      prompt.task === 'find'
        ? noteLabel(prompt.pitchClass, prompt.flat ? 'flat' : 'sharp').label
        : prompt.task === 'group'
          ? `group of ${groupSizeOf(prompt.pitchClass)}`
          : prompt.task === 'white'
            ? `anchor of ${noteKey(prompt.pitchClass, 'both')}`
            : noteKey(prompt.pitchClass, 'both'),
    [],
  );

  const drill = useQuizDrill<Prompt, string>({
    pool,
    answerOf,
    scoreKeyOf,
    strategyId: focusWeak ? 'weak-focus' : 'no-repeat',
  });
  const { question, verdict, stats } = drill;
  const settled = verdict !== 'waiting';

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  const press = (key: PianoKey) => {
    if (question.task === 'name' || question.task === 'group') return;
    setLastPressed(key.midi);
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(keyAnswer(key.pitchClass));
  };

  const nameOptions = useMemo(
    () =>
      config.keys.map((pitchClass) => ({
        value: keyAnswer(pitchClass),
        ...noteLabel(pitchClass, config.naming),
      })),
    [config.keys, config.naming],
  );
  const groupOptions = [
    { value: groupAnswer(2), label: '2', sub: 'black keys' },
    { value: groupAnswer(3), label: '3', sub: 'black keys' },
  ];

  const asked = noteLabel(question.pitchClass, question.flat ? 'flat' : 'sharp');
  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });
  const answering = question.task === 'name' || question.task === 'group';

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {config.tasks.length > 1 && (
            <Field label="Direction" hint="Mixed keeps all the ways of asking in play.">
              <SegmentedControl
                value={task}
                options={[
                  ...config.tasks.map((entry) => ({ value: entry, label: TASK_LABELS[entry] })),
                  { value: MIXED, label: 'Mixed' },
                ]}
                onChange={setTask}
                block
                ariaLabel="Direction"
              />
            </Field>
          )}
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Calls the spelling you are slowest on more often."
          />
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill — the group shape is the only clue you need."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more keys." />
        </>
      }
    >
      <DrillPrompt
        label={
          question.task === 'find'
            ? 'Find this key'
            : question.task === 'name'
              ? 'Which black key is lit?'
              : question.task === 'group'
                ? 'How many black keys in its group?'
                : 'Press the white key its group hangs off'
        }
        footer={
          <>
            {verdict === 'correct' && (
              <Chip tone="accent">
                {question.task === 'white'
                  ? `${SHARP_NAMES[anchorOf(question.pitchClass)]} — ${blackPlace(question.pitchClass)} sits above it`
                  : `${noteKey(question.pitchClass, 'both')} · ${blackPlace(question.pitchClass)}`}
              </Chip>
            )}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {question.task === 'group'
                  ? `That group has ${groupSizeOf(question.pitchClass)}`
                  : `Not that one — ${blackPlace(question.pitchClass)}`}
              </Chip>
            )}
            {!settled && (
              <Chip>{question.task === 'find' ? 'Group first, then the key' : 'Read the shape'}</Chip>
            )}
          </>
        }
      >
        {question.task === 'find' ? asked.label : '?'}
      </DrillPrompt>

      <div className={styles.board}>
        <HandKeyboard
          layoutId={LAYOUT_ID}
          // Naming tasks light the key in question; finding ones reveal the hit.
          lit={
            question.midi !== undefined
              ? [question.midi]
              : verdict === 'correct' && lastPressed !== null
                ? [lastPressed]
                : undefined
          }
          wrong={verdict === 'wrong' && lastPressed !== null ? lastPressed : null}
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote={
            question.task === 'white'
              ? 'Press the white key left of that group'
              : question.task === 'find'
                ? 'Press it in any octave'
                : 'Answer below'
          }
        />
      </div>

      {answering && (
        <div className={styles.choices}>
          {(question.task === 'group' ? groupOptions : nameOptions).map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.choice}
              disabled={settled}
              onClick={() => drill.answer(option.value)}
            >
              {option.label}
              {'sub' in option && option.sub ? <span className={styles.choiceSub}>{option.sub}</span> : null}
            </button>
          ))}
        </div>
      )}

      <p className={styles.note}>
        2 black keys sit above C and D · 3 black keys sit above F, G and A. The pattern repeats the
        whole way up.
      </p>
    </DrillShell>
  );
}
