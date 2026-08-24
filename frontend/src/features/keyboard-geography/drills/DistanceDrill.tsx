import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  ALLOWANCE_OPTIONS,
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
import { LAYOUT_OPTIONS, WIDE_LAYOUT_ID } from '../data/layouts';
import { NATURALS } from '../data/naturals';
import {
  directionArrow,
  distanceAnswer,
  distanceLabel,
  intervalName,
  targetOf,
  whiteKeys,
} from '../data/distances';
import type { Distance } from '../data/distances';
import type { DistanceAsk, DistanceDrillConfig } from '../data/distanceDrills';
import { keyLabel } from '../data/octaves';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import { LetterPicker } from '../components/LetterPicker';
import styles from '../components/geography.module.css';

const MIXED = 'mixed';

/** One distance, stated from one key, asked one way round. */
interface Prompt {
  id: string;
  from: PianoKey;
  distance: Distance;
  /** Always on the board — prompts that would fall off it are never built. */
  target: PianoKey;
  ask: DistanceAsk;
}

interface PoolQuery {
  distances: readonly number[];
  /** Signed directions in play: [1], [-1] or both. */
  signs: readonly number[];
  asks: readonly DistanceAsk[];
  /** Restricts the start key, when a letter has been picked. */
  startLetter?: Letter;
}

/** Answers of both directions in one space: a key pressed, or a size named. */
const keyAnswer = (midi: number) => `k${midi}`;
const sizeAnswer = (steps: number) => `d${Math.abs(steps)}`;

function buildPool(
  layout: KeyboardLayout,
  config: DistanceDrillConfig,
  { distances, signs, asks, startLetter }: PoolQuery,
): readonly Prompt[] {
  const starts = whiteKeys(layout).filter(
    (key) => startLetter === undefined || key.sharpName === startLetter,
  );

  return starts.flatMap((from) =>
    distances.flatMap((size) =>
      signs.flatMap((sign) => {
        const distance: Distance = { unit: config.unit, steps: size * sign };
        const target = targetOf(layout, from, distance);
        if (!target) return [];

        return asks.map<Prompt>((ask) => ({
          id: `${ask}-${from.midi}-${distance.steps}`,
          from,
          distance,
          target,
          ask,
        }));
      }),
    ),
  );
}

/** Start letters that have room for the distances currently selected. */
function availableStarts(
  layout: KeyboardLayout,
  config: DistanceDrillConfig,
  query: PoolQuery,
): readonly Letter[] {
  return NATURALS.filter(
    (letter) => buildPool(layout, config, { ...query, startLetter: letter }).length > 0,
  );
}

function askOptions(asks: readonly DistanceAsk[]) {
  return [
    ...asks.map((ask) => ({ value: ask, label: ask === 'produce' ? 'Play it' : 'Name it' })),
    { value: MIXED, label: 'Mixed' },
  ];
}

function distanceOptions(config: DistanceDrillConfig) {
  return [
    ...config.distances.map((size) => ({
      value: String(size),
      label:
        config.unit === 'octave'
          ? size === 1
            ? '1 oct'
            : `${size} oct`
          : intervalName(size),
    })),
    { value: MIXED, label: 'Mixed' },
  ];
}

/**
 * 1.6.1 – 1.6.6 — distance, both ways round.
 *
 * The answer to "three white keys right" is a key, not a letter: the skill is a
 * hand that covers the right span, so the only way to give it is to land on the
 * target. Turned round — two keys lit, name the gap — it becomes recognition,
 * which is the half most people skip and the half that makes the other one
 * fast.
 *
 * What the ledger keys on adapts to the drill: a screen offering several
 * distances scores per distance ("4th down is your slow one"), while a
 * single-distance screen scores per start note ("you hesitate from B"). Either
 * way the weak spots name something you can act on, and Focus makes the drill
 * ask for it more often.
 */
export function DistanceDrill({ config }: { config: DistanceDrillConfig }) {
  const [layoutId, setLayoutId] = useState(WIDE_LAYOUT_ID);
  const [direction, setDirection] = useState<string>('up');
  const [size, setSize] = useState<string>(String(config.distances[0] ?? 1));
  const [ask, setAsk] = useState<string>(config.asks[0] ?? 'produce');
  const [startMode, setStartMode] = useState<'any' | 'chosen'>('any');
  const [startLetter, setStartLetter] = useState<Letter>('C');
  const [limit, setLimit] = useState(ALLOWANCE_OPTIONS[0]?.value ?? '3000');
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);

  const query = useMemo<PoolQuery>(
    () => ({
      distances: size === MIXED ? config.distances : [Number(size)],
      signs: direction === MIXED ? [1, -1] : direction === 'up' ? [1] : [-1],
      asks: ask === MIXED ? config.asks : [ask as DistanceAsk],
    }),
    [ask, config.asks, config.distances, direction, size],
  );

  const starts = useMemo(() => availableStarts(layout, config, query), [config, layout, query]);
  // A picked letter that has no room for the asked distance is ignored rather
  // than left to empty the pool — the board decides what can be asked.
  const startLetterInPlay =
    startMode === 'chosen' && starts.includes(startLetter) ? startLetter : undefined;

  const pool = useMemo(
    () => buildPool(layout, config, { ...query, startLetter: startLetterInPlay }),
    [config, layout, query, startLetterInPlay],
  );

  useEffect(() => {
    const first = starts[0];
    if (first && !starts.includes(startLetter)) setStartLetter(first);
  }, [startLetter, starts]);

  const answerOf = useMemo(
    () => (prompt: Prompt) =>
      prompt.ask === 'produce' ? keyAnswer(prompt.target.midi) : sizeAnswer(prompt.distance.steps),
    [],
  );
  // Several distances on offer → the distance is what varies, so score that.
  // One distance → the start note is the only thing that can be weak.
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) =>
      config.distances.length > 1
        ? `${distanceAnswer(prompt.distance).label} ${directionArrow(prompt.distance.steps)}`
        : `from ${prompt.from.sharpName} ${directionArrow(prompt.distance.steps)}`,
    [config.distances.length],
  );

  const drill = useQuizDrill<Prompt, string>({
    pool,
    answerOf,
    scoreKeyOf,
    strategyId: focusWeak ? 'weak-focus' : 'no-repeat',
  });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';
  const timedOut = verdict === 'wrong' && given === null;
  const producing = question.ask === 'produce';

  const limitMs = config.challenge === 'deadline' ? Number(limit) : 0;
  const deadline = useAnswerDeadline({
    ms: limitMs,
    active: !settled,
    // Attempts, not prompts: a miss re-asks, and that try gets its own clock.
    resetKey: `${question.id}:${stats.asked}`,
    onExpire: drill.timeout,
  });

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  const press = useCallback(
    (key: PianoKey) => {
      if (settings.soundEnabled) instrument.playMidis([key.midi]);
      // Playing the start before moving is encouraged, so it is never an answer.
      if (!producing || key.midi === question.from.midi) return;
      setLastPressed(key.midi);
      drill.answer(keyAnswer(key.midi));
    },
    [drill, producing, question.from.midi, settings.soundEnabled],
  );

  const sizeButtons = useMemo(
    () =>
      config.distances.map((steps) => ({
        value: sizeAnswer(steps),
        ...distanceAnswer({ unit: config.unit, steps }),
      })),
    [config.distances, config.unit],
  );

  const spots = weakSpots(drill.scores);
  const pressedKey = layout.keys.find((key) => key.midi === lastPressed);
  const answered = distanceAnswer(question.distance);
  const overshot =
    producing && pressedKey ? pressedKey.sharpName === question.target.sharpName : false;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {config.challenge === 'deadline' && (
            <Field label="Allowance" hint="Counting does not fit in 1.5 seconds. That is the point.">
              <SegmentedControl
                value={limit}
                options={ALLOWANCE_OPTIONS}
                onChange={setLimit}
                block
                ariaLabel="Answer allowance"
              />
            </Field>
          )}
          {config.asks.length > 1 && (
            <Field label="Ask" hint="Name it is the reverse — recognising a distance, not making one.">
              <SegmentedControl
                value={ask}
                options={askOptions(config.asks)}
                onChange={setAsk}
                block
                ariaLabel="Ask direction"
              />
            </Field>
          )}
          <Field label="Direction">
            <SegmentedControl
              value={direction}
              options={[
                { value: 'up', label: config.unit === 'octave' ? 'Up' : 'Right' },
                { value: 'down', label: config.unit === 'octave' ? 'Down' : 'Left' },
                { value: MIXED, label: 'Mixed' },
              ]}
              onChange={setDirection}
              block
              ariaLabel="Direction"
            />
          </Field>
          {config.distances.length > 1 && (
            <Field label="Distance">
              <SegmentedControl
                value={size}
                options={distanceOptions(config)}
                onChange={setSize}
                block
                ariaLabel="Distance"
              />
            </Field>
          )}
          <Field label="Start" hint="Pick one note to work from, or take them as they come.">
            <SegmentedControl
              value={startMode}
              options={[
                { value: 'any', label: 'Any note' },
                { value: 'chosen', label: 'One note' },
              ]}
              onChange={(value) => setStartMode(value as 'any' | 'chosen')}
              block
              ariaLabel="Start note"
            />
            <LetterPicker
              value={startLetter}
              onChange={setStartLetter}
              letters={starts}
              disabled={startMode === 'any'}
              ariaLabel="Start from"
            />
          </Field>
          <Field label="Keyboard">
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
            description="Asks more often for whatever you miss or reach slowly."
          />
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill — distance is a shape, not a name."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more moves." />
        </>
      }
    >
      <DrillPrompt
        label={producing ? distanceLabel(question.distance) : 'How far apart are the lit keys?'}
        footer={
          <>
            {verdict === 'correct' && (
              <Chip tone="accent">
                {keyLabel(question.from)} → {keyLabel(question.target)} · {answered.label}
              </Chip>
            )}
            {timedOut && <Chip tone="danger">Out of time — that counts as a miss</Chip>}
            {verdict === 'wrong' && !timedOut && (
              <Chip tone="danger">
                {producing
                  ? overshot
                    ? `Right letter, wrong octave — ${pressedKey ? keyLabel(pressedKey) : ''}`
                    : `That was ${pressedKey ? keyLabel(pressedKey) : 'a black key'}`
                  : 'Look at the gap between them, not the names'}
              </Chip>
            )}
            {!settled && (
              <Chip>{producing ? 'Play the start, then move' : 'Count the white keys between'}</Chip>
            )}
          </>
        }
      >
        {producing ? question.from.sharpName : '?'}
      </DrillPrompt>

      {config.challenge === 'deadline' && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="Answer in" />
      )}

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={[question.from.midi]}
          // Naming needs both ends shown; producing reveals the target only once
          // it has been found, or points at where the hand actually landed.
          secondaryMidis={
            !producing || verdict === 'correct'
              ? [question.target.midi]
              : verdict === 'wrong' && lastPressed !== null
                ? [lastPressed]
                : undefined
          }
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote={producing ? 'Land on the target key' : 'Answer with the distance below'}
        />
      </div>

      {!producing && (
        <LabelButtons
          options={sizeButtons}
          onAnswer={drill.answer}
          correct={settled ? expected : null}
          wrong={verdict === 'wrong' ? given : null}
        />
      )}
    </DrillShell>
  );
}
