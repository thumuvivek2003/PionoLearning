import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl, Toggle } from '@/components/ui';
import type { PitchClass } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  TimerBar,
  WeakSpots,
  useAnswerDeadline,
  useQuizDrill,
  useSprint,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LAYOUT_OPTIONS, SMALL_LAYOUT_ID } from '../data/layouts';
import { noteKey, noteLabel, scopeKeys, scopePitchClasses } from '../data/naming';
import type { AskDirection, RecognitionDrillConfig } from '../data/recognitionDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import styles from '../components/geography.module.css';

/** Allowances for the no-counting drill — 3s is comfortable, 1.5s is not. */
const LIMITS = [
  { value: '3000', label: '3s' },
  { value: '2000', label: '2s' },
  { value: '1500', label: '1.5s' },
];

const SPRINT_SECONDS = 60;

const MIXED = 'mixed';

interface Prompt {
  id: string;
  pitchClass: PitchClass;
  /** Set for "name this lit key" prompts. */
  midi?: number;
  /** True for "find this note" — answered on the board. */
  toKey: boolean;
}

function directionOptions(directions: readonly AskDirection[]) {
  return [
    ...directions.map((direction) => ({
      value: direction,
      label: direction === 'name' ? 'Name it' : 'Find it',
    })),
    { value: MIXED, label: 'Mixed' },
  ];
}

function buildPool(
  layout: KeyboardLayout,
  config: RecognitionDrillConfig,
  direction: string,
): readonly Prompt[] {
  const wanted =
    direction === MIXED ? config.directions : config.directions.filter((entry) => entry === direction);
  const prompts: Prompt[] = [];

  // Naming asks about one physical key, so the same note is met all over the board.
  if (wanted.includes('name')) {
    for (const key of scopeKeys(layout, config.scope)) {
      prompts.push({ id: `n-${key.midi}`, pitchClass: key.pitchClass, midi: key.midi, toKey: false });
    }
  }
  // Finding accepts any octave, so one prompt per note is the whole question.
  if (wanted.includes('find')) {
    for (const pitchClass of scopePitchClasses(layout, config.scope)) {
      prompts.push({ id: `f-${pitchClass}`, pitchClass, toKey: true });
    }
  }

  return prompts;
}

/**
 * 1.5.1 – 1.5.7, 1.5.9 and 1.5.10 — recognition, at whatever pressure the
 * practice calls for.
 *
 * One engine because it is one question: *which key is this note?* The answer is
 * always the key — a pitch class — so a black key can be answered under either
 * name, and a prompt can be answered with a button or by pressing the key
 * itself. What the configs change is the pool, the vocabulary, and the clock.
 *
 * Every version keeps a per-note ledger. That is the part that makes this a
 * practice tool rather than a quiz: the score says how it went, the weak spots
 * say what to do next, and Focus makes the drill act on it.
 */
export function NoteRecognitionDrill({ config }: { config: RecognitionDrillConfig }) {
  const [layoutId, setLayoutId] = useState(SMALL_LAYOUT_ID);
  const [direction, setDirection] = useState<string>(config.directions[0] ?? MIXED);
  const [limit, setLimit] = useState(LIMITS[0]?.value ?? '3000');
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const pool = useMemo(() => buildPool(layout, config, direction), [config, direction, layout]);

  const answerOf = useMemo(() => (prompt: Prompt) => prompt.pitchClass, []);
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) => noteKey(prompt.pitchClass, config.naming),
    [config.naming],
  );

  const drill = useQuizDrill<Prompt, PitchClass>({
    pool,
    answerOf,
    scoreKeyOf,
    strategyId: focusWeak ? 'weak-focus' : 'no-repeat',
  });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';
  const timedOut = verdict === 'wrong' && given === null;

  const sprint = useSprint({ seconds: SPRINT_SECONDS, onStart: drill.reset });
  const sprintOver = config.challenge === 'sprint' && sprint.status === 'done';
  const frozen = sprintOver;

  const limitMs = config.challenge === 'deadline' ? Number(limit) : 0;
  const deadline = useAnswerDeadline({
    ms: limitMs,
    active: !settled && !frozen,
    // Attempts, not prompts: a miss re-asks the same question and that second
    // attempt gets its own allowance.
    resetKey: `${question.id}:${stats.asked}`,
    onExpire: drill.timeout,
  });

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  const answer = useCallback(
    (pitchClass: PitchClass) => {
      if (frozen) return;
      drill.answer(pitchClass);
    },
    [drill, frozen],
  );

  const press = useCallback(
    (key: PianoKey) => {
      if (frozen) return;
      setLastPressed(key.midi);
      if (settings.soundEnabled) instrument.playMidis([key.midi]);
      answer(key.pitchClass);
    },
    [answer, frozen, settings.soundEnabled],
  );

  const options = useMemo(
    () =>
      scopePitchClasses(layout, config.scope).map((pitchClass) => ({
        value: pitchClass,
        ...noteLabel(pitchClass, config.naming),
      })),
    [config.naming, config.scope, layout],
  );

  const asked = noteLabel(question.pitchClass, config.naming);
  const spots = weakSpots(drill.scores);
  const givenLabel = given === null ? null : noteLabel(given, config.naming).label;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {config.challenge === 'sprint' && (
            <>
              <ProgressRing
                progress={sprint.progress}
                value={String(sprint.remainingSeconds)}
                unit={sprint.status === 'done' ? 'time up' : 'seconds'}
              />
              <Button
                variant={sprint.status === 'running' ? 'secondary' : 'primary'}
                icon={sprint.status === 'running' ? 'reset' : 'play'}
                onClick={sprint.status === 'running' ? sprint.stop : sprint.start}
                block
              >
                {sprint.status === 'running' ? 'Stop sprint' : 'Start sprint'}
              </Button>
              {sprintOver && (
                <CounterRow>
                  <Counter
                    label="Score"
                    value={String(stats.correct)}
                    hint={`in ${SPRINT_SECONDS}s`}
                  />
                  <Counter
                    label="Accuracy"
                    value={stats.asked === 0 ? '—' : `${Math.round((stats.correct / stats.asked) * 100)}%`}
                  />
                </CounterRow>
              )}
            </>
          )}
          {config.challenge === 'deadline' && (
            <Field label="Allowance" hint="Drop a step once accuracy holds above 90%.">
              <SegmentedControl
                value={limit}
                options={LIMITS}
                onChange={setLimit}
                block
                ariaLabel="Answer allowance"
              />
            </Field>
          )}
          {config.directions.length > 1 && (
            <Field label="Direction">
              <SegmentedControl
                value={direction}
                options={directionOptions(config.directions)}
                onChange={setDirection}
                block
                ariaLabel="Direction"
              />
            </Field>
          )}
          <Field label="Keyboard" hint="Widen it once the notes are automatic in one octave.">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Asks more often for the notes you miss or answer slowly."
          />
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill. On, this is reading rather than recall."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more answers." />
        </>
      }
    >
      <DrillPrompt
        label={question.toKey ? 'Find this note' : 'Which note is lit?'}
        footer={
          <>
            {sprintOver && <Chip tone="accent">Sprint over — {stats.correct} correct</Chip>}
            {!sprintOver && verdict === 'correct' && (
              <Chip tone="accent">
                {asked.label}
                {asked.sub ? ` / ${asked.sub}` : ''}
              </Chip>
            )}
            {!sprintOver && timedOut && <Chip tone="danger">Out of time — that counts as a miss</Chip>}
            {!sprintOver && verdict === 'wrong' && !timedOut && (
              <Chip tone="danger">That was {givenLabel} — try again</Chip>
            )}
            {!sprintOver && !settled && (
              <Chip>{question.toKey ? 'Any octave counts' : 'Landmark, then name'}</Chip>
            )}
          </>
        }
      >
        {question.toKey ? asked.label : '?'}
      </DrillPrompt>

      {config.challenge === 'deadline' && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="Answer in" />
      )}

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={
            question.toKey
              ? verdict === 'correct' && lastPressed !== null
                ? [lastPressed]
                : undefined
              : question.midi === undefined
                ? undefined
                : [question.midi]
          }
          secondaryMidis={
            verdict === 'wrong' && lastPressed !== null && question.toKey ? [lastPressed] : undefined
          }
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote={question.toKey ? 'Press the note asked for' : 'Name the lit key, or press it'}
        />
      </div>

      {!question.toKey && (
        <LabelButtons
          options={options}
          onAnswer={answer}
          correct={settled ? expected : null}
          wrong={verdict === 'wrong' ? given : null}
          disabled={frozen}
        />
      )}
    </DrillShell>
  );
}
