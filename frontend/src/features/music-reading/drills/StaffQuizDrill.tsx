import { useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { LETTERS } from '@/features/music-theory';
import type { Letter } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import {
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  TimerBar,
  WeakSpots,
  useAnswerDeadline,
  useQuizDrill,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import type { Clef, Step } from '../reading.types';
import { ANCHOR, clefName, isLine, noteAt, placeLabel, placeOf } from '../data/staff';
import type { Accidental } from '../data/accidentals';
import { ACCIDENTALS, GLYPH, SIGN_EFFECT, SIGN_NAME, alteredNote, shiftOf } from '../data/accidentals';
import {
  KEY_SIGNATURES,
  altersLetter,
  signatureLine,
  signatureOf,
  signatureSteps,
} from '../data/keySignatures';
import type { ReadingConfig, ReadTask } from '../data/readingDrills';
import { drawableSteps } from '../data/readingDrills';
import { Staff } from '../components/Staff';
import type { StaffMark } from '../components/Staff';
import { ReadingKeyboard } from '../components/ReadingKeyboard';
import styles from '../components/reading.module.css';

const LAYOUT_ID = '49';
const MIXED = 'mixed';
/** Reading, not counting: past this the answer was worked out. */
const TARGET_MS = 2000;
/** How many notes a contour question shows. */
const RUN_LENGTH = 4;
/** The five shapes 6.10.2 asks about; the first three are 6.1.5's. */
const SHAPES = ['up', 'down', 'same', 'wave', 'broken'] as const;
type Shape = (typeof SHAPES)[number];

const TASK_LABELS: Readonly<Record<ReadTask, string>> = {
  line: 'Which line',
  space: 'Which space',
  place: 'Line or space',
  higher: 'Which is higher',
  direction: 'Which way',
  clef: 'Which clef',
  anchor: 'Its own line',
  name: 'Name it',
  'place-note': 'Put it there',
  key: 'Play it',
  accidental: 'Which sign',
  'sign-effect': 'What it does',
  'altered-key': 'Play what it asks',
  signature: 'Which key',
  'signature-count': 'How many',
  'signature-vs-accidental': 'Which altered it',
  distance: 'How far',
  motion: 'How it moved',
  pattern: 'Which shape',
};

interface Prompt {
  id: string;
  task: ReadTask;
  clef: Clef;
  /** The note in question, or the first of a group. */
  step: Step;
  /** The second note, for a comparison. */
  other?: Step;
  /** A run of steps, for a contour question. */
  run?: readonly Step[];
  /** A sign drawn beside the note. */
  sign?: Accidental | null;
  /** A key signature in force. */
  key?: string;
  /** The shape a contour question was built from. */
  shape?: Shape;
}

const countAnswer = (count: number) => `n${count}`;

/** How each shape reads, and what it looks like on the page. */
const SHAPE_NAME: Readonly<Record<Shape, string>> = {
  up: 'Ascending',
  down: 'Descending',
  same: 'Repeated',
  wave: 'Wave',
  broken: 'Broken',
};

const SHAPE_HINT: Readonly<Record<Shape, string>> = {
  up: 'climbing all the way',
  down: 'falling all the way',
  same: 'the same note again',
  wave: 'up then back down',
  broken: 'leaping and filling in',
};

/**
 * The interval between two positions, counted the way music counts.
 *
 * Inclusively: C to E is C, D, E — a third, not a gap of two. That off-by-one
 * is the single most common mistake in reading intervals, which is why the
 * drill asks for it in these terms.
 */
function intervalOf(from: Step, to: Step): number {
  return Math.abs(to - from) + 1;
}

/** Whether the line steps, skips or repeats. */
function motionOf(from: Step, to: Step): 'repeat' | 'step' | 'skip' {
  const gap = Math.abs(to - from);
  if (gap === 0) return 'repeat';
  if (gap === 1) return 'step';
  return 'skip';
}

/** What a key signature does to a letter, in semitones. */
function signatureShift(key: string | undefined, letter: string): number {
  if (!key) return 0;
  const signature = signatureOf(key);
  if (!signature || !altersLetter(key, letter)) return 0;
  return signature.kind === 'sharp' ? 1 : -1;
}

/**
 * A contour built from a step, so the same prompt always looks the same.
 *
 * Randomising it per render would mean a question that changes shape between
 * showings, which cannot be scored — and the contour *is* the answer here.
 */
function runFrom(step: Step, shape: Shape): readonly Step[] {
  const steps: Step[] = [step];
  for (let index = 1; index < RUN_LENGTH; index += 1) {
    const previous = steps[index - 1] as Step;
    if (shape === 'up') steps.push(previous + 1);
    else if (shape === 'down') steps.push(previous - 1);
    else if (shape === 'same') steps.push(previous);
    else if (shape === 'wave') steps.push(previous + (index % 4 < 2 ? 1 : -1));
    else steps.push(previous + (index % 2 === 1 ? 2 : -1));
  }
  return steps;
}

/** Which of the three simple directions a run ends up going. */
function contourOf(run: readonly Step[]): 'up' | 'down' | 'same' {
  const first = run[0] ?? 0;
  const last = run[run.length - 1] ?? 0;
  if (last > first) return 'up';
  if (last < first) return 'down';
  return 'same';
}

function buildPool(config: ReadingConfig, task: string): readonly Prompt[] {
  const wanted = task === MIXED ? config.tasks : config.tasks.filter((entry) => entry === task);
  const steps = drawableSteps(config);
  const prompts: Prompt[] = [];

  for (const entry of wanted) {
    for (const clef of config.clefs) {
      if (entry === 'clef' || entry === 'anchor') {
        prompts.push({ id: `${entry}-${clef}`, task: entry, clef, step: ANCHOR[clef].step });
        continue;
      }
      if (entry === 'distance' || entry === 'motion') {
        // Every pair from a repeat out to a fifth, each way round — so a
        // repeated note, a step and a skip are all in the same pool.
        for (const step of steps) {
          for (const gap of [0, 1, 2, 3, 4, -1, -2, -3, -4]) {
            const other = step + gap;
            if (!steps.includes(other)) continue;
            prompts.push({ id: `${entry}-${clef}-${step}-${gap}`, task: entry, clef, step, other });
          }
        }
        continue;
      }
      if (entry === 'higher') {
        // Every pair one, two or three steps apart, each way round.
        for (const step of steps) {
          for (const gap of [1, 2, 3, -1, -2, -3]) {
            const other = step + gap;
            if (!steps.includes(other)) continue;
            prompts.push({ id: `${entry}-${clef}-${step}-${gap}`, task: entry, clef, step, other });
          }
        }
        continue;
      }
      if (entry === 'direction' || entry === 'pattern') {
        // Direction asks only which way; pattern asks which of the five shapes.
        const shapes: readonly Shape[] = entry === 'pattern' ? SHAPES : ['up', 'down', 'same'];
        for (const step of steps) {
          for (const shape of shapes) {
            const run = runFrom(step, shape);
            if (run.some((entryStep) => !steps.includes(entryStep))) continue;
            prompts.push({ id: `${entry}-${clef}-${step}-${shape}`, task: entry, clef, step, run, shape });
          }
        }
        continue;
      }
      if (entry === 'place-note') {
        // One prompt per note that can be placed, so a letter you cannot find
        // is named rather than averaged into the rest.
        for (const step of steps) {
          prompts.push({ id: `${entry}-${clef}-${step}`, task: entry, clef, step });
        }
        continue;
      }
      // A practice with signs or a signature multiplies the pool by them, so
      // every combination is its own prompt and can be scored on its own.
      const signs = config.signs && config.signs.length > 0 ? config.signs : [null];
      const keys = config.keys && config.keys.length > 0 ? config.keys : [undefined];

      for (const step of steps) {
        for (const sign of signs) {
          for (const key of keys) {
            // A signature question does not depend on which note is drawn.
            if ((entry === 'signature' || entry === 'signature-count') && step !== steps[0]) continue;
            prompts.push({
              id: `${entry}-${clef}-${step}-${sign ?? 'plain'}-${key ?? 'none'}`,
              task: entry,
              clef,
              step,
              sign,
              key,
            });
          }
        }
      }
    }
  }

  return prompts;
}

/**
 * 6.1 and 6.2 — the page read.
 *
 * One engine because every practice in both buckets shows a note on a staff and
 * asks one thing about it. 6.1 asks about the *position* — which line, which
 * way it moved, which clef is decoding it — and 6.2 asks about the note, which
 * is the same question with the clef switched on. Splitting them would have
 * meant two drills that draw the same staff and disagree about it.
 *
 * Scores are filed under what was being read: a position by its place, a note
 * by its clef and name. That is what lets the panel say "line 4 is your slow
 * one" or "you read bass notes as treble ones", which are different problems
 * needing different practice.
 */
export function StaffQuizDrill({ config }: { config: ReadingConfig }) {
  const [task, setTask] = useState<string>(config.tasks.length > 1 ? MIXED : (config.tasks[0] ?? MIXED));
  const [focusWeak, setFocusWeak] = useState(true);
  const [showPlaces, setShowPlaces] = useState(config.showPlaces);
  const [allowance, setAllowance] = useState(config.allowanceMs);
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(config, task), [config, task]);

  const answerOf = useMemo(
    () => (prompt: Prompt) => {
      const note = noteAt(prompt.clef, prompt.step);
      if (prompt.task === 'line' || prompt.task === 'space') return countAnswer(placeOf(prompt.step) ?? 0);
      if (prompt.task === 'place') return `p${prompt.step}`;
      if (prompt.task === 'higher') return (prompt.other ?? 0) > prompt.step ? 'second' : 'first';
      if (prompt.task === 'direction') return contourOf(prompt.run ?? [prompt.step]);
      if (prompt.task === 'pattern') return prompt.shape ?? 'up';
      if (prompt.task === 'clef') return prompt.clef;
      if (prompt.task === 'anchor') return countAnswer(placeOf(ANCHOR[prompt.clef].step) ?? 0);
      if (prompt.task === 'place-note') return `p${prompt.step}`;
      if (prompt.task === 'key') return `k${note.midi}`;
      if (prompt.task === 'distance') return countAnswer(intervalOf(prompt.step, prompt.other ?? prompt.step));
      if (prompt.task === 'motion') return motionOf(prompt.step, prompt.other ?? prompt.step);
      if (prompt.task === 'accidental') return prompt.sign ?? 'natural';
      if (prompt.task === 'sign-effect') return `e${prompt.sign ?? 'natural'}`;
      if (prompt.task === 'signature') return `s${prompt.key ?? 'C'}`;
      if (prompt.task === 'signature-count') return countAnswer(signatureOf(prompt.key ?? 'C')?.count ?? 0);
      if (prompt.task === 'signature-vs-accidental') {
        // A written sign always wins; otherwise the signature decides.
        if (prompt.sign) return 'sign';
        return altersLetter(prompt.key ?? 'C', note.letter) ? 'signature' : 'neither';
      }
      if (prompt.task === 'altered-key') {
        // The signature applies unless the note carries a sign of its own.
        const bySignature = prompt.sign ? 0 : signatureShift(prompt.key, note.letter);
        return `k${note.midi + (prompt.sign ? shiftOf(prompt.sign) : bySignature)}`;
      }
      return note.letter;
    },
    [],
  );

  /** Filed under what was being read, not under the drill it came from. */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) => {
      const note = noteAt(prompt.clef, prompt.step);
      if (prompt.task === 'line' || prompt.task === 'space' || prompt.task === 'place') {
        return placeLabel(prompt.step);
      }
      if (prompt.task === 'higher') return 'which is higher';
      if (prompt.task === 'distance') {
        return `a ${['unison', 'second', 'third', 'fourth', 'fifth'][intervalOf(prompt.step, prompt.other ?? prompt.step) - 1] ?? 'wide interval'}`;
      }
      if (prompt.task === 'motion') return `${motionOf(prompt.step, prompt.other ?? prompt.step)}s`;
      if (prompt.task === 'direction') return `${contourOf(prompt.run ?? [])} runs`;
      if (prompt.task === 'pattern') return `${SHAPE_NAME[prompt.shape ?? 'up']} shapes`;
      if (prompt.task === 'clef') return `${clefName(prompt.clef)} clef`;
      if (prompt.task === 'anchor') return `${clefName(prompt.clef)} anchor`;
      if (prompt.task === 'place-note') return `placing ${note.letter}`;
      if (prompt.task === 'accidental' || prompt.task === 'sign-effect') {
        return `${SIGN_NAME[prompt.sign ?? 'natural']} sign`;
      }
      if (prompt.task === 'signature' || prompt.task === 'signature-count') {
        return `${prompt.key} signature`;
      }
      if (prompt.task === 'signature-vs-accidental') return `${prompt.key} — what altered it`;
      if (prompt.task === 'altered-key') {
        return prompt.sign
          ? `${note.letter}${GLYPH[prompt.sign]} played`
          : `${prompt.key ?? 'C'} — ${note.letter} played`;
      }
      return `${clefName(prompt.clef)} ${note.name}`;
    },
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
  const note = noteAt(question.clef, question.step);

  const deadline = useAnswerDeadline({
    ms: allowance,
    active: !settled,
    resetKey: `${question.id}:${stats.asked}`,
    onExpire: drill.timeout,
  });

  /** The key this question actually asks for, once signs and keys apply. */
  const sounding = useMemo(() => {
    if (question.task !== 'altered-key') return note.midi;
    const bySignature = question.sign ? 0 : signatureShift(question.key, note.letter);
    return note.midi + (question.sign ? shiftOf(question.sign) : bySignature);
  }, [note.letter, note.midi, question]);

  const press = (key: PianoKey) => {
    if (question.task !== 'key' && question.task !== 'altered-key') return;
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(`k${key.midi}`);
  };

  /** Where a placing question may put its note: every drawable position. */
  const pickable = useMemo(
    () => (question.task === 'place-note' ? drawableSteps(config) : []),
    [config, question.task],
  );

  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });

  /** What the staff shows for this question. */
  const marks: readonly StaffMark[] = useMemo(() => {
    if (question.task === 'place-note') {
      return settled ? [{ step: question.step, tone: 'success', label: note.letter }] : [];
    }
    if (question.task === 'direction' || question.task === 'pattern') {
      return (question.run ?? []).map((step) => ({ step, tone: 'accent' as const }));
    }
    if (question.task === 'distance' || question.task === 'motion') {
      return [
        { step: question.step, tone: 'accent' as const },
        { step: question.other ?? question.step, tone: 'accent' as const },
      ];
    }
    if (question.task === 'higher') {
      return [
        { step: question.step, tone: 'accent' as const, label: '1' },
        { step: question.other ?? question.step, tone: 'accent' as const, label: '2' },
      ];
    }
    if (question.task === 'clef' || question.task === 'anchor') return [];
    return [
      {
        step: question.step,
        accidental: question.sign ?? null,
        tone: settled ? (verdict === 'correct' ? 'success' : 'danger') : 'accent',
        label: settled || config.showLabels ? note.letter : undefined,
      },
    ];
  }, [config.showLabels, note.letter, question, settled, verdict]);

  /** The key signature in force, drawn between the clef and the notes. */
  const signature = useMemo(() => {
    if (!question.key) return [];
    const kind = signatureOf(question.key)?.kind;
    if (!kind) return [];
    return signatureSteps(question.key, question.clef).map((step) => ({ step, accidental: kind }));
  }, [question.clef, question.key]);

  const buttons: readonly { value: string; label: string; sub: string }[] =
    question.task === 'line' || question.task === 'anchor'
      ? [1, 2, 3, 4, 5].map((line) => ({ value: countAnswer(line), label: String(line), sub: 'line' }))
      : question.task === 'space'
        ? [1, 2, 3, 4].map((space) => ({ value: countAnswer(space), label: String(space), sub: 'space' }))
        : question.task === 'place'
          ? drawableSteps(config)
              .filter((step) => placeOf(step) !== null)
              .map((step) => ({
                value: `p${step}`,
                label: `${isLine(step) ? 'L' : 'S'}${placeOf(step)}`,
                sub: isLine(step) ? 'line' : 'space',
              }))
          : question.task === 'higher'
            ? [
                { value: 'first', label: 'The first', sub: 'higher on the staff' },
                { value: 'second', label: 'The second', sub: 'higher on the staff' },
              ]
            : question.task === 'pattern'
              ? SHAPES.map((shape) => ({
                  value: shape,
                  label: SHAPE_NAME[shape],
                  sub: SHAPE_HINT[shape],
                }))
            : question.task === 'direction'
              ? [
                  { value: 'up', label: 'Rising', sub: 'pitch going up' },
                  { value: 'down', label: 'Falling', sub: 'pitch going down' },
                  { value: 'same', label: 'Staying', sub: 'no movement' },
                ]
              : question.task === 'clef'
                ? [
                    { value: 'treble', label: 'Treble', sub: 'the G clef' },
                    { value: 'bass', label: 'Bass', sub: 'the F clef' },
                  ]
                : question.task === 'distance'
                  ? [1, 2, 3, 4, 5].map((size) => ({
                      value: countAnswer(size),
                      label: ['1st', '2nd', '3rd', '4th', '5th'][size - 1] ?? String(size),
                      sub: size === 1 ? 'the same note' : `${size} positions`,
                    }))
                  : question.task === 'motion'
                    ? [
                        { value: 'repeat', label: 'Repeat', sub: 'the same position' },
                        { value: 'step', label: 'Step', sub: 'line to space' },
                        { value: 'skip', label: 'Skip', sub: 'line to line' },
                      ]
                : question.task === 'name'
                  ? LETTERS.map((letter: Letter) => ({ value: letter, label: letter, sub: 'note' }))
                  : question.task === 'accidental'
                    ? ACCIDENTALS.map((sign) => ({
                        value: sign,
                        label: GLYPH[sign],
                        sub: SIGN_NAME[sign],
                      }))
                    : question.task === 'sign-effect'
                      ? ACCIDENTALS.map((sign) => ({
                          value: `e${sign}`,
                          label: SIGN_EFFECT[sign].split(' ')[0] ?? sign,
                          sub: SIGN_EFFECT[sign],
                        }))
                      : question.task === 'signature'
                        ? KEY_SIGNATURES.map((entry) => ({
                            value: `s${entry.key}`,
                            label: entry.key,
                            sub: signatureLine(entry.key),
                          }))
                        : question.task === 'signature-count'
                          ? [0, 1, 2, 3].map((count) => ({
                              value: countAnswer(count),
                              label: String(count),
                              sub: count === 1 ? 'accidental' : 'accidentals',
                            }))
                          : question.task === 'signature-vs-accidental'
                            ? [
                                { value: 'signature', label: 'The key', sub: 'the signature altered it' },
                                { value: 'sign', label: 'Its own sign', sub: 'written beside the note' },
                                { value: 'neither', label: 'Neither', sub: 'played as written' },
                              ]
                            : [];

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
          {config.allowanceMs > 0 && (
            <Field label="Allowance" hint="Tighten it as the reading gets quicker.">
              <SegmentedControl
                value={String(allowance)}
                options={[
                  { value: '0', label: 'None' },
                  { value: '4000', label: '4s' },
                  { value: '3000', label: '3s' },
                  { value: '2000', label: '2s' },
                ]}
                onChange={(value) => setAllowance(Number(value))}
                block
                ariaLabel="Time per answer"
              />
            </Field>
          )}
          <Toggle
            checked={showPlaces}
            onChange={setShowPlaces}
            label="Number the lines"
            description="Support while the geography settles. Off is the drill."
          />
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Asks more often for whatever you are slowest on."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more answers." />
        </>
      }
    >
      <DrillPrompt
        label={
          question.task === 'line'
            ? 'Which line is this note on?'
            : question.task === 'space'
              ? 'Which space is it in?'
              : question.task === 'place'
                ? 'Line or space — and which?'
                : question.task === 'higher'
                  ? 'Which of the two is higher?'
                  : question.task === 'pattern'
                    ? 'Which shape is this run?'
                  : question.task === 'direction'
                    ? 'Which way does this run move?'
                    : question.task === 'clef'
                      ? 'Which clef is this?'
                      : question.task === 'anchor'
                        ? 'Which line does this clef name itself after?'
                        : question.task === 'place-note'
                          ? `Put ${note.letter} where it belongs`
                          : question.task === 'key'
                            ? `Play this note — ${clefName(question.clef)} clef`
                            : question.task === 'accidental'
                              ? 'Which sign is beside the note?'
                              : question.task === 'distance'
                                ? 'How far apart are these two?'
                                : question.task === 'motion'
                                  ? 'Does the line step, skip, or repeat?'
                              : question.task === 'sign-effect'
                                ? 'What does that sign do?'
                                : question.task === 'altered-key'
                                  ? question.sign
                                    ? 'Play what the sign asks for'
                                    : `Play it in ${question.key} major — the signature applies`
                                  : question.task === 'signature'
                                    ? 'Which key does this signature announce?'
                                    : question.task === 'signature-count'
                                      ? 'How many sharps or flats?'
                                      : question.task === 'signature-vs-accidental'
                                        ? 'What altered this note — the key, or its own sign?'
                                        : `Name it — ${clefName(question.clef)} clef`
        }
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Right</Chip>}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {deadline.expired ? 'Out of time — that counts as a miss' : `It is ${note.name}, ${placeLabel(question.step)}`}
              </Chip>
            )}
            {!settled && question.key && <Chip>{question.key} major — {signatureLine(question.key)}</Chip>}
            {!settled && !question.key && config.mnemonic && <Chip>{config.mnemonic}</Chip>}
            {!settled && !config.mnemonic && question.task === 'key' && (
              <Chip>{clefName(question.clef)} clef — read it before the note</Chip>
            )}
          </>
        }
      >
        {question.task === 'place-note'
          ? note.letter
          : settled
            ? alteredNote(question.clef, question.step, question.sign ?? null).soundingName
            : question.sign
              ? GLYPH[question.sign]
              : '?'}
      </DrillPrompt>

      <Staff
        clef={question.clef}
        marks={marks}
        signature={signature}
        showAnchor={config.showAnchor}
        showPlaces={showPlaces}
        onPick={question.task === 'place-note' && !settled ? (step) => drill.answer(`p${step}`) : undefined}
        pickable={pickable}
        label={`${clefName(question.clef)} staff`}
      />

      {allowance > 0 && !settled && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="Answer in" />
      )}

      {buttons.length > 0 && (
        <div className={styles.choices}>
          {buttons.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.choice}
              disabled={settled}
              onClick={() => drill.answer(option.value)}
            >
              {option.label}
              <span className={styles.choiceSub}>{option.sub}</span>
            </button>
          ))}
        </div>
      )}

      {(question.task === 'key' || question.task === 'altered-key') && (
        <div className={styles.board}>
          <ReadingKeyboard
            layoutId={LAYOUT_ID}
            lit={settled ? [sounding] : undefined}
            showNames={settled}
            onKeyPress={press}
            footerNote="Press the note you can see"
          />
        </div>
      )}

      <p className={styles.note}>
        Higher on the staff is higher in pitch, and further right on the keyboard. Everything else is
        detail.
      </p>
    </DrillShell>
  );
}
