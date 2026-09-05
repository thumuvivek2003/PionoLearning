import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { noteLabel } from '@/features/music-theory';
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
import { accidentalsOf, differencesBetween, scaleShape, signatureOf } from '../data/scaleShapes';
import type { ScaleShape } from '../data/scaleShapes';
import { accidentalOrder, accidentalPitch, majorKey, ordinal } from '../data/keyFamily';
import { MAJOR, MINOR, relativeMajorOf, relativeMinorOf, sameNotes, scaleName } from '../data/relatives';
import { semitonesOf, stepKeys, stepLabel } from '../data/steps';
import type { Step } from '../data/steps';
import type { QuizTask, ScaleQuizConfig } from '../data/scaleDrills';
import { ScaleKeyboard } from '../components/ScaleKeyboard';
import styles from '../components/scales.module.css';

const LAYOUT_ID = '25';
const MIXED = 'mixed';

/** An answer worth calling quick, once a step is a distance rather than a sum. */
const TARGET_MS = 1500;

const TASK_LABELS: Readonly<Record<QuizTask, string>> = {
  'step-up': 'Play it',
  'step-name': 'Name it',
  degree: 'Degrees',
  membership: 'In or out',
  accidental: 'Which one',
  difference: 'What differs',
  signature: 'How many',
  order: 'Which one next',
  relative: 'Its relative',
  shares: 'Same notes',
  position: 'Which degree',
  neighbour: 'What comes next',
};

interface Prompt {
  id: string;
  task: QuizTask;
  /** The key the question starts from, or the one it lights. */
  from: PianoKey;
  /** For the interval tasks: the step and which way it goes. */
  step?: Step;
  direction?: 1 | -1;
  /** For the degree and accidental tasks: which degree, counting from 1. */
  degree?: number;
  /** For the comparison tasks: the other scale in question. */
  against?: string;
  /** For the ordering task: which place in the accumulation order. */
  position?: number;
  /** For the relative and shares tasks: which side of the pair is being asked. */
  fromMinor?: boolean;
  /** For the shares task: whether the pair really is one. */
  related?: boolean;
}

/** Answers of every task in one space, so a single pool can serve them all. */
const keyAnswer = (pitchClass: PitchClass) => `k${pitchClass}`;
const stepAnswer = (step: Step) => `s${step}`;
const yesNo = (inScale: boolean) => (inScale ? 'yes' : 'no');
const countAnswer = (count: number) => `n${count}`;

/**
 * The two scales a shares question puts side by side.
 *
 * A true pair is a major and the minor built on its sixth; a false one borrows
 * the relative minor of a different key, so the answer is not always yes. The
 * answer and the wording both read it from here, which is what keeps a prompt
 * from naming one pair while the answer grades another.
 */
function sharePairOf(config: ScaleQuizConfig, prompt: Prompt): { major: string; minor: string | null } {
  const major = prompt.against ?? config.root;
  const minor = prompt.related
    ? relativeMinorOf(major)
    : relativeMinorOf((config.compareWith ?? []).find((entry) => entry !== major) ?? major);
  return { major, minor };
}

/** How a degree is spelled in this scale — Bb in D minor, never A#. */
function noteAt(shape: ScaleShape | null, degree: number): string {
  return shape?.notes[degree - 1]?.name ?? String(degree);
}

/** The tonic a relative question wants pressed, either way round. */
function relativeTonicOf(config: ScaleQuizConfig, prompt: Prompt): PitchClass {
  const major = prompt.against ?? config.root;
  const name = prompt.fromMinor ? relativeMajorOf(relativeMinorOf(major) ?? major) : relativeMinorOf(major);
  const shape = name ? scaleShape(name, prompt.fromMinor ? MAJOR : MINOR) : null;
  return (shape?.pitchClasses[0] ?? 0) as PitchClass;
}

function buildPool(
  layout: KeyboardLayout,
  config: ScaleQuizConfig,
  task: string,
  scalePitches: readonly PitchClass[],
): readonly Prompt[] {
  const wanted = task === MIXED ? config.tasks : config.tasks.filter((entry) => entry === task);
  const directions: (1 | -1)[] = config.bothWays ? [1, -1] : [1];
  const prompts: Prompt[] = [];

  for (const entry of wanted) {
    if (entry === 'step-up' || entry === 'step-name') {
      for (const from of layout.keys) {
        for (const step of config.steps) {
          for (const direction of directions) {
            // A step that runs off the end of the board is not a question.
            const target = from.midi + semitonesOf(step) * direction;
            if (!layout.keys.some((key) => key.midi === target)) continue;
            prompts.push({ id: `${entry}-${from.midi}-${step}-${direction}`, task: entry, from, step, direction });
          }
        }
      }
      continue;
    }
    if (entry === 'degree') {
      const root = layout.keys.find((key) => key.pitchClass === scalePitches[0]);
      if (!root) continue;
      for (let degree = 1; degree <= scalePitches.length; degree += 1) {
        prompts.push({ id: `degree-${degree}`, task: entry, from: root, degree });
      }
      continue;
    }
    if (entry === 'position') {
      const root = layout.keys.find((key) => key.pitchClass === scalePitches[0]);
      if (!root) continue;
      // Degree → note is the question the last bucket asked. This is the way
      // round that lags: a note arrives and its job has to be recognised.
      for (let degree = 1; degree <= scalePitches.length; degree += 1) {
        prompts.push({ id: `position-${degree}`, task: entry, from: root, degree });
      }
      continue;
    }
    if (entry === 'neighbour') {
      const root = layout.keys.find((key) => key.pitchClass === scalePitches[0]);
      if (!root) continue;
      for (let degree = 1; degree <= scalePitches.length; degree += 1) {
        for (const direction of directions) {
          prompts.push({
            id: `next-${degree}-${direction}`,
            task: entry,
            from: root,
            degree,
            direction,
          });
        }
      }
      continue;
    }
    if (entry === 'membership') {
      for (const key of layout.keys) {
        prompts.push({ id: `member-${key.midi}`, task: entry, from: key });
      }
      continue;
    }

    const root = layout.keys.find((key) => key.pitchClass === scalePitches[0]);
    if (!root) continue;

    if (entry === 'relative') {
      for (const against of config.compareWith ?? []) {
        prompts.push({ id: `rel-${against}`, task: entry, from: root, against });
        // Backwards is a different skill: counting up to the sixth is easy,
        // recognising which major a minor belongs to is the one that lags.
        if (config.bothWays) {
          prompts.push({ id: `rel-back-${against}`, task: entry, from: root, against, fromMinor: true });
        }
      }
      continue;
    }

    if (entry === 'shares') {
      const majors = config.compareWith ?? [];
      for (const against of majors) {
        prompts.push({ id: `share-${against}`, task: entry, from: root, against, related: true });
        // And the same major beside a minor that is not its own, so yes is not
        // always the answer. Which minor that is comes from `sharePairOf`.
        if (majors.length > 1) {
          prompts.push({ id: `share-no-${against}`, task: entry, from: root, against, related: false });
        }
      }
      continue;
    }

    if (entry === 'order') {
      const order = accidentalOrder(config.accidentalOrder ?? 'sharp');
      order.forEach((_name, index) => {
        prompts.push({ id: `order-${index}`, task: entry, from: root, position: index + 1 });
      });
      // The same order asked from the other end: a key, and what it added to
      // the key before it. Knowing the list and knowing which key needs which
      // entry are separate pieces of knowledge, and the second is the useful one.
      for (const against of config.compareWith ?? []) {
        const key = majorKey(against);
        if (!key || key.count === 0) continue;
        prompts.push({ id: `order-key-${against}`, task: entry, from: root, against, position: key.count });
      }
      continue;
    }

    if (entry === 'accidental') {
      // Only the degrees that actually carry an accidental are worth asking.
      const shape = scaleShape(config.root, config.scale ?? MAJOR);
      const altered = shape?.notes.flatMap((note, index) => (note.name.length > 1 ? [index + 1] : []));
      for (const degree of altered ?? []) {
        prompts.push({ id: `alt-${degree}`, task: entry, from: root, degree });
      }
      continue;
    }

    for (const against of config.compareWith ?? []) {
      prompts.push({ id: `${entry}-${against}`, task: entry, from: root, against });
      // A signature question is worth asking about this key as well as the other.
      if (entry === 'signature') {
        prompts.push({ id: `${entry}-self`, task: entry, from: root, against: config.root });
      }
    }
  }

  return prompts;
}

/**
 * 4.1.1, 4.1.2 and 4.2.1 — the facts a scale is assembled from.
 *
 * One engine for three practices because they are one kind of question asked
 * about different things: how far is that, what is this gap, which note is the
 * fifth, does F# belong. Answers all live in one space — a key pressed, a step
 * named, or yes and no — so a single pool can hold every task and the draw can
 * mix them.
 *
 * Scores are filed under what was actually being tested: the step for an
 * interval question, the degree for a degree question. That is what lets the
 * panel say "the fifth is your slow one" rather than reporting a number that
 * covers everything equally.
 */
export function ScaleQuizDrill({ config }: { config: ScaleQuizConfig }) {
  const [task, setTask] = useState<string>(config.tasks[0] ?? MIXED);
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const shape = useMemo(() => scaleShape(config.root, config.scale ?? MAJOR), [config.root, config.scale]);
  const scalePitches = useMemo(() => shape?.pitchClasses ?? [], [shape]);

  const pool = useMemo(
    () => buildPool(layout, config, task, scalePitches),
    [config, layout, scalePitches, task],
  );

  const answerOf = useMemo(
    () => (prompt: Prompt) => {
      if (prompt.task === 'step-name') return stepAnswer(prompt.step ?? 'W');
      if (prompt.task === 'membership') return yesNo(scalePitches.includes(prompt.from.pitchClass));
      if (prompt.task === 'degree' || prompt.task === 'accidental') {
        return keyAnswer((scalePitches[(prompt.degree ?? 1) - 1] ?? 0) as PitchClass);
      }
      if (prompt.task === 'position') return countAnswer(prompt.degree ?? 1);
      if (prompt.task === 'neighbour') {
        const count = scalePitches.length;
        const from = (prompt.degree ?? 1) - 1;
        const next = (from + (prompt.direction ?? 1) + count) % count;
        return keyAnswer((scalePitches[next] ?? 0) as PitchClass);
      }
      if (prompt.task === 'relative') return keyAnswer(relativeTonicOf(config, prompt));
      if (prompt.task === 'shares') {
        const pair = sharePairOf(config, prompt);
        return yesNo(
          sameNotes(
            scaleShape(pair.major, MAJOR),
            pair.minor ? scaleShape(pair.minor, MINOR) : null,
          ),
        );
      }
      if (prompt.task === 'order') {
        const order = accidentalOrder(config.accidentalOrder ?? 'sharp');
        return keyAnswer(accidentalPitch(order[(prompt.position ?? 1) - 1] ?? 'F#'));
      }
      if (prompt.task === 'signature') {
        const other = scaleShape(prompt.against ?? config.root, config.compareScale ?? MAJOR);
        return countAnswer(other ? accidentalsOf(other).length : 0);
      }
      if (prompt.task === 'difference') {
        const other = scaleShape(prompt.against ?? 'C', config.compareScale ?? MAJOR);
        const degrees = shape && other ? differencesBetween(shape, other) : [];
        return countAnswer(degrees[0] ?? 0);
      }
      const target = prompt.from.midi + semitonesOf(prompt.step ?? 'W') * (prompt.direction ?? 1);
      return keyAnswer(((target % 12) + 12) % 12 as PitchClass);
    },
    [config, scalePitches, shape],
  );

  /** Filed under the thing being tested, not under the key it happened on. */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) => {
      if (prompt.task === 'degree') return `degree ${prompt.degree}`;
      if (prompt.task === 'accidental') return `${config.root} degree ${prompt.degree}`;
      if (prompt.task === 'signature') return `${prompt.against} signature`;
      if (prompt.task === 'position' || prompt.task === 'neighbour') {
        const name = noteAt(shape, prompt.degree ?? 1);
        return prompt.task === 'position'
          ? `${name} degree`
          : `${(prompt.direction ?? 1) > 0 ? 'after' : 'before'} ${name}`;
      }
      if (prompt.task === 'relative') {
        return prompt.fromMinor ? `${prompt.against} minor → major` : `${prompt.against} → its minor`;
      }
      if (prompt.task === 'shares') return `${prompt.against} pairing`;
      if (prompt.task === 'order') {
        return `${ordinal(prompt.position ?? 1)} ${config.accidentalOrder ?? 'sharp'}`;
      }
      if (prompt.task === 'difference') return `${config.root} against ${prompt.against}`;
      if (prompt.task === 'membership') return 'in or out';
      const way = (prompt.direction ?? 1) > 0 ? 'up' : 'down';
      return `${stepLabel(prompt.step ?? 'W')} ${way}`;
    },
    [config.accidentalOrder, config.root, shape],
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

  const buttons =
    question.task === 'step-name' || question.task === 'membership' || question.task === 'shares';
  const numeric =
    question.task === 'difference' || question.task === 'signature' || question.task === 'position';

  const press = (key: PianoKey) => {
    if (buttons || numeric) return;
    setLastPressed(key.midi);
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(keyAnswer(key.pitchClass));
  };

  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });
  /** The word for one entry in the accumulation order, for the copy. */
  const accidentalWord = config.accidentalOrder ?? 'sharp';
  const ordering = question.task === 'order';
  const relating = question.task === 'relative';
  /** How this practice's own scale reads: "A minor" rather than just "A". */
  const selfName = scaleName(config.root, config.scale ?? MAJOR);
  /** The pair a shares question is asking about, read from the same place the answer is. */
  const pair = sharePairOf(config, question);
  const sharePair = { major: pair.major, minor: pair.minor ?? '?' };
  const target =
    question.task === 'step-up'
      ? question.from.midi + semitonesOf(question.step ?? 'W') * (question.direction ?? 1)
      : null;
  const answering = buttons || numeric;
  const against = question.against ? scaleShape(question.against, config.compareScale ?? MAJOR) : null;
  /** Counts are the answers a comparison offers: degrees, or accidentals. */
  const numberOptions = (
    question.task === 'signature'
      ? [0, 1, 2, 3, 4, 5]
      : question.task === 'position'
        ? [1, 2, 3, 4, 5, 6, 7]
        : [0, 1, 2, 3, 4, 5, 6, 7]
  ).map((count) => ({
    value: countAnswer(count),
    label: count === 0 && question.task === 'difference' ? 'none' : String(count),
    sub:
      question.task === 'signature'
        ? count === 1
          ? 'accidental'
          : 'accidentals'
        : count === 0
          ? 'the same notes'
          : 'degree',
  }));

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          {config.tasks.length > 1 && (
            <Field label="Ask" hint="Mixed keeps every way of asking in play.">
              <SegmentedControl
                value={task}
                options={[
                  ...config.tasks.map((entry) => ({ value: entry, label: TASK_LABELS[entry] })),
                  { value: MIXED, label: 'Mixed' },
                ]}
                onChange={setTask}
                block
                ariaLabel="Question type"
              />
            </Field>
          )}
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Asks more often for whatever you are slowest on."
          />
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill — the distance is what you are counting, not the letters."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more answers." />
        </>
      }
    >
      <DrillPrompt
        label={
          question.task === 'step-up'
            ? `${stepLabel(question.step ?? 'W')} ${(question.direction ?? 1) > 0 ? 'up' : 'down'} · ${stepKeys(question.step ?? 'W')}`
            : question.task === 'step-name'
              ? 'How far apart are the lit keys?'
              : question.task === 'degree'
              ? `Find degree ${question.degree} of ${shape?.label ?? config.root}`
            : question.task === 'membership'
              ? `Is this note in ${selfName}?`
            : question.task === 'position'
              ? `Which degree of ${shape?.label ?? config.root} is this?`
            : question.task === 'neighbour'
              ? `${(question.direction ?? 1) > 0 ? 'After' : 'Before'} ${noteAt(shape, question.degree ?? 1)} in ${shape?.label ?? config.root}?`
            : relating
              ? question.fromMinor
                ? `Which major shares its notes with ${relativeMinorOf(question.against ?? config.root) ?? '?'} minor?`
                : `Relative minor of ${question.against ?? config.root} major?`
            : question.task === 'shares'
              ? `${sharePair.major} major and ${sharePair.minor} minor — the same seven notes?`
            : ordering
              ? question.against
                ? `${question.against} major — which ${accidentalWord} does it add?`
                : `Which ${accidentalWord} comes ${ordinal(question.position ?? 1)} in the order?`
              : question.task === 'accidental'
                ? `Degree ${question.degree} of ${shape?.label ?? config.root} — natural or altered?`
                : question.task === 'signature'
                  ? `How many sharps or flats has ${against?.label ?? question.against}?`
                  : `Which degree differs between ${shape?.label ?? config.root} and ${against?.label ?? question.against}?`
        }
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Right</Chip>}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {relating
                  ? 'Count the degrees of the major scale, not the semitones'
                  : ordering
                  ? 'Walk the order from the start'
                  : question.task === 'step-up'
                  ? 'Count the keys again — black ones included'
                  : question.task === 'accidental'
                    ? 'The formula decides this, not the colour of the key'
                    : 'Not that one'}
              </Chip>
            )}
            {!settled && (
              <Chip>
                {question.task === 'position'
                  ? 'Count from the tonic, not from C'
                  : question.task === 'neighbour'
                    ? 'The next note of the scale, not the next key along'
                  : relating
                  ? question.fromMinor
                    ? 'Count up three degrees from the minor'
                    : 'The sixth degree, counting from the root'
                  : question.task === 'shares'
                    ? 'Same notes means the same key signature'
                  : ordering
                  ? accidentalWord === 'sharp'
                    ? 'F# first, then a fifth up each time'
                    : 'Bb first, then a fifth down each time'
                  : question.task === 'membership'
                  ? `${selfName} — ${shape ? signatureOf(shape) : ''}`
                  : question.task === 'signature'
                    ? 'Sharps arrive late, flats arrive early'
                    : question.task === 'difference'
                      ? 'One degree, counting from the root'
                      : question.task === 'accidental'
                        ? 'Work the step out before you answer'
                        : question.task === 'degree'
                          ? 'Count degrees, not keys'
                          : 'Include the black keys'}
              </Chip>
            )}
          </>
        }
      >
        {question.task === 'position' || question.task === 'neighbour'
          ? noteAt(shape, question.degree ?? 1)
          : relating
          ? (question.fromMinor
              ? `${relativeMinorOf(question.against ?? config.root) ?? '?'}m`
              : (question.against ?? config.root))
          : question.task === 'shares'
            ? `${sharePair.major} / ${sharePair.minor}m`
          : ordering
          ? (question.against ?? ordinal(question.position ?? 1))
          : question.task === 'degree' || question.task === 'accidental'
          ? question.degree
          : question.task === 'signature'
            ? (against?.root ?? '?')
            : question.task === 'difference'
              ? '?'
              : question.task === 'membership'
                ? noteLabel(question.from.pitchClass, 'both').label
                : question.from.sharpName}
      </DrillPrompt>

      <div className={styles.board}>
        <ScaleKeyboard
          layoutId={LAYOUT_ID}
          lit={
            question.task === 'degree' ||
            question.task === 'accidental' ||
            numeric ||
            ordering ||
            relating ||
            question.task === 'neighbour'
              ? undefined
              : [question.from.midi]
          }
          secondary={
            question.task === 'step-name' && target !== null
              ? [target]
              : verdict === 'wrong' && lastPressed !== null
                ? [lastPressed]
                : settled && question.task === 'step-up' && target !== null
                  ? [target]
                  : undefined
          }
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote={answering ? 'Answer below' : 'Press the key you were asked for'}
        />
      </div>

      {numeric && (
        <div className={styles.steps}>
          {numberOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.step}
              disabled={settled}
              onClick={() => drill.answer(option.value)}
            >
              {option.label}
              <span className={styles.stepSub}>{option.sub}</span>
            </button>
          ))}
        </div>
      )}

      {buttons && (
        <div className={styles.steps}>
          {(question.task === 'step-name'
            ? ([
                { value: stepAnswer('W'), label: 'Whole', sub: '2 keys' },
                { value: stepAnswer('H'), label: 'Half', sub: '1 key' },
              ] as const)
            : question.task === 'shares'
              ? ([
                  { value: 'yes', label: 'Same notes', sub: 'one is the relative of the other' },
                  { value: 'no', label: 'Different', sub: 'not a pair' },
                ] as const)
              : ([
                  { value: 'yes', label: 'In it', sub: `part of ${selfName}` },
                  { value: 'no', label: 'Out', sub: 'not in the scale' },
                ] as const)
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.step}
              disabled={settled}
              onClick={() => drill.answer(option.value)}
            >
              {option.label}
              <span className={styles.stepSub}>{option.sub}</span>
            </button>
          ))}
        </div>
      )}

      <p className={styles.note}>
        A whole step is two keys, a half step is one — counting the black keys both times.
      </p>
    </DrillShell>
  );
}
