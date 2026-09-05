import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout, whiteStep } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  BeatLamps,
  ChoicePills,
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  GuidedNote,
  GuidedSound,
  LEAD_IN_BEATS,
  PlayWhere,
  RunCounters,
  StageRow,
  StepStrip,
  WeakSpots,
  drawWeights,
  formatMs,
  evenness,
  percent,
  useGuidedRun,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import type { GuidedTick, PlaySurface } from '@/features/practice-kit';
import { getStrategy } from '@/features/randomizer';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { handShort } from '../data/fingers';
import {
  buildCrossRun,
  buildShiftRun,
  positionBase,
  runFingerLabels,
  shiftLabel,
} from '../data/handRuns';
import type { RunStep } from '../data/handRuns';
import type { HandRunConfig } from '../data/handRunDrills';
import { placeRun, startsFor } from '../data/intervalRuns';
import type { Hand } from '../finger.types';
import { HandDiagram } from '../components/HandDiagram';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** Wide enough for four positions in a row without running out of board. */
const LAYOUT_ID = '49';

/** How quickly a move should be made once it is a movement rather than a search. */
const MOVE_TARGET_MS = 900;

const MIXED = 'mixed';

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

const DIRECTIONS = [
  { value: 'up', label: 'Ascending' },
  { value: 'down', label: 'Descending' },
];

/** Slow on purpose — every reference in this level says so. */
const TEMPOS: readonly number[] = [40, 50, 60, 80];

/** The click, high enough to sit above whatever is being played. */
const CLICK_MIDI = 84;

/** A run placed on the board, with the keys resolved. */
interface Placed {
  steps: readonly RunStep[];
  keys: readonly PianoKey[];
  /** The shift each move made, for the score keys. */
  shifts: readonly number[];
}

function draw<T extends { id: string }>(
  pool: readonly T[],
  weights: ReadonlyMap<string, number>,
): T | undefined {
  if (pool.length === 0) return undefined;
  return getStrategy('weak-focus').pick({ pool, history: [], random: Math.random, weights });
}

/** Resolves a config's segments, drawing any shift it was told to draw. */
function resolveSegments(
  config: HandRunConfig,
  shifts: readonly number[],
): readonly { shift: number; notes: number }[] {
  return (config.segments ?? []).map((segment) => ({
    notes: segment.notes,
    shift:
      segment.shift === 'draw'
        ? (shifts[Math.floor(Math.random() * shifts.length)] ?? 1)
        : segment.shift,
  }));
}

/**
 * 2.5.1 – 2.5.8 and 2.6.1 – 2.6.6 — the hand on the move.
 *
 * One screen for two buckets because they are one skill wearing two hats: a
 * fingered run with a *move* in it, where the notes are the easy part and the
 * move is the practice. Shifting relocates the whole hand; crossing sends the
 * thumb ahead so the hand can carry on. Both are stored as offsets with the
 * moved steps marked, so the drill knows exactly which gaps to measure.
 *
 * Which is why **move time** is the headline number rather than total time: how
 * long the hand takes to relocate, kept apart from how quickly it plays. Beside
 * it sits **clean landings** — moves that arrived right first time — because a
 * fast move to the wrong key is not a fast move. The ledger files both under
 * what varies: the shift for the shifting practices, the start note for the
 * crossings, so the panel can say "two left is your slow one" or "this is fine
 * from C and not from A".
 *
 * Two rules the references ask for are enforced rather than suggested. A settle
 * pause holds the landing back until the hand has stopped, and the slow-crossing
 * minimum simply refuses notes played too early — you cannot rush a practice
 * whose entire point is not rushing.
 */
export function HandRunDrill({ config }: { config: HandRunConfig }) {
  const [hand, setHand] = useState<Hand>('right');
  const [descending, setDescending] = useState(false);
  const [bpm, setBpm] = useState(40);
  const [showMarkers, setShowMarkers] = useState(!config.hideMarkers);
  const [showNames, setShowNames] = useState(true);
  const [shapeId, setShapeId] = useState<string>(
    config.crossings && config.crossings.length > 1 ? MIXED : (config.crossings?.[0]?.id ?? ''),
  );
  /** Where you are on the speed ladder, when the practice has one. */
  const [rung, setRung] = useState(0);
  const [rungNote, setRungNote] = useState<string | null>(null);
  const { settings } = useSettings();

  /**
   * Which instrument this run is being played on.
   *
   * This drill has always offered a follow-along mode; it now runs on the shared
   * guided engine, so it counts in and keeps an audible beat like every other
   * practice rather than silently advancing a highlight.
   */
  const [surface, setSurface] = useState<PlaySurface>(
    settings.externalKeyboard ? 'external' : 'screen',
  );
  useEffect(() => {
    setSurface(settings.externalKeyboard ? 'external' : 'screen');
  }, [settings.externalKeyboard]);
  const guiding = surface === 'external';
  /** Sound each note as it falls due, so a run can be checked by ear. */
  const [guideNotes, setGuideNotes] = useState(false);

  const layout = useMemo<KeyboardLayout>(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  /** Shifts vary → score the shift. Nothing varies but the start → score that. */
  const byShift = (config.segments ?? []).some((segment) => segment.shift === 'draw');

  const [placed, setPlaced] = useState<Placed | null>(null);
  const [index, setIndex] = useState(0);
  const [landed, setLanded] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [moveTimes, setMoveTimes] = useState<readonly number[]>([]);
  /** Stumbles inside the run now being played — what the ladder judges. */
  const runStumbles = useRef(0);
  const [intervals, setIntervals] = useState<readonly number[]>([]);
  const [landings, setLandings] = useState({ clean: 0, total: 0 });
  const [lastEven, setLastEven] = useState<number | null>(null);
  const stepAt = useRef<number | null>(null);
  /** Whether the move now being attempted has already been missed once. */
  const missedMove = useRef(false);

  const shiftWeights = useMemo(
    () =>
      drawWeights(
        (config.shifts ?? [1]).map((shift) => ({ id: shiftLabel(shift) })),
        book,
        (item) => item.id,
        MOVE_TARGET_MS,
      ),
    [book, config.shifts],
  );

  /** Deals the next run: a shape, then somewhere on the board to play it. */
  const deal = useCallback(() => {
    const shifts = config.shifts ?? [1];
    // Weak shifts come round more often, so the drill leans where you are slow.
    const wanted = byShift
      ? [draw(shifts.map((shift) => ({ id: shiftLabel(shift), shift })), shiftWeights)?.shift ?? 1]
      : shifts;

    const shape =
      config.crossings === undefined
        ? (config.crossing ?? [])
        : (shapeId === MIXED
            ? config.crossings[Math.floor(Math.random() * config.crossings.length)]
            : config.crossings.find((entry) => entry.id === shapeId)
          )?.steps ?? (config.crossing ?? []);

    const crossing = descending ? [...shape].reverse() : shape;
    const steps =
      config.kind === 'cross'
        ? buildCrossRun(hand, crossing)
        : buildShiftRun(hand, resolveSegments(config, wanted), descending);

    const starts = startsFor(layout, steps, config.starts);
    const start = starts[Math.floor(Math.random() * starts.length)];
    const run = start ? placeRun(layout, start, steps) : null;

    setPlaced(
      run
        ? {
            steps,
            keys: run.keys,
            shifts: steps.flatMap((step, position) =>
              step.move && position > 0
                ? [step.offset - (steps[position - 1] as RunStep).offset]
                : [],
            ),
          }
        : null,
    );
    setIndex(0);
    setLanded([]);
    setWrong(null);
    setNote(null);
    setIntervals([]);
    stepAt.current = null;
    missedMove.current = false;
    runStumbles.current = 0;
  }, [byShift, config, descending, hand, layout, shapeId, shiftWeights]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, descending, hand, guiding]);

  const steps = placed?.steps ?? [];
  const keys = placed?.keys ?? [];
  const expected = keys[index];
  const expectedStep = steps[index];
  const complete = keys.length > 0 && index >= keys.length;

  const guided = useGuidedRun({
    length: keys.length,
    bpm,
    onTick: ({ counting, index: at, accented }: GuidedTick) => {
      if (!settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], accented ? 1.1 : 0.6);
      if (counting || !guideNotes) return;
      const midi = keys[at]?.midi;
      if (midi !== undefined) instrument.playMidis([midi], 0.85);
    },
  });
  /** The step the beat is cueing, or null while the run is not moving. */
  const cued = guiding && guided.phase === 'playing' ? guided.index : null;

  /** What a step is filed under: the shift it made, or where the run started. */
  const scoreKeyFor = useCallback(
    (position: number) => {
      if (byShift) {
        const moveOrder = steps.slice(0, position + 1).filter((step) => step.move).length - 1;
        const shift = placed?.shifts[Math.max(0, moveOrder)] ?? 0;
        return shiftLabel(shift);
      }
      return `from ${keys[0]?.sharpName ?? '?'}`;
    },
    [byShift, keys, placed, steps],
  );

  const stage = config.ladder?.[rung];
  const minGapMs = stage?.minGapMs ?? config.minGapMs;

  const press = (key: PianoKey) => {
    if (guiding || complete || !expected || !expectedStep) return;

    const now = performance.now();
    const since = stepAt.current === null ? Infinity : now - stepAt.current;

    // Two rules the references ask for, enforced rather than suggested.
    if (minGapMs !== undefined && since < minGapMs) {
      setNote('Too quick — this practice is deliberately slow');
      return;
    }
    if (config.settleMs !== undefined && expectedStep.move && since < config.settleMs) {
      setNote('Let the hand settle before it lands');
      return;
    }

    if (key.midi !== expected.midi) {
      stumble();
      runStumbles.current += 1;
      if (expectedStep.move) missedMove.current = true;
      record(scoreKeyFor(index), false, null);
      setNote(
        expectedStep.move
          ? expectedStep.move === 'cross'
            ? 'Not where the thumb was going — it lands past the fingers, not beside them'
            : 'The landing is off — the thumb goes to the new anchor'
          : 'Not that key — check the finger',
      );
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 600);
      return;
    }

    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    setNote(null);
    setLanded((current) => [...current, key.midi]);

    const previous = stepAt.current;
    if (previous !== null) {
      const gap = now - previous;
      if (expectedStep.move) {
        setMoveTimes((current) => [...current, gap]);
        setLandings((current) => ({
          clean: current.clean + (missedMove.current ? 0 : 1),
          total: current.total + 1,
        }));
        missedMove.current = false;
      } else {
        setIntervals((current) => [...current, gap]);
      }
      record(scoreKeyFor(index), true, gap);
    }
    stepAt.current = now;

    const next = index + 1;
    setIndex(next);
    if (next >= keys.length) {
      setLastEven(evenness(intervals));
      if (config.ladder) climb(runStumbles.current === 0);
      finish();
    }
  };

  /** A clean run earns a rung; a stumble gives one back. */
  const climb = (clean: boolean) => {
    const stages = config.ladder;
    if (!stages) return;
    setRung((current) => {
      const moved = Math.min(stages.length - 1, Math.max(0, current + (clean ? 1 : -1)));
      setRungNote(
        moved === current
          ? clean
            ? `Holding at ${stages[moved]?.label.toLowerCase()}`
            : `Staying at ${stages[moved]?.label.toLowerCase()} — clean it up first`
          : `${clean ? 'Up' : 'Back'} to ${stages[moved]?.label.toLowerCase()}`,
      );
      return moved;
    });
  };

  const spots = weakSpots(book, { targetMs: MOVE_TARGET_MS });
  const meanMove =
    moveTimes.length === 0 ? null : moveTimes.reduce((sum, gap) => sum + gap, 0) / moveTimes.length;
  const labels = runFingerLabels(steps);
  /** The five keys under the hand right now — the scaffold, when it is on. */
  const markers = useMemo(() => {
    const start = keys[0];
    const anchor = steps[Math.min(index, steps.length - 1)];
    if (!showMarkers || !start || !anchor) return undefined;

    // The whole position, not just the keys this run happens to use.
    const base = positionBase(hand, anchor);
    return Array.from({ length: 5 }, (_, offset) => whiteStep(layout, start, base + offset)?.midi)
      .filter((midi): midi is number => midi !== undefined);
  }, [hand, index, keys, layout, showMarkers, steps]);

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <PlayWhere
            value={surface}
            onChange={setSurface}
            hint="On my keyboard counts you in and paces the run for you."
          />
          <Field label="Hand" hint="The left hand mirrors the movement rather than copying it.">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>
          {config.crossings && config.crossings.length > 1 && (
            <Field label="Shape" hint="Mixed draws a different crossing for every run.">
              <SegmentedControl
                value={shapeId}
                options={[
                  ...config.crossings.map((entry) => ({ value: entry.id, label: entry.label })),
                  { value: MIXED, label: 'Mixed' },
                ]}
                onChange={setShapeId}
                block
                ariaLabel="Crossing shape"
              />
            </Field>
          )}
          {config.reversible && (
            <Field label="Direction">
              <SegmentedControl
                value={descending ? 'down' : 'up'}
                options={DIRECTIONS}
                onChange={(value) => setDescending(value === 'down')}
                block
                ariaLabel="Direction"
              />
            </Field>
          )}
          {guiding ? (
            <>
              <Field label="Tempo" hint="One note per beat.">
                <ChoicePills options={TEMPOS} value={bpm} onChange={setBpm} />
              </Field>
              <Button
                variant={guided.running ? 'danger' : 'primary'}
                icon={guided.running ? 'stop' : 'play'}
                onClick={guided.toggle}
                block
              >
                {guided.running ? 'Stop' : `Start — ${LEAD_IN_BEATS} beat count-in`}
              </Button>
              <GuidedSound />
              <Toggle
                checked={guideNotes}
                onChange={setGuideNotes}
                label="Play the notes too"
                description="Hear each note as it falls due, to check yourself against."
              />
              <GuidedNote />
              <CounterRow>
                <Counter label="Passes" value={String(guided.cycles)} hint="times round the run" />
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
                {stage && (
                  <Counter
                    label="Stage"
                    value={stage.label}
                    hint={stage.minGapMs === 0 ? 'no minimum' : `${stage.minGapMs}ms minimum`}
                  />
                )}
                <Counter
                  label="Move time"
                  value={formatMs(meanMove)}
                  hint={config.kind === 'cross' ? 'into the crossing' : 'hand relocating'}
                />
                <Counter
                  label="Clean landings"
                  value={`${landings.clean}/${landings.total}`}
                  hint="right first time"
                />
                <Counter label="Evenness" value={percent(lastEven)} hint="between the moves" />
              </CounterRow>
            </>
          )}
          <Toggle
            checked={showMarkers}
            onChange={setShowMarkers}
            label="Mark the position"
            description="Off is the real drill — the new position has to be found, not read."
          />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more runs." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${handShort(hand)} · start on ${keys[0]?.sharpName ?? '?'}`,
          config.kind === 'shift'
            ? `${(placed?.shifts ?? []).map(shiftLabel).join(' then ') || 'one position'}`
            : 'thumb crosses on the marked step',
        ].join(' · ')}
        footer={
          <>
            {!guiding && complete && (
              <Chip tone="accent">
                {rungNote ?? 'Run complete'}
                {meanMove === null ? '' : ` — move ${formatMs(meanMove)}`}
              </Chip>
            )}
            {!guiding && !complete && note && <Chip tone="danger">{note}</Chip>}
            {!guiding && !complete && !note && (
              <Chip tone={expectedStep?.move ? 'accent' : 'neutral'}>
                {expectedStep?.move
                  ? config.kind === 'cross'
                    ? 'Cross here'
                    : 'Move the hand'
                  : `Step ${index + 1} of ${keys.length}`}
              </Chip>
            )}
            {guiding && guided.phase === 'idle' && <Chip>Press start, play along</Chip>}
            {guiding && guided.phase === 'counting' && (
              <Chip tone="next">Count in — {guided.countIn}</Chip>
            )}
            {guiding && guided.phase === 'playing' && (
              <Chip tone={steps[cued ?? 0]?.move ? 'accent' : 'neutral'}>
                {steps[cued ?? 0]?.move
                  ? config.kind === 'cross'
                    ? 'Cross here'
                    : 'Move the hand'
                  : `Step ${(cued ?? 0) + 1} of ${keys.length} · ${bpm} BPM`}
              </Chip>
            )}
          </>
        }
      >
        {guiding && guided.phase === 'counting'
          ? guided.countIn
          : guiding
            ? (steps[cued ?? 0]?.finger ?? '·')
            : (expectedStep?.finger ?? (complete ? '✓' : '·'))}
      </DrillPrompt>

      {guiding && <BeatLamps beat={guided.beatInBar} />}

      <StageRow>
        <HandDiagram
          hand={hand}
          highlight={
            guiding ? (steps[cued ?? 0]?.finger ?? null) : (expectedStep?.finger ?? null)
          }
          showNumbers
          size={190}
        />
        {guiding && (
          <ProgressRing
            progress={guided.phase === 'playing' ? ((cued ?? 0) + 1) / Math.max(1, keys.length) : 0}
            value={String(steps[cued ?? 0]?.finger ?? '·')}
            unit={`${bpm} BPM`}
            size={104}
          />
        )}
      </StageRow>

      <StepStrip
        items={labels}
        index={guiding ? (cued ?? 0) : complete ? -1 : index}
        showProgress={guiding ? guided.phase === 'playing' : true}
        wrong={wrong !== null}
        label="The run"
      />

      <div className={styles.board}>
        <HandKeyboard
          layoutId={LAYOUT_ID}
          done={!guiding ? landed : undefined}
          positions={markers}
          lit={
            guiding && cued !== null
              ? [keys[cued]?.midi].filter((midi): midi is number => midi !== undefined)
              : index === 0 && keys[0]
                ? [keys[0].midi]
                : undefined
          }
          wrong={wrong}
          showNames={showNames}
          onKeyPress={!guiding ? press : undefined}
          footerNote={
            !guiding
              ? expectedStep?.move
                ? 'Move, land, then carry on'
                : 'Play the run in order'
              : 'Play along on your own keyboard — the cue moves on the beat'
          }
        />
      </div>

      <p className={styles.note}>
        {config.kind === 'cross'
          ? 'The thumb does not jump under the hand — it quietly changes position so the hand can keep moving.'
          : 'When the next note is outside the position, move the hand. Do not stretch a finger to rescue it.'}
      </p>
    </DrillShell>
  );
}
