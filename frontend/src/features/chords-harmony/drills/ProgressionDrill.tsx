import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  StepStrip,
  TimerBar,
  WeakSpots,
  useAnswerDeadline,
  useScoreBook,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { cn } from '@/lib/cn';
import type { ChordForm, Inversion } from '../chords.types';
import { chordFor, familyOf } from '../data/diatonic';
import { inversionShort, movesFrom, travel, voicingOf } from '../data/inversions';
import type { ProgressionConfig } from '../data/progressions';
import { allowanceFor } from '../data/progressions';
import { ChordKeyboard } from '../components/ChordKeyboard';
import styles from '../components/chords.module.css';

const LAYOUT_ID = '25';
/** A chord change reached this slowly was searched for rather than chosen. */
const TARGET_MS = 2500;
/** How long each chord sounds when a progression plays itself. */
const PLAY_GAP = 0.85;

/** One chord of the run, once it has been played. */
interface Landed {
  symbol: string;
  numeral: string;
  inversion: Inversion;
  /** Semitones the hand actually travelled to get here. */
  moved: number;
  /** Semitones the closest position would have cost. */
  best: number;
}

/**
 * Progressions — 5.4.9, all of 5.6 and all of 5.7.
 *
 * One engine because all three are the same act: a sequence of roman numerals
 * is resolved into a key and played, chord by chord. What varies is what is
 * taken away — the chord names, the key, the freedom to choose a position, the
 * clock — and whether the sequence arrives on screen or in your ears.
 *
 * Numerals rather than chord names throughout, because that is the lesson of
 * both buckets: `I–V–vi–IV` is one pattern, and a drill that stored C, G, Am, F
 * would teach the letters and have to be written out twelve times.
 *
 * Notes may be pressed in any order, since a chord is a shape and not a
 * sequence. What is measured is the change: how long it took, and — where the
 * practice asks for it — how far the hand travelled against the shortest route
 * available.
 */
export function ProgressionDrill({ config }: { config: ProgressionConfig }) {
  const [keyName, setKeyName] = useState(config.keys[0] ?? 'C');
  const [strict, setStrict] = useState(!config.freeChoice);
  const [showChords, setShowChords] = useState(config.showChords);
  const { settings } = useSettings();
  const { book, record, clear } = useScoreBook();

  /** The numerals in play this cycle — drawn from the pool where there is one. */
  const [numerals, setNumerals] = useState<readonly string[]>(
    config.pool?.[0] ?? config.numerals,
  );
  const [cycle, setCycle] = useState(0);
  const [step, setStep] = useState(0);
  const [pressed, setPressed] = useState<readonly number[]>([]);
  const [landed, setLanded] = useState<readonly Landed[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  /** Set while a listening round is waiting for its answer. */
  const [guessing, setGuessing] = useState(config.identify);
  const [heardRight, setHeardRight] = useState<boolean | null>(null);
  const startedAt = useRef<number | null>(null);

  const mode = config.mode ?? 'major';
  const family = useMemo(() => familyOf(keyName, mode), [keyName, mode]);
  const chords = useMemo(
    () => numerals.flatMap((numeral) => {
      const entry = chordFor(keyName, numeral, mode);
      return entry ? [entry] : [];
    }),
    [keyName, mode, numerals],
  );

  const at = chords[step];
  const form: ChordForm | null = at?.form ?? null;
  const done = cycle >= config.cycles;

  /** Where the hand is: the shape just played, or the first chord's root position. */
  const [hand, setHand] = useState<readonly number[]>([]);
  const moves = useMemo(
    () => (form ? movesFrom(hand.length > 0 ? hand : voicingOf(form, 0).midis, form) : []),
    [form, hand],
  );
  const best = moves[0];

  /** Deals the next cycle: a fresh progression, and a key if there are several. */
  const nextCycle = useCallback(() => {
    if (config.pool && config.pool.length > 0) {
      setNumerals((current) => {
        const options = config.pool!.filter((entry) => entry.join() !== current.join());
        const from = options.length > 0 ? options : config.pool!;
        return from[Math.floor(Math.random() * from.length)] ?? current;
      });
    }
    if (config.keys.length > 1) {
      setKeyName((current) => {
        const options = config.keys.filter((entry) => entry !== current);
        const from = options.length > 0 ? options : config.keys;
        return from[Math.floor(Math.random() * from.length)] ?? current;
      });
    }
    setStep(0);
    setHand([]);
    setPressed([]);
    setWrong(null);
    setHeardRight(null);
    setGuessing(config.identify);
    startedAt.current = null;
  }, [config.identify, config.keys, config.pool]);

  /** A listening round plays itself, then waits for the answer. */
  const heard = useCallback(() => {
    if (!settings.soundEnabled || chords.length === 0) return;
    // A prediction round stops short of the ending, which is the question.
    const sounded = config.predict ? chords.slice(0, -1) : chords;
    // Each chord sounds as a block: the notes of one chord share a start time,
    // so the gap divides by however many notes a chord has.
    const line = sounded.flatMap((entry) => voicingOf(entry.form, 0).midis);
    instrument.playSequence(line, PLAY_GAP / Math.max(1, sounded[0]?.form.tones ?? 3));
  }, [chords, config.predict, settings.soundEnabled]);

  useEffect(() => {
    if (!guessing) return;
    heard();
    return () => instrument.silence();
  }, [guessing, heard]);

  const allowance = allowanceFor(config, cycle);
  const deadline = useAnswerDeadline({
    ms: guessing || done ? 0 : allowance,
    active: !done && !guessing,
    resetKey: `${cycle}:${step}`,
    onExpire: () => {
      if (!form) return;
      record(`${at?.numeral ?? ''} in ${keyName}`, false, null);
      setWrong('out of time');
      window.setTimeout(() => setWrong(null), 700);
      advance(voicingOf(form, 0).midis, 0, true);
    },
  });

  /** Moves to the next chord, banking what the change cost. */
  const advance = (shape: readonly number[], inversion: Inversion, expired = false) => {
    if (!form || !at) return;
    const moved = hand.length > 0 ? travel(hand, shape) : 0;
    const cheapest = best?.distance ?? moved;
    setLanded((current) => [
      ...current,
      { symbol: form.symbol, numeral: at.numeral, inversion, moved: expired ? cheapest : moved, best: cheapest },
    ]);
    setHand(shape);
    setPressed([]);
    startedAt.current = null;

    if (step + 1 < chords.length) {
      setStep(step + 1);
      return;
    }
    setCycle((current) => current + 1);
    if (cycle + 1 < config.cycles) nextCycle();
  };

  const press = (key: PianoKey) => {
    if (done || guessing || !form) return;

    const legal = moves.some((move) => move.midis.includes(key.midi));
    if (!legal) {
      setWrong(key.sharpName);
      record(`${at?.numeral ?? ''} in ${keyName}`, false, null);
      window.setTimeout(() => setWrong(null), 600);
      return;
    }
    if (pressed.includes(key.midi)) return;

    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    if (startedAt.current === null) startedAt.current = performance.now();
    const next = [...pressed, key.midi];
    setPressed(next);
    setWrong(null);
    if (next.length < form.tones) return;

    const shape = [...next].sort((a, b) => a - b);
    const move = moves.find(
      (entry) => entry.midis.length === shape.length && entry.midis.every((midi, i) => midi === shape[i]),
    );

    if (strict && config.measureMovement && move && best && move.inversion !== best.inversion) {
      setWrong(inversionShort(move.inversion));
      setPressed([]);
      record(`${at?.numeral ?? ''} in ${keyName}`, false, null);
      window.setTimeout(() => setWrong(null), 900);
      return;
    }

    record(
      `${at?.numeral ?? ''} in ${keyName}`,
      true,
      startedAt.current === null ? null : performance.now() - startedAt.current,
    );
    if (settings.soundEnabled) instrument.playMidis(shape);
    advance(shape, move?.inversion ?? 0);
  };

  const guess = (choice: readonly string[]) => {
    const right = choice.join() === numerals.join();
    setHeardRight(right);
    record(`hearing ${numerals.join('-')}`, right, null);
    if (right) setGuessing(false);
  };

  /** On a prediction round the ending is played rather than chosen. */
  const predicting = config.predict === true && guessing;
  useEffect(() => {
    if (!predicting) return;
    // The chords before the ending are taken as given, so the run starts at the
    // last one — what is being tested is the ending alone.
    setStep(Math.max(0, chords.length - 1));
    setGuessing(false);
  }, [chords.length, predicting]);

  const restart = () => {
    setCycle(0);
    setLanded([]);
    setKeyName(config.keys[0] ?? 'C');
    setNumerals(config.pool?.[0] ?? config.numerals);
    nextCycle();
    clear();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const moved = landed.reduce((sum, entry) => sum + entry.moved, 0);
  const cheapest = landed.reduce((sum, entry) => sum + entry.best, 0);

  /** What root position throughout would have cost, for the comparison. */
  const rootCost = useMemo(() => {
    let previous: readonly number[] = [];
    let sum = 0;
    for (const entry of landed) {
      const chord = family.find((degree) => degree.form.symbol === entry.symbol);
      if (!chord) continue;
      const midis = voicingOf(chord.form, 0).midis;
      if (previous.length > 0) sum += travel(previous, midis);
      previous = midis;
    }
    return sum;
  }, [family, landed]);

  /** Four progressions to choose between on a listening round. */
  const choices = useMemo(() => {
    const pool = config.pool ?? [config.numerals];
    const others = pool.filter((entry) => entry.join() !== numerals.join()).slice(0, 3);
    return [numerals, ...others].sort((a, b) => a.join().localeCompare(b.join()));
  }, [config.numerals, config.pool, numerals]);

  const strip = numerals.map((numeral) => {
    const entry = chordFor(keyName, numeral);
    return showChords && entry ? `${numeral} ${entry.form.symbol}` : numeral;
  });

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          {config.keys.length > 1 && (
            <Field label="Key" hint="The numerals do not change; every chord does.">
              <SegmentedControl
                value={keyName}
                options={config.keys.map((entry) => ({ value: entry, label: entry }))}
                onChange={setKeyName}
                block
                ariaLabel="Key"
              />
            </Field>
          )}
          <Toggle
            checked={showChords}
            onChange={setShowChords}
            label="Show the chord names"
            description="Off is the drill — the numerals have to reach your hands on their own."
          />
          {config.measureMovement && (
            <Toggle
              checked={strict}
              onChange={setStrict}
              label="Insist on the closest position"
              description="Off lets you choose and reports the cost, which teaches more."
            />
          )}
          {config.identify && (
            <Button variant="secondary" icon="play" onClick={heard} disabled={!settings.soundEnabled} block>
              Play it again
            </Button>
          )}
          <Button variant="secondary" icon="reset" onClick={restart} block>
            Start again
          </Button>
          <CounterRow>
            <Counter label="Cycle" value={`${Math.min(cycle + 1, config.cycles)}/${config.cycles}`} hint="times through" />
            <Counter label="Chords" value={`${landed.length}`} hint="played this session" />
          </CounterRow>
          {config.measureMovement && (
            <CounterRow>
              <Counter label="Your movement" value={`${moved}`} hint="semitones travelled" />
              <Counter
                label="Shortest"
                value={`${cheapest}`}
                hint={moved <= cheapest ? 'you took it every time' : `${moved - cheapest} further than needed`}
              />
              <Counter label="Root position" value={`${rootCost}`} hint="what never inverting would cost" />
            </CounterRow>
          )}
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — play a cycle." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={
          done
            ? `Session done — ${landed.length} chords in ${keyName} major`
            : guessing
              ? config.predict
                ? 'What comes next?'
                : 'Which progression was that?'
              : `${keyName} major · ${at?.numeral ?? ''}${showChords && form ? ` · ${form.symbol}` : ''}`
        }
        footer={
          <>
            {done && config.measureMovement && (
              <Chip tone="accent">
                {moved} semitones against {rootCost} in root position
              </Chip>
            )}
            {done && !config.measureMovement && <Chip tone="accent">Family complete</Chip>}
            {!done && guessing && heardRight === false && (
              <Chip tone="danger">Not that one — listen again</Chip>
            )}
            {!done && guessing && !settings.soundEnabled && (
              <Chip tone="danger">Turn sound on in settings — this round is only sound</Chip>
            )}
            {!done && !guessing && wrong !== null && (
              <Chip tone="danger">
                {wrong === 'out of time'
                  ? 'Out of time — that counts as a miss'
                  : strict && config.measureMovement && best
                    ? `Closest is ${inversionShort(best.inversion)}`
                    : `${wrong} is not in ${at?.numeral ?? 'this chord'}`}
              </Chip>
            )}
            {!done && !guessing && wrong === null && (
              <Chip>
                {pressed.length === 0
                  ? `${step + 1} of ${chords.length}${config.focus === at?.numeral ? ' · this is the one' : ''}`
                  : `${pressed.length} of ${form?.tones ?? 3} notes`}
              </Chip>
            )}
          </>
        }
      >
        {done ? '✓' : guessing ? '♪' : (at?.numeral ?? '?')}
      </DrillPrompt>

      <StepStrip
        items={strip}
        index={done || guessing ? -1 : step}
        wrong={wrong !== null}
        label="The progression"
      />

      {allowance > 0 && !done && !guessing && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="This chord" />
      )}

      {guessing && !config.predict ? (
        <div className={styles.steps}>
          {choices.map((choice) => (
            <button
              key={choice.join()}
              type="button"
              className={styles.step}
              disabled={!settings.soundEnabled}
              onClick={() => guess(choice)}
            >
              {choice.join(' – ')}
              <span className={styles.stepSub}>{choice.length} chords</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.board}>
          <ChordKeyboard
            layoutId={LAYOUT_ID}
            lit={hand}
            done={pressed}
            secondary={wrong !== null && best ? best.midis : undefined}
            showNames
            onKeyPress={press}
            footerNote={
              hand.length > 0
                ? 'Lit keys are where your hand is now — press the next chord in any order'
                : 'Press the chord in any order'
            }
          />
        </div>
      )}

      {landed.length > 0 && (
        <ol className={styles.card} aria-label="Chords played">
          {landed.slice(-6).map((entry, index) => (
            <li
              key={`${entry.symbol}-${index}`}
              className={cn(
                styles.cardRow,
                config.measureMovement && entry.moved > entry.best && styles.cardRowMiss,
              )}
            >
              <span className={styles.cardIndex}>{entry.numeral}</span>
              <span>
                {entry.symbol}
                {config.measureMovement ? ` · ${inversionShort(entry.inversion)}` : ''}
              </span>
              <span className={styles.cardTime}>
                {config.measureMovement ? `${entry.moved} semitones` : ''}
              </span>
              <span>
                {config.measureMovement ? (entry.moved === entry.best ? '✓' : `+${entry.moved - entry.best}`) : '✓'}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className={styles.note}>
        {config.measureMovement
          ? 'The question is never "what is this chord" — it is "which of its positions is nearest my hand".'
          : 'A numeral is a job in a key. I is home, V is tension, and both are true in every key there is.'}
      </p>
    </DrillShell>
  );
}
