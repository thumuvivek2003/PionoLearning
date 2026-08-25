import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PitchClass } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import {
  ALLOWANCE_OPTIONS,
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  StepStrip,
  TimerBar,
  WeakSpots,
  useAnswerDeadline,
  useQuizDrill,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { MAJOR, MINOR, relativeMajorOf, relativeMinorOf, scaleName } from '../data/relatives';
import { accidentalsOf, scaleShape } from '../data/scaleShapes';
import type { ScaleShape } from '../data/scaleShapes';
import type { KeyRef, ReadTask, ScaleReadConfig } from '../data/readDrills';
import { GAP_STREAK, nextGaps } from '../data/readDrills';
import { ScaleKeyboard } from '../components/ScaleKeyboard';
import styles from '../components/scales.module.css';

const LAYOUT_ID = '25';
const MIXED = 'mixed';
const BLANK = '?';
/** Fragments are short on purpose — a direction is read, not counted. */
const FRAGMENT = 4;
/** Recognition, not calculation: past this it was worked out. */
const TARGET_MS = 1500;

const TASK_LABELS: Readonly<Record<ReadTask, string>> = {
  root: 'Its root',
  accidentals: 'How many',
  missing: 'Fill the blank',
  direction: 'Which way',
  'name-key': 'Which key',
  quality: 'Major or minor',
};

interface Prompt {
  id: string;
  task: ReadTask;
  key: KeyRef;
  direction: 'up' | 'down';
  /** For the missing task: the position in the printed run that is answered. */
  hidden?: number;
}

const keyAnswer = (pitchClass: PitchClass) => `k${pitchClass}`;
const countAnswer = (count: number) => `n${count}`;
const keyName = (key: KeyRef) => `${key.root}:${key.scale}`;

/** The eight notes a run prints, in the order it prints them. */
function runOf(shape: ScaleShape, direction: 'up' | 'down'): readonly string[] {
  const names = shape.notes.map((note) => note.name);
  const up = [...names, names[0] as string];
  return direction === 'up' ? up : [...up].reverse();
}

/**
 * Which positions are blanked out.
 *
 * The answered one comes from the prompt, so a weak degree can be named and
 * drawn again. The others are spread away from it by fixed offsets rather than
 * randomly, so the same prompt always looks the same — a question that changes
 * shape between showings cannot be scored.
 */
function blanksFor(hidden: number, gaps: number, length: number): readonly number[] {
  const spread = [0, 3, 5];
  return spread.slice(0, gaps).map((offset) => (hidden + offset) % length);
}

/** Three plausible wrong keys: the relative first, since that is the real trap. */
function choicesFor(key: KeyRef, pool: readonly KeyRef[]): readonly KeyRef[] {
  const relativeRoot = key.scale === MAJOR ? relativeMinorOf(key.root) : relativeMajorOf(key.root);
  const relative = relativeRoot
    ? { root: relativeRoot, scale: key.scale === MAJOR ? MINOR : MAJOR }
    : null;

  const taken = new Set([keyName(key), relative ? keyName(relative) : '']);
  const others = pool.filter((entry) => !taken.has(keyName(entry))).slice(0, 2);
  const options = [key, ...(relative ? [relative] : []), ...others];

  // Sorted, so the right answer is not always in the same place.
  return [...options].sort((a, b) => keyName(a).localeCompare(keyName(b)));
}

function buildPool(config: ScaleReadConfig, task: string): readonly Prompt[] {
  const wanted = task === MIXED ? config.tasks : config.tasks.filter((entry) => entry === task);
  const prompts: Prompt[] = [];

  for (const entry of wanted) {
    for (const key of config.keys) {
      for (const direction of config.directions) {
        if (entry === 'direction') {
          // One prompt per starting point, so the fragment is not always the
          // first four notes — the ends of a run give the direction away.
          for (let from = 0; from + FRAGMENT <= 8; from += 1) {
            prompts.push({
              id: `${entry}-${keyName(key)}-${direction}-${from}`,
              task: entry,
              key,
              direction,
              hidden: from,
            });
          }
          continue;
        }
        if (entry === 'missing') {
          // One prompt per hidden degree, so the ledger can name the degree
          // you keep failing to supply rather than reporting one average.
          for (let hidden = 0; hidden < 8; hidden += 1) {
            prompts.push({
              id: `${entry}-${keyName(key)}-${direction}-${hidden}`,
              task: entry,
              key,
              direction,
              hidden,
            });
          }
          continue;
        }
        prompts.push({ id: `${entry}-${keyName(key)}-${direction}`, task: entry, key, direction });
      }
    }
  }

  return prompts;
}

/**
 * 4.10 — the scales read back rather than built.
 *
 * One engine for six questions because they are one question asked of one
 * printed run: what is this. The run is the prompt in every case, and only what
 * is asked about it changes, so a single pool serves them all and mixed mode is
 * free.
 *
 * Two things make this bucket different from every other one in the level. The
 * clock is not optional — a recognition answer that took eight seconds is not
 * recognition, so running out of time is graded as a miss. And the missing-note
 * ladder moves on its own: five clean answers hides another note, a miss shows
 * one again, so the practice settles at the hardest version you can actually
 * hold rather than the one you picked.
 */
export function ScaleReadDrill({ config }: { config: ScaleReadConfig }) {
  const [task, setTask] = useState<string>(config.tasks[0] ?? MIXED);
  const [focusWeak, setFocusWeak] = useState(true);
  const [allowance, setAllowance] = useState(String(config.allowanceMs));
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(config, task), [config, task]);

  /** How many notes are hidden right now, and the streak that moves it. */
  const [gaps, setGaps] = useState(config.gaps);
  const [streak, setStreak] = useState(0);

  const answerOf = useMemo(
    () => (prompt: Prompt) => {
      const shape = scaleShape(prompt.key.root, prompt.key.scale);
      if (!shape) return '';
      if (prompt.task === 'direction') return prompt.direction;
      if (prompt.task === 'quality') return prompt.key.scale === MINOR ? MINOR : MAJOR;
      if (prompt.task === 'name-key') return keyName(prompt.key);
      if (prompt.task === 'accidentals') return countAnswer(accidentalsOf(shape).length);
      if (prompt.task === 'root') return keyAnswer(shape.pitchClasses[0] as PitchClass);

      // The missing note: whichever pitch the printed run hides at that spot.
      const run = runOf(shape, prompt.direction);
      const names = run.map((name) => name);
      const at = prompt.hidden ?? 0;
      const index = shape.notes.findIndex((note) => note.name === names[at]);
      return keyAnswer((shape.pitchClasses[index === -1 ? 0 : index] ?? 0) as PitchClass);
    },
    [],
  );

  /** Filed under what was being recognised, not under the run it came from. */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) => {
      const named = scaleName(prompt.key.root, prompt.key.scale);
      if (prompt.task === 'missing') return `${prompt.direction === 'up' ? '↑' : '↓'} slot ${(prompt.hidden ?? 0) + 1}`;
      if (prompt.task === 'direction') return `${prompt.direction === 'up' ? 'ascending' : 'descending'} fragment`;
      if (prompt.task === 'root') return `${named} root`;
      if (prompt.task === 'accidentals') return `${named} signature`;
      if (prompt.task === 'quality') return `${named} quality`;
      return `${named} named`;
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

  // The ladder only moves on the task it belongs to; a direction question is
  // not evidence about how many blanks you can hold.
  useEffect(() => {
    if (!settled || !config.ladder || question.task !== 'missing') return;
    const correct = verdict === 'correct';
    const run = correct ? streak + 1 : 0;
    setGaps((current) => nextGaps(current, correct, run));
    setStreak(run >= GAP_STREAK ? 0 : run);
    // Only when a verdict lands, which is what `settled` and the question mark.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, question.id]);

  const limit = Number(allowance);
  const deadline = useAnswerDeadline({
    ms: limit,
    active: !settled,
    // Re-asking the same prompt has to restart the clock, so the count is in it.
    resetKey: `${question.id}:${stats.asked}`,
    onExpire: drill.timeout,
  });

  const shape = scaleShape(question.key.root, question.key.scale);
  const printed = useMemo(() => {
    if (!shape) return [];
    const run = runOf(shape, question.direction);
    if (question.task === 'direction') {
      // A fragment, so direction is read off the line rather than the ends.
      const from = question.hidden ?? 0;
      return run.slice(from, from + FRAGMENT);
    }
    if (question.task !== 'missing') return run;
    const blanks = new Set(blanksFor(question.hidden ?? 0, gaps, run.length));
    return run.map((name, position) => (settled ? name : blanks.has(position) ? BLANK : name));
  }, [gaps, question, settled, shape]);

  const press = (key: PianoKey) => {
    if (question.task !== 'root' && question.task !== 'missing') return;
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(keyAnswer(key.pitchClass));
  };

  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });
  const choices = question.task === 'name-key' ? choicesFor(question.key, config.keys) : [];
  const buttons: readonly { value: string; label: string; sub: string }[] =
    question.task === 'direction'
      ? [
          { value: 'up', label: 'Ascending', sub: 'low to high' },
          { value: 'down', label: 'Descending', sub: 'high to low' },
        ]
      : question.task === 'quality'
        ? [
            { value: MAJOR, label: 'Major', sub: 'a whole step and two more to the third' },
            { value: MINOR, label: 'Minor', sub: 'the third is a semitone lower' },
          ]
        : question.task === 'name-key'
          ? choices.map((entry) => ({
              value: keyName(entry),
              label: scaleName(entry.root, entry.scale),
              sub: entry.scale === MINOR ? 'minor' : 'major',
            }))
          : question.task === 'accidentals'
            ? [0, 1, 2, 3, 4, 5].map((count) => ({
                value: countAnswer(count),
                label: String(count),
                sub: count === 1 ? 'accidental' : 'accidentals',
              }))
            : [];

  const answering = buttons.length > 0;

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
          <Field label="Allowance" hint="Tighten it as the answers get quicker.">
            <SegmentedControl
              value={allowance}
              options={[...ALLOWANCE_OPTIONS]}
              onChange={setAllowance}
              block
              ariaLabel="Time per answer"
            />
          </Field>
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
          question.task === 'root'
            ? 'Press the note this run is built on'
            : question.task === 'accidentals'
              ? 'How many sharps or flats does it carry?'
              : question.task === 'missing'
                ? (gaps > 1 ? 'Supply the marked blank' : 'Supply the blank')
                : question.task === 'direction'
                  ? 'Which way is this fragment running?'
                  : question.task === 'name-key'
                    ? 'Which key is this?'
                    : 'Major or minor?'
        }
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Right</Chip>}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {deadline.expired
                  ? 'Out of time — that counts as a miss'
                  : `It is ${scaleName(question.key.root, question.key.scale)}`}
              </Chip>
            )}
            {!settled && config.ladder && question.task === 'missing' && (
              <Chip>
                {gaps} blank{gaps === 1 ? '' : 's'} · {GAP_STREAK - streak} clean to the next
              </Chip>
            )}
            {!settled && question.task === 'quality' && <Chip>Look at the third, not the accidentals</Chip>}
          </>
        }
      >
        {question.task === 'accidentals' || question.task === 'name-key' ? '?' : BLANK}
      </DrillPrompt>

      <StepStrip
        items={printed}
        index={question.task === 'missing' && !settled ? (question.hidden ?? 0) : -1}
        showProgress={false}
        label="The run"
      />

      {limit > 0 && !settled && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="Answer in" />
      )}

      {answering ? (
        <div className={styles.steps}>
          {buttons.map((option) => (
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
      ) : (
        <div className={styles.board}>
          <ScaleKeyboard
            layoutId={LAYOUT_ID}
            showNames={settled}
            onKeyPress={press}
            footerNote="Press the key you were asked for"
          />
        </div>
      )}

      <p className={styles.note}>
        Nothing here names the key for you. Everything you need is in the notes on the strip.
      </p>
    </DrillShell>
  );
}
