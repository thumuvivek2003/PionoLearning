import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PitchClass } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
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
import { generateSequence, getStrategy } from '@/features/randomizer';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LAYOUT_OPTIONS, SMALL_LAYOUT_ID } from '../data/layouts';
import { noteKey, noteLabel, scopePitchClasses } from '../data/naming';
import type { KeyScope } from '../data/naming';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import styles from '../components/geography.module.css';

/** One note of the sequence — the pitch class, identified for the randomizer. */
interface Note {
  id: string;
  pitchClass: PitchClass;
}

const LENGTHS = [
  { value: '4', label: '4 notes' },
  { value: '6', label: '6 notes' },
  { value: '8', label: '8 notes' },
];

const SCOPES = [
  { value: 'white' as KeyScope, label: 'White keys' },
  { value: 'all' as KeyScope, label: 'All keys' },
];

/**
 * 1.5.8 — a random sequence, read and played in order.
 *
 * The step up from single-note recognition: with a queue in front of you the
 * next note has to be recognised while your hand is still finishing the last
 * one, which is where reading actually starts. Any octave counts — the sequence
 * is about note identity, not position — and stumbles are recorded per note, so
 * the drill can point at the one you keep breaking on.
 *
 * Notes are drawn through the randomizer with the same weak-spot weights the
 * recognition drills use, so a sequence quietly over-samples what you miss.
 */
export function RandomSequenceDrill() {
  const [layoutId, setLayoutId] = useState(SMALL_LAYOUT_ID);
  const [scope, setScope] = useState<KeyScope>('white');
  const [length, setLength] = useState(LENGTHS[0]?.value ?? '4');
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const pool = useMemo(
    () =>
      scopePitchClasses(layout, scope).map<Note>((pitchClass) => ({
        id: String(pitchClass),
        pitchClass,
      })),
    [layout, scope],
  );

  const { book, record, clear } = useScoreBook();
  const naming = 'both' as const;
  const keyOf = useCallback((note: Note) => noteKey(note.pitchClass, naming), []);
  const weights = useMemo(() => drawWeights(pool, book, keyOf), [book, keyOf, pool]);

  const [sequence, setSequence] = useState<readonly Note[]>([]);
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<PitchClass | null>(null);
  /** When the current note became the one to play. */
  const stepAt = useRef<number | null>(null);

  /** Deals the next sequence, leaning on whatever is weakest so far. */
  const deal = useCallback(() => {
    setSequence(
      generateSequence({
        pool,
        strategy: getStrategy(focusWeak ? 'weak-focus' : 'no-repeat'),
        count: Number(length),
        weights,
      }),
    );
    setIndex(0);
    setPlayed([]);
    setWrong(null);
    stepAt.current = performance.now();
  }, [focusWeak, length, pool, weights]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  // A new pool, length or draw policy is a new sequence.
  useEffect(() => {
    dealNow();
  }, [dealNow, focusWeak, layout, length, scope]);

  const expected = sequence[index];
  const complete = sequence.length > 0 && index >= sequence.length;

  const press = (key: PianoKey) => {
    if (complete || !expected) return;

    if (key.pitchClass !== expected.pitchClass) {
      stumble();
      record(keyOf(expected), false, null);
      setWrong(key.pitchClass);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }

    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    const now = performance.now();
    record(keyOf(expected), true, stepAt.current === null ? null : now - stepAt.current);
    stepAt.current = now;
    setWrong(null);
    setPlayed((current) => [...current, key.midi]);

    const next = index + 1;
    setIndex(next);
    if (next >= sequence.length) finish();
  };

  const spots = weakSpots(book);
  const askedLabel = expected ? noteLabel(expected.pitchClass, naming) : null;
  const wrongLabel = wrong === null ? null : noteLabel(wrong, naming).label;

  return (
    <DrillShell
      goal="Read a queue of notes and play them in order — any octave, no counting."
      steps={[
        'Read the whole sequence first, then play it left to right.',
        'Any octave counts, so pick the nearest one and keep your hand still.',
        'Lengthen the sequence once four notes come out in one smooth pass.',
      ]}
      watchFor="Stopping to work out each note as you reach it. Read one note ahead of the one you are playing — that is the skill this drill builds."
      aside={
        <>
          <Field label="Length" hint="Four notes first. Eight is the pass mark for this bucket.">
            <SegmentedControl
              value={length}
              options={LENGTHS}
              onChange={setLength}
              block
              ariaLabel="Sequence length"
            />
          </Field>
          <Field label="Notes">
            <SegmentedControl
              value={scope}
              options={SCOPES}
              onChange={setScope}
              block
              ariaLabel="Notes drawn"
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
            description="Fills the sequence with the notes you keep stumbling on."
          />
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill — the sequence is the only place names appear."
          />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New sequence
          </Button>
          <RunCounters stats={stats} runsLabel="Sequences" />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — play a few sequences." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={complete ? 'Sequence complete' : `Note ${index + 1} of ${sequence.length}`}
        footer={
          <>
            {complete && (
              <Chip tone="accent">
                Clean pass
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && wrongLabel && <Chip tone="danger">{wrongLabel} is not next</Chip>}
            {!complete && !wrongLabel && <Chip>Any octave counts</Chip>}
          </>
        }
      >
        {complete ? '✓' : (askedLabel?.label ?? '—')}
      </DrillPrompt>

      <StepStrip
        items={sequence.map((note) => noteLabel(note.pitchClass, naming).label)}
        index={complete ? -1 : index}
        wrong={wrong !== null}
        label="The sequence"
      />

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          // Only the keys you actually pressed; nothing points at what is next.
          doneMidis={played}
          showNames={showNames}
          onKeyPress={press}
          footerNote={complete ? 'Sequence complete' : 'Play the sequence in order'}
        />
      </div>
    </DrillShell>
  );
}
