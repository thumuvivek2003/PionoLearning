import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Chip, Cover } from '@/components/ui';
import { SEMITONES_PER_OCTAVE } from '@/features/music-theory';
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
import { FIFTH_AT, THIRD_AT, chordForm } from '../data/triads';
import { chordFor } from '../data/diatonic';
import { inversionName, movesFrom, voicingOf } from '../data/inversions';
import type { ChordContestConfig, ContestRound } from '../data/contestDrills';
import { ChordKeyboard } from '../components/ChordKeyboard';
import styles from '../components/chords.module.css';

const LAYOUT_ID = '25';
/** A chord found more slowly than this was worked out rather than known. */
const TARGET_MS = 2500;
/** Melody notes over a chord: its third, fifth and third again, an octave up. */
const MELODY_STEPS = [THIRD_AT, FIFTH_AT, THIRD_AT];

/** What one round cost. */
interface Scored {
  label: string;
  seconds: number | null;
  mistakes: number;
  expired: boolean;
}

/** Everything a round needs, resolved before it starts. */
interface Setup {
  round: ContestRound;
  key: string;
  numerals: readonly string[];
  /** The chords to play, in order — a progression, or one chord repeated. */
  forms: readonly ChordForm[];
  /** Fixed for an inverted round; free elsewhere. */
  inversion: Inversion | null;
}

/**
 * 5.10.10 — the level's final test.
 *
 * Ten rounds of things earlier buckets taught, arriving without warning and
 * against a clock. No round asks anything new; what the contest adds is that
 * you do not get to decide which skill is next, which is the only condition
 * that resembles the day itself.
 *
 * The card is the output. A total says whether the run went well and nothing
 * about why, so every round is recorded on its own line — the transposition
 * round and the blind round fail in completely different ways and need
 * completely different practice.
 */
export function ChordContestDrill({ config }: { config: ChordContestConfig }) {
  const { settings } = useSettings();
  const { book, record, clear } = useScoreBook();

  const [round, setRound] = useState(0);
  const [step, setStep] = useState(0);
  const [pressed, setPressed] = useState<readonly number[]>([]);
  const [melodyAt, setMelodyAt] = useState(-1);
  const [card, setCard] = useState<readonly Scored[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [hand, setHand] = useState<readonly number[]>([]);
  const startedAt = useRef<number | null>(null);
  const mistakes = useRef(0);
  const closing = useRef(false);

  const done = round >= config.rounds.length;

  /**
   * The round, resolved once.
   *
   * Drawn from the round index rather than at random each render, so a round
   * does not change shape underneath you between presses.
   */
  const setup = useMemo<Setup | null>(() => {
    const entry = config.rounds[round];
    if (!entry) return null;

    const pick = <T,>(items: readonly T[], at: number): T | undefined =>
      items[(at * 7 + round * 3) % Math.max(1, items.length)];

    const key =
      entry.kind === 'transpose'
        ? (pick(config.keys, round + 1) ?? 'G')
        : (config.keys[0] ?? 'C');
    const numerals = pick(config.progressions, round) ?? ['I', 'IV', 'V', 'I'];

    if (entry.kind === 'chord' || entry.kind === 'inverted' || entry.kind === 'melody') {
      const root = pick(config.roots, round + 2) ?? 'C';
      const quality = pick(config.qualities, round) ?? 'major';
      const form = chordForm(root, quality);
      return form
        ? {
            round: entry,
            key,
            numerals: [form.symbol],
            forms: [form],
            inversion: entry.kind === 'inverted' ? (pick(config.inversions, round + 1) ?? 0) : null,
          }
        : null;
    }

    const line = entry.kind === 'continuous' ? [...numerals, ...numerals] : numerals;
    const forms = line.flatMap((numeral) => {
      const chord = chordFor(key, numeral);
      return chord ? [chord.form] : [];
    });
    return { round: entry, key, numerals: line, forms, inversion: null };
  }, [config, round]);

  const form = setup?.forms[step];
  /** Which shapes count as this chord: one position, or any of them. */
  const allowed = useMemo(() => {
    if (!form) return [];
    if (setup?.inversion !== null && setup?.inversion !== undefined) {
      return [voicingOf(form, setup.inversion).midis];
    }
    return movesFrom(hand.length > 0 ? hand : voicingOf(form, 0).midis, form).map((move) => move.midis);
  }, [form, hand, setup]);

  const melodyNotes = useMemo(() => {
    if (!form || setup?.round.kind !== 'melody') return [];
    const midis = voicingOf(form, 0).midis;
    return MELODY_STEPS.map((at) => (midis[at] ?? midis[0] ?? 60) + SEMITONES_PER_OCTAVE);
  }, [form, setup]);

  const closeRound = useCallback(
    (expired: boolean) => {
      if (closing.current || !setup) return;
      closing.current = true;
      const seconds =
        startedAt.current === null ? null : (performance.now() - startedAt.current) / 1000;
      setCard((current) => [
        ...current,
        { label: setup.round.label, seconds, mistakes: mistakes.current, expired },
      ]);
      record(setup.round.label, !expired && mistakes.current === 0, seconds === null ? null : seconds * 1000);
      setRound((current) => current + 1);
      setStep(0);
      setPressed([]);
      setMelodyAt(-1);
      setHand([]);
      startedAt.current = null;
      mistakes.current = 0;
      closing.current = false;
    },
    [record, setup],
  );

  const deadline = useAnswerDeadline({
    ms: done ? 0 : (setup?.round.seconds ?? 0) * 1000,
    active: !done,
    resetKey: `${round}`,
    onExpire: () => closeRound(true),
  });

  const press = (key: PianoKey) => {
    if (done || !setup || !form) return;

    // A melody round plays the chord first, then its notes one at a time.
    if (melodyAt >= 0) {
      if (key.midi !== melodyNotes[melodyAt]) {
        mistakes.current += 1;
        setWrong(key.sharpName);
        window.setTimeout(() => setWrong(null), 400);
        return;
      }
      if (settings.soundEnabled) instrument.playMidis([key.midi]);
      const next = melodyAt + 1;
      if (next >= melodyNotes.length) {
        closeRound(false);
        return;
      }
      setMelodyAt(next);
      return;
    }

    const legal = allowed.some((shape) => shape.includes(key.midi));
    if (!legal) {
      mistakes.current += 1;
      setWrong(key.sharpName);
      window.setTimeout(() => setWrong(null), 400);
      return;
    }
    if (pressed.includes(key.midi)) return;

    if (startedAt.current === null) startedAt.current = performance.now();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    const next = [...pressed, key.midi];
    setPressed(next);
    setWrong(null);
    if (next.length < form.tones) return;

    const shape = [...next].sort((a, b) => a - b);
    // The shape must be one whole position, not three notes from three of them.
    if (!allowed.some((option) => option.length === shape.length && option.every((midi, i) => midi === shape[i]))) {
      mistakes.current += 1;
      setPressed([]);
      setWrong('mixed positions');
      window.setTimeout(() => setWrong(null), 600);
      return;
    }

    setHand(shape);
    setPressed([]);
    if (setup.round.kind === 'melody') {
      setMelodyAt(0);
      return;
    }
    const nextStep = step + 1;
    if (nextStep >= setup.forms.length) {
      closeRound(false);
      return;
    }
    setStep(nextStep);
  };

  const restart = () => {
    setRound(0);
    setStep(0);
    setPressed([]);
    setMelodyAt(-1);
    setCard([]);
    setHand([]);
    setWrong(null);
    startedAt.current = null;
    mistakes.current = 0;
    closing.current = false;
    clear();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const total = card.reduce((sum, entry) => sum + (entry.seconds ?? 0), 0);
  const clean = card.filter((entry) => entry.mistakes === 0 && !entry.expired).length;
  const slips = card.reduce((sum, entry) => sum + entry.mistakes, 0);
  const covered = setup?.round.kind === 'blind' && !done;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          <CounterRow>
            <Counter label="Round" value={`${Math.min(round + 1, config.rounds.length)}/${config.rounds.length}`} hint="of the run" />
            <Counter label="Clean" value={`${clean}/${card.length}`} hint="no slips, in time" />
          </CounterRow>
          <CounterRow>
            <Counter label="Total" value={total === 0 ? '—' : `${total.toFixed(1)}s`} hint="across the run" />
            <Counter label="Slips" value={`${slips}`} hint="wrong notes and wrong shapes" />
          </CounterRow>
          <Button variant="secondary" icon="reset" onClick={restart} block>
            New run
          </Button>
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — finish a run." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={
          done
            ? `Run complete — ${clean} of ${config.rounds.length} clean in ${total.toFixed(1)}s`
            : `${setup?.round.label ?? ''} · ${setup?.round.brief ?? ''}`
        }
        footer={
          <>
            {done && (
              <Chip tone={clean === config.rounds.length ? 'accent' : 'neutral'}>
                {slips} slip{slips === 1 ? '' : 's'} · {card.filter((e) => e.expired).length} out of time
              </Chip>
            )}
            {!done && wrong !== null && (
              <Chip tone="danger">
                {wrong === 'mixed positions' ? 'One position at a time' : `${wrong} is not in it`}
              </Chip>
            )}
            {!done && wrong === null && (
              <Chip tone={setup?.round.kind === 'transpose' ? 'accent' : 'neutral'}>
                {melodyAt >= 0
                  ? `melody note ${melodyAt + 1} of ${melodyNotes.length}`
                  : setup?.round.kind === 'transpose'
                    ? `in ${setup.key} major`
                    : `${step + 1} of ${setup?.forms.length ?? 1}`}
                {setup?.inversion !== null && setup?.inversion !== undefined
                  ? ` · ${inversionName(setup.inversion)}`
                  : ''}
              </Chip>
            )}
          </>
        }
      >
        {done ? '✓' : melodyAt >= 0 ? '♪' : (form?.symbol ?? '?')}
      </DrillPrompt>

      {!done && (
        <StepStrip
          items={setup?.numerals ?? []}
          index={melodyAt >= 0 ? -1 : step}
          wrong={wrong !== null}
          label="This round"
        />
      )}

      {!done && (setup?.round.seconds ?? 0) > 0 && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="This round" />
      )}

      {!done && (
        <div className={styles.board}>
          <Cover covered={covered} note="Covered — play it by touch">
            <ChordKeyboard
              layoutId={LAYOUT_ID}
              lit={melodyAt >= 0 ? [melodyNotes[melodyAt] ?? 60] : hand}
              done={pressed}
              showNames={!covered}
              onKeyPress={press}
              footerNote={
                melodyAt >= 0 ? 'One note at a time' : 'Press the chord in any order'
              }
            />
          </Cover>
        </div>
      )}

      {card.length > 0 && (
        <ol className={styles.card} aria-label="Contest card">
          {card.map((entry, index) => (
            <li
              key={`${entry.label}-${index}`}
              className={cn(styles.cardRow, (entry.mistakes > 0 || entry.expired) && styles.cardRowMiss)}
            >
              <span className={styles.cardIndex}>{index + 1}</span>
              <span>{entry.label}</span>
              <span className={styles.cardTime}>
                {entry.seconds === null ? '—' : `${entry.seconds.toFixed(1)}s`}
              </span>
              <span>{entry.expired ? 'out of time' : entry.mistakes === 0 ? '✓' : `${entry.mistakes}✗`}</span>
            </li>
          ))}
        </ol>
      )}

      <p className={styles.note}>
        Ten rounds, no warning. The card is the point — a total says how the run went and nothing
        about which skill let you down.
      </p>
    </DrillShell>
  );
}
