import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl, Toggle } from '@/components/ui';
import { KEYBOARD_LAYOUTS } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  ChoicePills,
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  RunCounters,
  StageRow,
  StepStrip,
  WeakSpots,
  formatMs,
  evenness,
  percent,
  slowestStep,
  useScoreBook,
  useTimedRun,
  usePacedSequence,
  weakSpots,
} from '@/features/practice-kit';
import type { PacedStep } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { handShort } from '../data/fingers';
import { forHand, patternLabel } from '../data/fivePatterns';
import type { FivePatternConfig, PatternStep, PatternVariant } from '../data/fivePatterns';
import {
  fingerOfMidi,
  fitsPositions,
  handOfMidi,
  positionMidis,
  stepMidis,
} from '../data/positions';
import type { FingerNumber, Hand } from '../finger.types';
import { HandDiagram } from '../components/HandDiagram';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** How a run is worked: pressed here, or paced for your own keyboard. */
type Mode = 'play' | 'follow';

/** Which way the pattern runs. */
type Direction = 'forward' | 'reverse' | 'alternate';

const MIXED = 'mixed';

const MODES = [
  { value: 'play' as Mode, label: 'Play here' },
  { value: 'follow' as Mode, label: 'Follow' },
];

const DIRECTIONS = [
  { value: 'forward' as Direction, label: 'Forward' },
  { value: 'reverse' as Direction, label: 'Reverse' },
  { value: 'alternate' as Direction, label: 'Alternate' },
];

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

/** Slow on purpose — the reference puts accuracy before speed, repeatedly. */
const TEMPOS: readonly number[] = [40, 50, 60, 80, 100];

/** A step this size or slower is hesitation rather than playing. */
const STEP_TARGET_MS = 700;

/** Hands landing further apart than this are two hands, not one gesture. */
const TOGETHER_MS = 100;

/** How much louder an accented note is played, as a demonstration. */
const ACCENT_GAIN = 1.8;

/** The smallest board that holds both hand positions. */
const DEFAULT_LAYOUT =
  KEYBOARD_LAYOUTS.find((layout) => fitsPositions(layout, ['right', 'left']))?.id ?? '25';

interface Landing {
  hand: Hand;
  at: number;
}

function pick<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Buckets 2.2 and 2.3 — the five-finger position, and independence inside it.
 *
 * Two ways to work a pattern, because these buckets are two skills. **Play
 * here** puts the mapping under test: the prompt names a finger and you press
 * the key it owns, which is the part of "1 is C, 5 is G" a screen can actually
 * check. **Follow** turns the same pattern into a metronome for your own
 * keyboard, where the physical work happens.
 *
 * What it measures is chosen to match what the references keep asking for. Not
 * speed — *evenness*: the gaps between notes scored against each other, so a
 * slow steady run beats a fast lumpy one. Per finger, it keeps the same ledger
 * the rest of the app uses, which is how "4 is half a second behind everything
 * else" becomes something the panel says out loud. Two hands add the honest
 * measure of together: how far apart they landed.
 *
 * Two things the screen cannot do, and does not pretend to. It cannot feel a
 * held finger, so hold-and-move checks the order and warns when the held key is
 * retaken; and it cannot hear an accent, so the accent practice plays the
 * target for you and watches the rhythm, since an accent that disturbs the
 * timing came from the arm rather than the finger.
 */
export function FivePositionDrill({ config }: { config: FivePatternConfig }) {
  const [mode, setMode] = useState<Mode>('play');
  const [hand, setHand] = useState<Hand>(config.hands[0] ?? 'right');
  const [direction, setDirection] = useState<Direction>(config.reversed ? 'reverse' : 'forward');
  const [variantId, setVariantId] = useState<string>(
    config.variants.length > 1 ? MIXED : (config.variants[0]?.id ?? ''),
  );
  const [bpm, setBpm] = useState(60);
  const [showPattern, setShowPattern] = useState(true);
  const [showPosition, setShowPosition] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  /** Hands actually on the board: a chosen one, or all of them together. */
  const hands = useMemo<readonly Hand[]>(
    () => (config.play === 'either' ? [hand] : config.hands),
    [config.hands, config.play, hand],
  );
  const twoHanded = hands.length > 1;

  /** Alternate flips the run each time; the other directions hold still. */
  const [flipped, setFlipped] = useState(false);
  const reversed =
    !config.holdFirst && (direction === 'reverse' || (direction === 'alternate' && flipped));

  const [variant, setVariant] = useState<PatternVariant>(
    () => config.variants[0] as PatternVariant,
  );

  const sequence = useMemo<readonly PatternStep[]>(() => {
    const base =
      config.play === 'either' ? forHand(variant.sequence, hands[0] as Hand) : variant.sequence;
    return reversed ? [...base].reverse() : base;
  }, [config.play, hands, reversed, variant.sequence]);

  const positions = useMemo(() => hands.flatMap((entry) => positionMidis(entry)), [hands]);

  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /** Landings inside the current step — one per hand, in the order they came. */
  const [landed, setLanded] = useState<readonly Landing[]>([]);
  const [held, setHeld] = useState<number | null>(null);
  const [accent, setAccent] = useState<FingerNumber>(1);
  const [intervals, setIntervals] = useState<readonly number[]>([]);
  const [lastEven, setLastEven] = useState<number | null>(null);
  const [bestEven, setBestEven] = useState<number | null>(null);
  const [gaps, setGaps] = useState<readonly number[]>([]);

  const { book, record, clear } = useScoreBook();
  /** When the last completed step landed — the start of the gap being measured. */
  const stepAt = useRef<number | null>(null);

  /** Deals a fresh run: a pattern, a direction, and an accent to aim at. */
  const deal = useCallback(() => {
    if (variantId === MIXED) {
      const next = pick(config.variants.filter((entry) => entry.id !== variant.id));
      if (next) setVariant(next);
    } else {
      const chosen = config.variants.find((entry) => entry.id === variantId);
      if (chosen) setVariant(chosen);
    }
    setIndex(0);
    setPlayed([]);
    setLanded([]);
    setHeld(null);
    setWrong(null);
    setNote(null);
    setIntervals([]);
    stepAt.current = null;
    if (direction === 'alternate' && !config.holdFirst) setFlipped((current) => !current);
    if (config.accents) setAccent((current) => ((current % 5) + 1) as FingerNumber);
  }, [config.accents, config.holdFirst, config.variants, direction, variant.id, variantId]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  // Changing how the run is set up starts a fresh one.
  useEffect(() => {
    dealNow();
  }, [dealNow, direction, hand, mode, variantId]);

  const step = sequence[index];
  const complete = sequence.length > 0 && index >= sequence.length;

  const paced = usePacedSequence(
    useMemo<readonly PacedStep<PatternStep>[]>(
      () => sequence.map((entry) => ({ value: entry, ms: (60 / bpm) * 1000 })),
      [bpm, sequence],
    ),
    { loop: true },
  );

  const cued = mode === 'follow' && paced.isRunning ? (paced.current ?? null) : null;
  /** The step being shown: the cue when following, the one owed when playing. */
  const shown = mode === 'follow' ? cued : (step ?? null);

  const fingerOf = useCallback(
    (entry: PatternStep | null, forWhich: Hand) => entry?.[forWhich] ?? null,
    [],
  );

  const play = useCallback(
    (midi: number, finger: FingerNumber | null) => {
      if (!settings.soundEnabled) return;
      const accented = config.accents && finger === accent;
      instrument.playMidis([midi], accented ? ACCENT_GAIN : 1);
    },
    [accent, config.accents, settings.soundEnabled],
  );

  const press = (key: PianoKey) => {
    if (mode !== 'play' || complete || !step) return;

    const pressedHand = handOfMidi(hands, key.midi);
    const finger = pressedHand === null ? null : fingerOfMidi(pressedHand, key.midi);
    const wanted = pressedHand === null ? undefined : step[pressedHand];

    // Retaking the held key is the one mistake this drill exists to catch.
    if (held !== null && key.midi === held) {
      stumble();
      setNote('That is the held key — it stays down for the whole run');
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }

    if (pressedHand === null || finger === null || wanted === undefined || finger !== wanted) {
      stumble();
      if (pressedHand !== null && wanted !== undefined) {
        record(`${handShort(pressedHand)} ${wanted}`, false, null);
      }
      setNote(null);
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    // One landing per hand per step, so a double tap cannot complete a step.
    if (landed.some((entry) => entry.hand === pressedHand)) return;

    begin();
    play(key.midi, finger);
    setWrong(null);
    setNote(null);
    setPlayed((current) => [...current, key.midi]);

    const now = performance.now();
    const landings = [...landed, { hand: pressedHand, at: now }];
    const owed = hands.filter((entry) => step[entry] !== undefined);
    if (landings.length < owed.length) {
      setLanded(landings);
      return;
    }

    // Step complete: bank the gap between notes, and the gap between hands.
    const previous = stepAt.current;
    if (previous !== null) setIntervals((current) => [...current, now - previous]);
    stepAt.current = now;
    for (const entry of owed) {
      record(`${handShort(entry)} ${step[entry] as FingerNumber}`, true, previous === null ? null : now - previous);
    }
    if (landings.length > 1) {
      const times = landings.map((entry) => entry.at);
      setGaps((current) => [...current, Math.max(...times) - Math.min(...times)]);
    }
    if (step.hold) setHeld(key.midi);

    setLanded([]);
    const next = index + 1;
    setIndex(next);
    if (next >= sequence.length) {
      const score = evenness([...intervals, ...(previous === null ? [] : [now - previous])]);
      setLastEven(score);
      if (score !== null) setBestEven((best) => (best === null ? score : Math.max(best, score)));
      finish();
    }
  };

  const spots = weakSpots(book, { targetMs: STEP_TARGET_MS });
  const meanGap = gaps.length === 0 ? null : gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const slowest = slowestStep(intervals);
  const labels = useMemo(
    () =>
      sequence.map((entry) =>
        hands
          .map((entry_hand) => fingerOf(entry, entry_hand))
          .filter((finger): finger is FingerNumber => finger !== null)
          .join('·'),
      ),
    [fingerOf, hands, sequence],
  );
  const variantOptions = [
    ...config.variants.map((entry) => ({
      value: entry.id,
      label: entry.label ?? patternLabel(entry.sequence, 'right'),
    })),
    { value: MIXED, label: 'Mixed' },
  ];

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Mode" hint="Follow paces the pattern for your own keyboard.">
            <SegmentedControl value={mode} options={MODES} onChange={setMode} block ariaLabel="Mode" />
          </Field>
          {config.play === 'either' && (
            <Field label="Hand" hint="The finger numbers stay the same; the notes do not.">
              <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
            </Field>
          )}
          {config.variants.length > 1 && (
            <Field label="Pattern" hint="Mixed draws a different one for every run.">
              <SegmentedControl
                value={variantId}
                options={variantOptions}
                onChange={setVariantId}
                block
                ariaLabel="Pattern"
              />
            </Field>
          )}
          {!config.holdFirst && (
            <Field label="Direction">
              <SegmentedControl
                value={direction}
                options={DIRECTIONS}
                onChange={setDirection}
                block
                ariaLabel="Direction"
              />
            </Field>
          )}
          {mode === 'follow' ? (
            <>
              <Field label="Tempo" hint="One note per beat. Start at 40 and earn the rest.">
                <ChoicePills options={TEMPOS} value={bpm} onChange={setBpm} />
              </Field>
              <Button
                variant={paced.isRunning ? 'danger' : 'primary'}
                icon={paced.isRunning ? 'stop' : 'play'}
                onClick={paced.isRunning ? paced.stop : paced.start}
                block
              >
                {paced.isRunning ? 'Stop' : 'Start'}
              </Button>
              <CounterRow>
                <Counter label="Passes" value={String(paced.cycles)} />
                <Counter label="Tempo" value={`${bpm}`} hint="BPM" />
              </CounterRow>
            </>
          ) : (
            <>
              <Button variant="secondary" icon="reset" onClick={dealNow} block>
                New run
              </Button>
              <RunCounters stats={stats} />
              <CounterRow>
                <Counter
                  label="Evenness"
                  value={percent(lastEven)}
                  hint={bestEven === null ? 'equal gaps' : `best ${percent(bestEven)}`}
                />
                {twoHanded && (
                  <Counter
                    label="Together"
                    value={formatMs(meanGap)}
                    hint={meanGap !== null && meanGap <= TOGETHER_MS ? 'tight' : 'aim under 100ms'}
                  />
                )}
              </CounterRow>
            </>
          )}
          <Toggle
            checked={showPattern}
            onChange={setShowPattern}
            label="Show the pattern"
            description="Off makes the run come from memory — the last step of every pattern."
          />
          <Toggle
            checked={showPosition}
            onChange={setShowPosition}
            label="Mark the position"
            description="Shows the five keys under each hand until the run starts."
          />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <WeakSpots
            spots={spots}
            emptyNote="Nothing weak yet — a few more runs."
            onClear={clear}
          />
        </>
      }
    >
      <DrillPrompt
        label={[
          hands.map((entry) => `${handShort(entry)} ${patternLabel(sequence, entry)}`).join(' · '),
          config.accents ? `accent ${accent}` : null,
          held !== null ? 'holding' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {mode === 'play' && complete && (
              <Chip tone="accent">
                Run complete{lastEven === null ? '' : ` — ${percent(lastEven)} even`}
              </Chip>
            )}
            {mode === 'play' && !complete && note && <Chip tone="danger">{note}</Chip>}
            {mode === 'play' && !complete && !note && wrong !== null && (
              <Chip tone="danger">Not that key — check the finger</Chip>
            )}
            {mode === 'play' && !complete && !note && wrong === null && (
              <Chip>
                Step {index + 1} of {sequence.length}
              </Chip>
            )}
            {mode === 'follow' && (
              <Chip tone={paced.isRunning ? 'accent' : 'neutral'}>
                {paced.isRunning ? `${bpm} BPM` : 'Press start, play along'}
              </Chip>
            )}
          </>
        }
      >
        {hands
          .map((entry) => fingerOf(shown, entry))
          .map((finger) => finger ?? '·')
          .join(' ')}
      </DrillPrompt>

      <StageRow>
        {hands.map((entry) => (
          <HandDiagram
            key={entry}
            hand={entry}
            highlight={fingerOf(shown, entry)}
            done={
              config.holdFirst && held !== null && fingerOfMidi(entry, held) !== null
                ? [fingerOfMidi(entry, held) as FingerNumber]
                : []
            }
            showNumbers
            size={twoHanded ? 168 : 200}
          />
        ))}
        {mode === 'follow' && (
          <ProgressRing
            progress={paced.isRunning ? paced.progress : 0}
            value={
              hands
                .map((entry) => fingerOf(cued, entry))
                .map((finger) => finger ?? '·')
                .join('') || '·'
            }
            unit={`${bpm} BPM`}
            size={104}
          />
        )}
      </StageRow>

      <StepStrip
        items={labels.map((label, position) =>
          showPattern || position < index || mode === 'follow' ? label : '·',
        )}
        index={mode === 'follow' ? paced.index : complete ? -1 : index}
        showProgress={mode === 'follow' ? paced.isRunning : true}
        wrong={wrong !== null}
        label="The pattern"
      />

      <div className={styles.board}>
        <HandKeyboard
          layoutId={DEFAULT_LAYOUT}
          done={mode === 'play' ? played : undefined}
          positions={showPosition ? positions : undefined}
          lit={
            mode === 'follow' && cued
              ? stepMidis(hands, cued)
              : held === null
                ? undefined
                : [held]
          }
          wrong={wrong}
          showNames={showNames}
          onKeyPress={mode === 'play' ? press : undefined}
          footerNote={
            mode === 'play'
              ? held !== null
                ? 'Keep the held key down — play the others'
                : 'Press the key the named finger owns'
              : 'Play along on your own keyboard'
          }
        />
      </div>

      {mode === 'play' && slowest !== null && intervals.length > 1 && (
        <p className={styles.note}>
          Slowest gap: step {slowest + 2} of {sequence.length}
          {labels[slowest + 1] ? ` — finger ${labels[slowest + 1]}` : ''}. Even that one out and the
          whole run tightens.
        </p>
      )}
      {config.holdFirst && (
        <p className={styles.note}>
          The screen checks the order and warns if you retake the held key. Whether the finger
          really stayed down is yours to feel at the instrument.
        </p>
      )}
    </DrillShell>
  );
}
