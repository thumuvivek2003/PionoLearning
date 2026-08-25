import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Cover, Field, SegmentedControl, Toggle } from '@/components/ui';
import { noteKey } from '@/features/music-theory';
import { getKeyboardLayout, whiteStep } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  RunCounters,
  StepStrip,
  WeakSpots,
  formatMs,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { handShort } from '../data/fingers';
import { drawNotes } from '../data/randomNotes';
import {
  NO_REPAIR,
  REVIEW_POINTS,
  afterCleanPass,
  afterMiss,
  inspectionFor,
  repairNote,
} from '../data/validation';
import type { RepairState } from '../data/validation';
import type { ValidationConfig } from '../data/validationDrills';
import type { FingerNumber, Hand } from '../finger.types';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** Wide enough for a line to start anywhere sensible. */
const LAYOUT_ID = '49';

/** A note this slow is hesitation rather than playing. */
const TARGET_MS = 900;

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

/** Places a written line somewhere it fits. */
function placeLine(layout: KeyboardLayout, offsets: readonly number[]): readonly PianoKey[] {
  const room = layout.keys.filter(
    (key) => !key.isBlack && offsets.every((offset) => whiteStep(layout, key, offset) !== undefined),
  );
  const start = room[Math.floor(Math.random() * room.length)];
  if (!start) return [];
  return offsets.flatMap((offset) => {
    const key = whiteStep(layout, start, offset);
    return key ? [key] : [];
  });
}

/**
 * 2.12.1 – 2.12.8 — is the movement learnt, or only learnt here?
 *
 * The closing bucket of the level is a test rather than a lesson, so each
 * practice removes one of the crutches an earlier one may have left behind: the
 * tempo, the notes, the place, the fingering, or being able to watch. Nothing
 * here is new to play; what is new is that a pass only counts when the crutch
 * is gone.
 *
 * The mechanic that matters is the correction loop. The reference is emphatic
 * that repeating a mistake teaches it, so three misses in the same spot **cut
 * the line back** to just before the trouble; two clean passes at the shorter
 * length grow it back a note at a time. That is the one rule a practising human
 * reliably fails to apply to themselves, which is exactly why the drill applies
 * it for you.
 */
export function ValidationDrill({ config }: { config: ValidationConfig }) {
  const [hand, setHand] = useState<Hand>('right');
  const [fingeringId, setFingeringId] = useState(config.fingerings?.[0]?.id ?? '');
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  const fingering = useMemo(
    () => config.fingerings?.find((entry) => entry.id === fingeringId) ?? config.fingerings?.[0],
    [config.fingerings, fingeringId],
  );

  const [keys, setKeys] = useState<readonly PianoKey[]>([]);
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [repair, setRepair] = useState<RepairState>(NO_REPAIR);
  const [passes, setPasses] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const stepAt = useRef<number | null>(null);
  /** Where the misses of this pass fell, so a repeated spot can be spotted. */
  const missedAt = useRef<number | null>(null);
  const cleanPass = useRef(true);

  /** Deals the next pass, at whatever length the repair state allows. */
  const deal = useCallback(() => {
    const full = config.offsets?.length ?? config.length ?? 5;
    const wanted = repair.length ?? full;
    const line =
      config.source === 'random'
        ? drawNotes(layout, { length: wanted, scope: 'white', spanSemitones: 12 })
        : placeLine(layout, (config.offsets ?? []).slice(0, wanted));

    setKeys(line);
    setIndex(0);
    setPlayed([]);
    setWrong(null);
    setNote(null);
    setReviewing(false);
    stepAt.current = null;
    cleanPass.current = true;
  }, [config.length, config.offsets, config.source, layout, repair.length]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, fingeringId, hand]);

  const expected = keys[index];
  const complete = keys.length > 0 && index >= keys.length;
  const full = config.offsets?.length ?? config.length ?? 5;
  /** Covered practices show the first note, then hide the board. */
  const covered = config.vision === 'covered' && index > 0 && !complete;

  const fingerAt = (position: number): FingerNumber | undefined =>
    fingering?.fingers[position] ?? undefined;

  const scoreKey = (position: number, key: PianoKey): string => {
    if (config.source === 'transposed') return `from ${keys[0]?.sharpName ?? '?'}`;
    if (config.source === 'refingered') return `${fingering?.label ?? ''} · ${fingerAt(position) ?? ''}`;
    return noteKey(key.pitchClass, 'both');
  };

  const press = (key: PianoKey) => {
    if (complete || !expected) return;

    const now = performance.now();
    const since = stepAt.current === null ? Infinity : now - stepAt.current;
    if (config.minGapMs !== undefined && since < config.minGapMs) {
      setNote('Too quick — this practice is deliberately slow');
      return;
    }

    if (key.midi !== expected.midi) {
      stumble();
      cleanPass.current = false;
      record(scoreKey(index, expected), false, null);
      if (config.repair) {
        // A different spot starts its own count; the same one builds towards a cut.
        const state = missedAt.current === index ? repair : { ...repair, errors: 0 };
        missedAt.current = index;
        const next = afterMiss(state, index, full);
        setRepair(next);
        setNote(repairNote(next, full) ?? 'Wrong note — find it and carry on');
      } else {
        setNote('Wrong note — find it and carry on');
      }
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }

    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    setNote(null);
    setPlayed((current) => [...current, key.midi]);
    record(scoreKey(index, key), true, stepAt.current === null ? null : since);
    stepAt.current = now;

    const next = index + 1;
    setIndex(next);
    if (next < keys.length) return;

    if (config.repair && cleanPass.current) {
      const grown = afterCleanPass(repair, full);
      setRepair(grown);
      setNote(repairNote(grown, full));
      missedAt.current = null;
    }
    setPasses((current) => current + 1);
    if (config.review) setReviewing(true);
    finish();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const strip = keys.map((key, position) => {
    const finger = fingerAt(position);
    return finger ? `${key.sharpName}·${finger}` : key.sharpName;
  });

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Hand">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>
          {config.fingerings && config.fingerings.length > 1 && (
            <Field label="Fingering" hint="Every one of these is a real solution, not a random one.">
              <SegmentedControl
                value={fingeringId}
                options={config.fingerings.map((entry) => ({ value: entry.id, label: entry.label }))}
                onChange={setFingeringId}
                block
                ariaLabel="Fingering"
              />
            </Field>
          )}
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New pass
          </Button>
          <RunCounters stats={stats} runsLabel="Passes" />
          <CounterRow>
            <Counter
              label="Length"
              value={`${keys.length}/${full}`}
              hint={repair.length === null ? 'full line' : 'cut back'}
            />
            <Counter label="Per note" value={formatMs(stats.lastSeconds === null ? null : (stats.lastSeconds * 1000) / Math.max(1, keys.length))} />
          </CounterRow>
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more passes." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${handShort(hand)} · ${keys.length} notes`,
          keys[0] ? `from ${keys[0].sharpName}` : '',
          fingering && config.fingerings && config.fingerings.length > 1 ? fingering.label : '',
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {complete && !note && <Chip tone="accent">Pass complete</Chip>}
            {note && <Chip tone={repair.length === null ? 'danger' : 'accent'}>{note}</Chip>}
            {!complete && !note && (
              <Chip>
                Note {index + 1} of {keys.length}
              </Chip>
            )}
          </>
        }
      >
        {expected ? (fingerAt(index) ?? expected.sharpName) : complete ? '✓' : '·'}
      </DrillPrompt>

      {config.vision === 'inspect' && (
        <p className={styles.inspect}>Check this pass: {inspectionFor(passes)}</p>
      )}

      <StepStrip
        items={strip}
        index={complete ? -1 : index}
        wrong={wrong !== null}
        label="The line"
      />

      <div className={styles.board}>
        <Cover covered={covered} note="Covered — the hand knows where it is">
          <HandKeyboard
            layoutId={LAYOUT_ID}
            done={played}
            lit={index === 0 && keys[0] ? [keys[0].midi] : undefined}
            wrong={wrong}
            showNames={showNames && !covered}
            onKeyPress={press}
            footerNote={covered ? 'Play it from memory' : 'Play the line in order'}
          />
        </Cover>
      </div>

      {reviewing && (
        <div className={styles.review}>
          <p className={styles.reviewTitle}>
            Watch the hands, then listen — and pick one thing, not six.
          </p>
          <div className={styles.reviewColumns}>
            <ul className={styles.reviewList}>
              {REVIEW_POINTS.hands.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <ul className={styles.reviewList}>
              {REVIEW_POINTS.sound.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <p className={styles.note}>
            The panel above has the half a screen can measure. A camera has the rest.
          </p>
        </div>
      )}
    </DrillShell>
  );
}
