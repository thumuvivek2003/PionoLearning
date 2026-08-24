import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  DrillPrompt,
  DrillShell,
  RunCounters,
  StepStrip,
  WeakSpots,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LAYOUT_OPTIONS, WIDE_LAYOUT_ID } from '../data/layouts';
import { chainAnchors, chainFrom, chainShape, landmarkWhere } from '../data/landmarks';
import { keyLabel } from '../data/octaves';
import type { ChainDrillConfig } from '../data/landmarkDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import styles from '../components/geography.module.css';

/** Which way a run is walked. */
type ChainDirection = 'up' | 'down' | 'mixed';

const DIRECTIONS = [
  { value: 'up' as ChainDirection, label: 'Ascending' },
  { value: 'down' as ChainDirection, label: 'Descending' },
  { value: 'mixed' as ChainDirection, label: 'Mixed' },
];

/** The run as it has to be played, which is the block possibly reversed. */
function sequenceFor(
  layout: KeyboardLayout,
  anchor: PianoKey,
  config: ChainDrillConfig,
  descending: boolean,
): readonly PianoKey[] {
  const block = chainFrom(layout, anchor, config.kind) ?? [];
  return descending ? [...block].reverse() : block;
}

function pick<T>(items: readonly T[], avoid?: T): T | undefined {
  const options = avoid === undefined ? items : items.filter((item) => item !== avoid);
  const from = options.length > 0 ? options : items;
  return from[Math.floor(Math.random() * from.length)];
}

/**
 * 1.4.3 – 1.4.6 — the block that hangs off a landmark, played as one shape.
 *
 * A chain rather than a quiz: the answer is the whole run, so it is timed end to
 * end and the strip only fills in behind you. The board never shows what comes
 * next — the landmark under the lit key is the only thing you get, which is the
 * entire point of the bucket.
 *
 * Stumbles are recorded per note, so the panel can say "you lose B" or "A# is
 * where you stop" instead of just counting the misses.
 */
export function LandmarkChainDrill({ config }: { config: ChainDrillConfig }) {
  const [layoutId, setLayoutId] = useState(WIDE_LAYOUT_ID);
  const [direction, setDirection] = useState<ChainDirection>('up');
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const anchors = useMemo(
    () => chainAnchors(layout, config.landmarks, config.kind),
    [config.kind, config.landmarks, layout],
  );

  const [anchor, setAnchor] = useState<PianoKey | null>(() => anchors[0] ?? null);
  const [descending, setDescending] = useState(false);
  const [index, setIndex] = useState(0);
  const [wrongMidi, setWrongMidi] = useState<number | null>(null);

  const { book, record, clear } = useScoreBook();
  /** When the current step became the one to play — its own little stopwatch. */
  const stepAt = useRef<number | null>(null);

  /** Deals the next run: a landmark somewhere on the board, and a direction. */
  const deal = useCallback(() => {
    setAnchor((current) => pick(anchors, current ?? undefined) ?? current);
    setDescending(direction === 'mixed' ? Math.random() < 0.5 : direction === 'down');
    setIndex(0);
    setWrongMidi(null);
    stepAt.current = performance.now();
  }, [anchors, direction]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  // A new board or direction is a new run rather than a rewritten one.
  useEffect(() => {
    dealNow();
  }, [dealNow, direction, layout]);

  const sequence = useMemo(
    () => (anchor ? sequenceFor(layout, anchor, config, descending) : []),
    [anchor, config, descending, layout],
  );
  const expected = sequence[index];
  const complete = sequence.length > 0 && index >= sequence.length;
  const wrongKey = layout.keys.find((key) => key.midi === wrongMidi);

  const press = (key: PianoKey) => {
    if (complete || !expected) return;

    if (key.midi !== expected.midi) {
      stumble();
      record(expected.sharpName, false, null);
      setWrongMidi(key.midi);
      window.setTimeout(() => setWrongMidi(null), 500);
      return;
    }

    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    const now = performance.now();
    record(expected.sharpName, true, stepAt.current === null ? null : now - stepAt.current);
    stepAt.current = now;
    setWrongMidi(null);

    const next = index + 1;
    setIndex(next);
    if (next >= sequence.length) finish();
  };

  const spots = weakSpots(book);
  const played = index > 0 ? sequence[index - 1] : null;
  const start = sequence[0];

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Direction" hint="Mixed picks a way round for every run.">
            <SegmentedControl
              value={direction}
              options={DIRECTIONS}
              onChange={setDirection}
              block
              ariaLabel="Direction"
            />
          </Field>
          <Field label="Keyboard" hint="A wider board means the block turns up anywhere.">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill: the shape has to come from the landmark."
          />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New run
          </Button>
          <RunCounters stats={stats} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more runs." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={`${descending ? 'Down' : 'Up'} from the lit key · ${config.shape}`}
        footer={
          <>
            {complete && (
              <Chip tone="accent">
                {chainShape(sequence)}
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && wrongKey && (
              <Chip tone="danger">{wrongKey.sharpName} is not next</Chip>
            )}
            {!complete && !wrongKey && (
              <Chip>
                Note {index + 1} of {sequence.length}
              </Chip>
            )}
          </>
        }
      >
        {start ? start.sharpName : '—'}
      </DrillPrompt>

      <StepStrip
        items={sequence.map((key, position) => (position < index ? key.sharpName : '·'))}
        index={complete ? -1 : index}
        wrong={wrongMidi !== null}
        label="The run"
      />

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          // The start is given; after that the board only shows where you are.
          litMidis={
            index === 0
              ? start
                ? [start.midi]
                : undefined
              : played
                ? [played.midi]
                : undefined
          }
          doneMidis={sequence.slice(0, index).map((key) => key.midi)}
          secondaryMidis={wrongMidi === null ? undefined : [wrongMidi]}
          showNames={showNames || complete}
          onKeyPress={press}
          footerNote={complete ? 'Run complete' : 'Play the run in order'}
        />
      </div>

      <p className={styles.landmark}>
        {anchor
          ? `${keyLabel(anchor)} · ${landmarkWhere(anchor.sharpName as Letter).toLowerCase()}`
          : 'No room for this run on this board.'}
      </p>
    </DrillShell>
  );
}
