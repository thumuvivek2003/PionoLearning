import { useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
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
import { clefName, noteAt } from '../data/staff';
import type { FingerDrillConfig, FingerTask, Hand } from '../data/fingerDrills';
import { FINGER_NAMES, crossingsIn, fingerName, handName } from '../data/fingerDrills';
import { Staff } from '../components/Staff';
import type { StaffMark } from '../components/Staff';
import { ReadingKeyboard } from '../components/ReadingKeyboard';
import styles from '../components/reading.module.css';

const LAYOUT_ID = '49';
const MIXED = 'mixed';
const TARGET_MS = 2500;

const TASK_LABELS: Readonly<Record<FingerTask, string>> = {
  name: 'Name the finger',
  'which-finger': 'Which finger',
  'which-note': 'Which note',
  'play-finger': 'Play its note',
};

interface Prompt {
  id: string;
  task: FingerTask;
  hand: Hand;
  /** Which note of the printed run the question is about. */
  at: number;
}

function buildPool(config: FingerDrillConfig, task: string): readonly Prompt[] {
  const wanted = task === MIXED ? config.tasks : config.tasks.filter((entry) => entry === task);
  return wanted.flatMap((entry) =>
    config.hands.flatMap((hand) =>
      config.steps.map((_step, at) => ({ id: `${entry}-${hand}-${at}`, task: entry, hand, at })),
    ),
  );
}

/**
 * 6.8 — the numbers printed over the notes.
 *
 * Fingering is the only thing on a page that is not about pitch, and it is the
 * part beginners skip. What a screen can honestly test is the *reading* of it:
 * which finger this note is assigned, which note a given finger covers, and
 * where the printed fingering says the hand has to move. Whether you physically
 * used that finger is something only you can check, and the practices say so
 * rather than pretending to measure it.
 *
 * Scores are filed per finger and per position, so "finger 4 is your slow one"
 * and "the note after the thumb crossing is" come out as different findings.
 */
export function FingeringDrill({ config }: { config: FingerDrillConfig }) {
  const [task, setTask] = useState<string>(config.tasks.length > 1 ? MIXED : (config.tasks[0] ?? MIXED));
  const [hand, setHand] = useState<Hand>(config.hands[0] ?? 'right');
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(config, task), [config, task]);
  const notes = useMemo(
    () => config.steps.map((step) => noteAt(config.clef, step)),
    [config.clef, config.steps],
  );
  const crossings = useMemo(() => crossingsIn(config.fingering), [config.fingering]);

  const answerOf = useMemo(
    () => (prompt: Prompt) => {
      const finger = config.fingering[prompt.at] ?? 1;
      const note = notes[prompt.at];
      if (prompt.task === 'name') return `f${finger}`;
      if (prompt.task === 'which-finger') return `f${finger}`;
      if (prompt.task === 'which-note') return `n${prompt.at}`;
      return `k${note?.midi ?? 60}`;
    },
    [config.fingering, notes],
  );

  /** Filed per finger, and separately where the hand has to move. */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) => {
      const finger = config.fingering[prompt.at] ?? 1;
      if (prompt.task === 'name') return `finger ${finger}`;
      if (crossings.includes(prompt.at)) return `the crossing (finger ${finger})`;
      return `${handName(prompt.hand)} finger ${finger}`;
    },
    [config.fingering, crossings],
  );

  const drill = useQuizDrill<Prompt, string>({
    pool,
    answerOf,
    scoreKeyOf,
    strategyId: focusWeak ? 'weak-focus' : 'no-repeat',
  });
  const { question, verdict, stats } = drill;
  const settled = verdict !== 'waiting';
  const finger = config.fingering[question.at] ?? 1;
  const note = notes[question.at];

  const deadline = useAnswerDeadline({
    ms: config.allowanceMs,
    active: !settled,
    resetKey: `${question.id}:${stats.asked}`,
    onExpire: drill.timeout,
  });

  const press = (key: PianoKey) => {
    if (question.task !== 'play-finger') return;
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(`k${key.midi}`);
  };

  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });

  /** The run, with the fingering printed under it. */
  const marks: readonly StaffMark[] = notes.map((entry, at) => ({
    step: entry.step,
    tone:
      question.task === 'name'
        ? 'muted'
        : at === question.at
          ? settled
            ? verdict === 'correct'
              ? 'success'
              : 'danger'
            : 'accent'
          : 'muted',
    // The number under a note is the fingering, which is the whole point.
    label: String(config.fingering[at] ?? ''),
  }));

  const buttons: readonly { value: string; label: string; sub: string }[] =
    question.task === 'name' || question.task === 'which-finger'
      ? FINGER_NAMES.map((name, index) => ({
          value: `f${index + 1}`,
          label: String(index + 1),
          sub: name,
        }))
      : question.task === 'which-note'
        ? notes.map((entry, at) => ({
            value: `n${at}`,
            label: settled || showNames ? entry.letter : `${at + 1}`,
            sub: `note ${at + 1}`,
          }))
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
          {config.hands.length > 1 && (
            <Field label="Hand" hint="The numbering is the same; the order is not.">
              <SegmentedControl
                value={hand}
                options={[
                  { value: 'right', label: 'Right' },
                  { value: 'left', label: 'Left' },
                ]}
                onChange={(value) => setHand(value as Hand)}
                block
                ariaLabel="Hand"
              />
            </Field>
          )}
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Letters on the choices"
            description="Support while the run is unfamiliar. Off is the drill."
          />
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Asks more often about whichever finger you are slowest on."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more answers." />
        </>
      }
    >
      <DrillPrompt
        label={
          question.task === 'name'
            ? `Which finger is number ${finger}?`
            : question.task === 'which-finger'
              ? `Which finger plays the marked note? · ${handName(question.hand)}`
              : question.task === 'which-note'
                ? `Which note does finger ${finger} play? · ${handName(question.hand)}`
                : `Play the note finger ${finger} covers · ${handName(question.hand)}`
        }
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Right</Chip>}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {deadline.expired
                  ? 'Out of time — that counts as a miss'
                  : `Finger ${finger} — the ${fingerName(finger)} — on ${note?.name ?? ''}`}
              </Chip>
            )}
            {!settled && crossings.includes(question.at) && (
              <Chip tone="accent">This is where the hand moves</Chip>
            )}
            {!settled && !crossings.includes(question.at) && (
              <Chip>{config.patternName} · {clefName(config.clef)} clef</Chip>
            )}
          </>
        }
      >
        {question.task === 'name' ? finger : settled ? (note?.name ?? '?') : finger}
      </DrillPrompt>

      <Staff clef={config.clef} marks={marks} label="the run with its fingering" />

      {config.allowanceMs > 0 && !settled && (
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

      {question.task === 'play-finger' && (
        <div className={styles.board}>
          <ReadingKeyboard
            layoutId={LAYOUT_ID}
            lit={settled && note ? [note.midi] : undefined}
            showNames={settled}
            onKeyPress={press}
            footerNote="Press the note that finger covers"
          />
        </div>
      )}

      <p className={styles.note}>
        The number over a note says which finger, never which key. Nothing here can tell which finger
        you actually used — that part is yours to check.
      </p>
    </DrillShell>
  );
}
