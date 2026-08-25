import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Cover, Field, SegmentedControl, Toggle } from '@/components/ui';
import { noteKey, noteLabel } from '@/features/music-theory';
import type { PitchClass } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  WeakSpots,
  formatMs,
  useScoreBook,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LAYOUT_OPTIONS, SMALL_LAYOUT_ID } from '../data/layouts';
import { scopePitchClasses } from '../data/naming';
import type { KeyScope } from '../data/naming';
import { boardRegions, keyLabel, regionOf, regionSpan } from '../data/octaves';
import type { BoardRegion } from '../data/octaves';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import styles from '../components/geography.module.css';

/** The reference's pass mark: 20 attempts, at least 18 named right. */
const SET_SIZE = 20;
const PASS_RATE = 0.9;
/** How long the answer stays on screen before the next touch. */
const HOLD_MS = 1100;

const SCOPES = [
  { value: 'white' as KeyScope, label: 'White keys' },
  { value: 'all' as KeyScope, label: 'All keys' },
];

/** Touch first, then name — so the drill runs in two halves. */
type Phase = 'touch' | 'name';

interface Tally {
  attempts: number;
  correct: number;
  streak: number;
  bestStreak: number;
  totalMs: number;
}

const EMPTY_TALLY: Tally = { attempts: 0, correct: 0, streak: 0, bestStreak: 0, totalMs: 0 };

/**
 * 1.7.2 — touch a key you cannot see, then say what it was.
 *
 * The one practice in the bucket that runs the other way round: nothing is
 * called for, *you* choose where to land and the drill asks what you found. So
 * the prompt cannot come from a pool — you are the pool — and the screen keeps
 * its own tally rather than borrowing the quiz engine, which exists to ask
 * questions rather than to answer them.
 *
 * The ledger still works the same way: every attempt is filed under the note
 * you actually touched, so the panel names the keys you misread even though you
 * were the one who picked them. Move around turns on a region prompt, because
 * left alone most people touch the same comfortable five keys.
 */
export function BlindIdentifyDrill() {
  const [layoutId, setLayoutId] = useState(SMALL_LAYOUT_ID);
  const [scope, setScope] = useState<KeyScope>('white');
  const [spread, setSpread] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const regions = useMemo(() => boardRegions(layout), [layout]);
  const options = useMemo(
    () =>
      scopePitchClasses(layout, scope).map((pitchClass) => ({
        value: pitchClass,
        ...noteLabel(pitchClass, 'both'),
      })),
    [layout, scope],
  );

  const { book, record, clear } = useScoreBook();
  const [phase, setPhase] = useState<Phase>('touch');
  const [touched, setTouched] = useState<PianoKey | null>(null);
  const [given, setGiven] = useState<PitchClass | null>(null);
  const [region, setRegion] = useState<BoardRegion | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [tally, setTally] = useState<Tally>(EMPTY_TALLY);

  const touchedAt = useRef<number | null>(null);
  const lastMidi = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);

  const clearHold = useCallback(() => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);

  /** Sets up the next attempt, and where on the board it has to happen. */
  const deal = useCallback(() => {
    clearHold();
    setPhase('touch');
    setTouched(null);
    setGiven(null);
    setNudge(null);
    setRegion(spread ? (regions[Math.floor(Math.random() * regions.length)] ?? null) : null);
  }, [clearHold, regions, spread]);

  useEffect(() => {
    deal();
  }, [deal, layout, scope]);

  useEffect(() => clearHold, [clearHold]);

  const press = (key: PianoKey) => {
    if (phase !== 'touch') return;
    if (scope === 'white' && key.isBlack) {
      setNudge('White keys only in this setting');
      return;
    }
    if (region && !region.octaves.includes(key.octave)) {
      const landed = regionOf(regions, key.octave);
      setNudge(`That is the ${landed?.label.toLowerCase() ?? 'wrong'} third — ${region.label.toLowerCase()} was asked for`);
      return;
    }
    // The reference is explicit about mixing: the same key twice teaches nothing.
    if (key.midi === lastMidi.current) {
      setNudge('Already came from there — move somewhere else');
      return;
    }

    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    lastMidi.current = key.midi;
    touchedAt.current = performance.now();
    setNudge(null);
    setTouched(key);
    setPhase('name');
  };

  const name = (pitchClass: PitchClass) => {
    if (phase !== 'name' || !touched || given !== null) return;

    const isCorrect = pitchClass === touched.pitchClass;
    const elapsed = touchedAt.current === null ? null : performance.now() - touchedAt.current;
    setGiven(pitchClass);
    record(noteKey(touched.pitchClass, 'both'), isCorrect, isCorrect ? elapsed : null);
    setTally((current) => {
      const streak = isCorrect ? current.streak + 1 : 0;
      return {
        attempts: current.attempts + 1,
        correct: current.correct + (isCorrect ? 1 : 0),
        streak,
        bestStreak: Math.max(current.bestStreak, streak),
        totalMs: current.totalMs + (isCorrect && elapsed !== null ? elapsed : 0),
      };
    });

    clearHold();
    holdTimer.current = window.setTimeout(deal, HOLD_MS);
  };

  const answered = given !== null;
  const isCorrect = answered && touched !== null && given === touched.pitchClass;
  const covered = !answered;
  const spots = weakSpots(book);
  const setDone = tally.attempts >= SET_SIZE;
  const rate = tally.attempts === 0 ? null : tally.correct / tally.attempts;
  const passed = rate !== null && rate >= PASS_RATE;
  const averageMs = tally.correct === 0 ? null : tally.totalMs / tally.correct;

  return (
    <DrillShell
      goal="Land on a key you cannot see, and know what it is before you look."
      steps={[
        'The board is covered. Touch a key — you choose which, so pick somewhere new each time.',
        'Name it from what the position tells you, then the board uncovers and shows you.',
        'Twenty attempts with 18 named right is the pass mark.',
      ]}
      watchFor="Only ever touching the comfortable middle of the board. Move around keeps the region prompt on so you cannot settle."
      aside={
        <>
          <Field label="Keys" hint="Black keys are the harder half — they have no letter of their own.">
            <SegmentedControl
              value={scope}
              options={SCOPES}
              onChange={setScope}
              block
              ariaLabel="Keys in play"
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
            checked={spread}
            onChange={setSpread}
            label="Move around the board"
            description="Asks for a low, middle or high third each time, so the hand travels."
          />
          <CounterRow>
            <Counter
              label="Set"
              value={`${Math.min(tally.attempts, SET_SIZE)}/${SET_SIZE}`}
              hint={`${Math.round(PASS_RATE * 100)}% to pass`}
            />
            <Counter label="Named" value={`${tally.correct}/${tally.attempts}`} />
            <Counter label="Streak" value={String(tally.streak)} hint={`best ${tally.bestStreak}`} />
            <Counter label="Avg name" value={formatMs(averageMs)} />
            <Button
              variant="ghost"
              icon="reset"
              size="sm"
              onClick={() => {
                setTally(EMPTY_TALLY);
                lastMidi.current = null;
                deal();
              }}
            >
              Reset
            </Button>
          </CounterRow>
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more touches." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={
          phase === 'touch'
            ? region
              ? `Touch any key in the ${region.label.toLowerCase()} third · ${regionSpan(region)}`
              : 'Touch any key'
            : answered
              ? 'You were touching'
              : 'What are you touching?'
        }
        footer={
          <>
            {answered && isCorrect && (
              <Chip tone="accent">{touched ? keyLabel(touched) : 'Right'}</Chip>
            )}
            {answered && !isCorrect && touched && (
              <Chip tone="danger">
                That was {keyLabel(touched)} — you said {noteLabel(given, 'both').label}
              </Chip>
            )}
            {!answered && nudge && <Chip tone="danger">{nudge}</Chip>}
            {!answered && !nudge && (
              <Chip>
                {phase === 'touch'
                  ? setDone
                    ? passed
                      ? 'Set passed'
                      : 'Set short — run it again'
                    : 'Covered — aim by memory'
                  : 'Name it before you look'}
              </Chip>
            )}
          </>
        }
      >
        {answered && touched ? noteLabel(touched.pitchClass, 'both').label : '?'}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <Cover
          covered={covered}
          note={phase === 'touch' ? 'Covered — touch a key' : 'Name it, then it uncovers'}
        >
          <GeographyKeyboard
            layoutId={layoutId}
            litMidis={answered && touched ? [touched.midi] : undefined}
            showNames={answered}
            onKeyPress={press}
            footerNote={answered ? 'That is where you were' : 'Press where you think you are'}
          />
        </Cover>
      </div>

      {phase === 'name' && (
        <LabelButtons
          options={options}
          onAnswer={name}
          correct={answered && touched ? touched.pitchClass : null}
          wrong={answered && !isCorrect ? given : null}
          disabled={answered}
        />
      )}

      <p className={styles.landmark}>
        Feel for the shape first: a key with black keys either side of it is D, G or A. A key with
        none to its left is C or F.
      </p>
    </DrillShell>
  );
}
