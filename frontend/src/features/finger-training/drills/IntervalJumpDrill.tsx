import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { intervalName } from '@/features/music-theory';
import { getKeyboardLayout, whiteIndexOf } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  RunCounters,
  StepStrip,
  WeakSpots,
  drawWeights,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import { getStrategy } from '@/features/randomizer';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { fingerFor, placeRun, runFingers, runInterval, runShape, startsFor } from '../data/intervalRuns';
import type { PlacedRun, RunNote } from '../data/intervalRuns';
import type { IntervalDrillConfig } from '../data/intervalDrills';
import { handShort } from '../data/fingers';
import type { Hand } from '../finger.types';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** Wide enough that a run can start almost anywhere. */
const LAYOUT_ID = '49';

/** A jump is a size and a direction — the two things a random run draws. */
interface Jump {
  id: string;
  size: number;
  sign: number;
}

/** How long a jump should take once it is known rather than counted. */
const TARGET_MS = 1200;

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

function jumpKey(size: number, sign: number): string {
  return `${intervalName(size)} ${sign > 0 ? 'up' : 'down'}`;
}

/** The jumps a random drill may draw, each identified for the randomizer. */
function jumpPool(sizes: readonly number[]): readonly Jump[] {
  return sizes.flatMap((size) =>
    [1, -1].map((sign) => ({ id: jumpKey(size, sign), size, sign })),
  );
}

/** A run built from drawn jumps, as offsets from its own first note. */
function runFromJumps(jumps: readonly Jump[], hand: Hand): readonly RunNote[] {
  const notes: RunNote[] = [{ offset: 0 }];
  let offset = 0;

  for (const jump of jumps) {
    offset += jump.size * jump.sign;
    notes.push({ offset });
  }

  // Finger it only when the whole run sits inside one hand position.
  const base = Math.min(...notes.map((note) => note.offset));
  const span = Math.max(...notes.map((note) => note.offset)) - base;
  if (span > 4) return notes;
  return notes.map((note) => ({ ...note, finger: fingerFor(hand, note.offset, base) ?? undefined }));
}

/** What was actually played, as an interval — the miss, named. */
function playedInterval(layout: KeyboardLayout, from: PianoKey, pressed: PianoKey): string | null {
  const fromIndex = whiteIndexOf(layout, from.midi);
  const toIndex = whiteIndexOf(layout, pressed.midi);
  if (fromIndex < 0 || toIndex < 0) return null;
  return jumpKey(Math.abs(toIndex - fromIndex), toIndex - fromIndex >= 0 ? 1 : -1);
}

/**
 * 2.4.1 – 2.4.8 — distance under the hand.
 *
 * The bucket where the hand stops living in one position, so the drill stops
 * thinking in slots: a run is a set of offsets and a start key drawn separately,
 * which is exactly what "the same pattern from anywhere" means. Play the notes
 * in order and the drill checks the shape, not the notes.
 *
 * A miss is named as what it actually was — "you played a 2nd, the jump was a
 * 3rd" — because that is the correction, and the ledger follows what varies in
 * each practice: fixed shapes are scored by their start note (so the transfer
 * practice can say "your hand does not know this from B yet") and random ones
 * by the interval drawn (so it can say "4ths down are the slow ones"). Whichever
 * it is, the randomizer draws more of it.
 */
export function IntervalJumpDrill({ config }: { config: IntervalDrillConfig }) {
  const [hand, setHand] = useState<Hand>('right');
  const [showNames, setShowNames] = useState(true);
  const [showShape, setShowShape] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const jumps = useMemo(() => jumpPool(config.sizes ?? [1, 2, 3, 4]), [config.sizes]);

  const { book, record, clear } = useScoreBook();
  /** Fixed shapes vary only by where they start; random ones by what they ask. */
  const byStart = config.source === 'fixed';

  const [run, setRun] = useState<PlacedRun | null>(null);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [landed, setLanded] = useState<readonly number[]>([]);
  const stepAt = useRef<number | null>(null);

  const startWeights = useMemo(
    () =>
      drawWeights(
        startsFor(layout, config.run ?? [{ offset: 0 }], config.starts).map((key) => ({
          id: String(key.midi),
          letter: key.sharpName,
        })),
        book,
        (item) => item.letter,
        TARGET_MS,
      ),
    [book, config.run, config.starts, layout],
  );
  const jumpWeights = useMemo(
    () => drawWeights(jumps, book, (jump) => jump.id, TARGET_MS),
    [book, jumps],
  );

  /** Deals the next attempt: a shape, then somewhere on the board to play it. */
  const deal = useCallback(() => {
    const strategy = getStrategy('weak-focus');
    const notes =
      config.source === 'fixed'
        ? (config.run ?? [{ offset: 0 }])
        : runFromJumps(
            Array.from({ length: (config.length ?? 2) - 1 }, () =>
              strategy.pick({ pool: jumps, history: [], random: Math.random, weights: jumpWeights }),
            ),
            hand,
          );

    const options = startsFor(layout, notes, config.starts);
    const start =
      options.length === 0
        ? null
        : strategy.pick({
            pool: options.map((key) => ({ id: String(key.midi), key })),
            history: [],
            random: Math.random,
            weights: startWeights,
          }).key;

    setRun(start ? placeRun(layout, start, notes) : null);
    setIndex(0);
    setLanded([]);
    setWrong(null);
    setNote(null);
    stepAt.current = null;
  }, [config.length, config.run, config.source, config.starts, hand, jumpWeights, jumps, layout, startWeights]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, hand]);

  const keys = run?.keys ?? [];
  const notes = run?.notes ?? [];
  const expected = keys[index];
  const complete = keys.length > 0 && index >= keys.length;
  const scoreKey = byStart ? (keys[0]?.sharpName ?? '?') : runInterval(notes);

  const press = (key: PianoKey) => {
    if (complete || !expected) return;

    if (key.midi !== expected.midi) {
      stumble();
      record(scoreKey, false, null);
      const previous = index === 0 ? keys[0] : keys[index - 1];
      const played = key.isBlack || !previous ? null : playedInterval(layout, previous, key);
      setNote(
        key.isBlack
          ? 'Black key — these runs are white keys only'
          : played
            ? `That was a ${played.toLowerCase()} — the jump is ${runShape(notes).toLowerCase()}`
            : 'Not that key',
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

    const now = performance.now();
    const previous = stepAt.current;
    // The first note is where you were put; the jump is what gets timed.
    if (previous !== null) record(scoreKey, true, now - previous);
    stepAt.current = now;

    const next = index + 1;
    setIndex(next);
    if (next >= keys.length) finish();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const fingering = runFingers(notes);
  const strip = notes.map((entry, position) => {
    if (position === 0) return entry.finger ? String(entry.finger) : 'start';
    const step = entry.offset - (notes[position - 1] as RunNote).offset;
    return entry.finger ? String(entry.finger) : `${intervalName(step)}${step > 0 ? '↑' : '↓'}`;
  });

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Hand" hint="Fingering only; the keys are the same either way.">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>
          <Toggle
            checked={showShape}
            onChange={setShowShape}
            label="Show the shape"
            description="Off leaves only the fingering — you work the distance out yourself."
          />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New jump
          </Button>
          <RunCounters stats={stats} runsLabel="Jumps" />
          <CounterRow>
            <Counter
              label="Scored by"
              value={byStart ? 'start note' : 'interval'}
              hint={byStart ? 'the shape is fixed' : 'the shape varies'}
            />
          </CounterRow>
          <WeakSpots
            spots={spots}
            emptyNote="Nothing weak yet — a few more jumps."
            onClear={clear}
          />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${handShort(hand)} · start on ${keys[0]?.sharpName ?? '?'}`,
          fingering || null,
          showShape ? runShape(notes) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {complete && (
              <Chip tone="accent">
                {keys.map((key) => key.sharpName).join(' → ')}
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && note && <Chip tone="danger">{note}</Chip>}
            {!complete && !note && (
              <Chip>
                Note {index + 1} of {keys.length}
              </Chip>
            )}
          </>
        }
      >
        {keys[0]?.sharpName ?? '—'}
      </DrillPrompt>

      <StepStrip
        items={strip}
        index={complete ? -1 : index}
        wrong={wrong !== null}
        label="The run"
      />

      <div className={styles.board}>
        <HandKeyboard
          layoutId={LAYOUT_ID}
          done={landed}
          // The start is given — the distance is the drill, not finding the note.
          lit={index === 0 && keys[0] ? [keys[0].midi] : undefined}
          wrong={wrong}
          showNames={showNames}
          onKeyPress={press}
          footerNote={complete ? 'Landed' : 'Play the run in order'}
        />
      </div>

      <p className={styles.note}>
        Think in distances, not letters: a melody is skip, step, skip — the same shape wherever it
        starts.
      </p>
    </DrillShell>
  );
}
