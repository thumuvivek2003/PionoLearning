import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Cover, Field, SegmentedControl, Toggle } from '@/components/ui';
import { SEMITONES_PER_OCTAVE } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  StepStrip,
  WeakSpots,
  beatMs,
  onBeatRate,
  recordTiming,
  timingBias,
  useMetronome,
  useScoreBook,
  weakSpots,
} from '@/features/practice-kit';
import type { TimingTally } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { THIRD_AT, FIFTH_AT } from '../data/triads';
import { chordFor } from '../data/diatonic';
import { movesFrom, travel, voicingOf } from '../data/inversions';
import type { ChordRhythmConfig, Slot } from '../data/rhythmDrills';
import { beatsInLoop, rotated, slotsOf, strumPattern } from '../data/rhythmDrills';
import { ChordKeyboard } from '../components/ChordKeyboard';
import styles from '../components/chords.module.css';

const LAYOUT_ID = '25';
const CLICK_MIDI = 84;
const BEATS_PER_BAR = 4;
/** A hit this far from its beat is late enough to hear. */
const TARGET_MS = 120;

/**
 * 5.8 — the chords put in time.
 *
 * Every other bucket in this level asks which chord. This one asks *when*, and
 * a chord that is right two beats late is wrong in the only way an audience
 * notices. So the click is in charge: the drill builds a schedule of beats from
 * the config — one chord a bar, two a bar, half notes, quarters, a melody on the
 * beats the chord does not fall on — and measures each press against the beat it
 * was due on.
 *
 * **Chord changes are tallied apart from repeats**, which is the whole
 * diagnosis. Almost everybody can keep time striking the same chord; the beat
 * goes at the moment the hand has to move somewhere else, and an average across
 * every hit hides exactly that.
 */
export function ChordRhythmDrill({ config }: { config: ChordRhythmConfig }) {
  const [tempo, setTempo] = useState(config.tempos[0] ?? 60);
  const [offBeat, setOffBeat] = useState(config.offBeat);
  const [patternId, setPatternId] = useState(config.patterns?.[0] ?? '');
  const { settings } = useSettings();
  const { book, record, clear } = useScoreBook();

  /** The progression this loop runs — drawn or rotated where a practice asks. */
  const [numerals, setNumerals] = useState<readonly string[]>(config.pool?.[0] ?? config.numerals);
  const [turn, setTurn] = useState(0);

  const active = useMemo(
    () => ({ ...config, numerals, offBeat }),
    [config, numerals, offBeat],
  );
  const slots = useMemo(
    () => slotsOf(active, config.patterns ? patternId : undefined),
    [active, config.patterns, patternId],
  );
  const beats = useMemo(() => beatsInLoop(active), [active]);

  const chords = useMemo(
    () =>
      numerals.flatMap((numeral) => {
        const entry = chordFor(config.key, numeral);
        return entry ? [entry] : [];
      }),
    [config.key, numerals],
  );

  const [index, setIndex] = useState(0);
  const [pressed, setPressed] = useState<readonly number[]>([]);
  const [loops, setLoops] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [timing, setTiming] = useState<TimingTally>(EMPTY_TIMING);
  const [changeTiming, setChangeTiming] = useState<TimingTally>(EMPTY_TIMING);
  const [wrong, setWrong] = useState<string | null>(null);
  const [hand, setHand] = useState<readonly number[]>([]);
  const [moved, setMoved] = useState(0);
  const [cheapest, setCheapest] = useState(0);
  /** Cleared at the start of each loop; set by any miss inside it. */
  const dirty = useRef(false);

  const slot: Slot | undefined = slots[index];
  const chord = slot ? chords[slot.chord] : undefined;

  /** The chord voiced where the hand is, or in root position to begin with. */
  const moves = useMemo(
    () =>
      chord
        ? movesFrom(hand.length > 0 && config.smooth ? hand : voicingOf(chord.form, 0).midis, chord.form)
        : [],
    [chord, config.smooth, hand],
  );
  /** In smooth mode any position is accepted; otherwise root position is asked for. */
  const wanted = useMemo(
    () => (config.smooth ? moves : chord ? [{ inversion: 0 as const, midis: voicingOf(chord.form, 0).midis, distance: 0 }] : []),
    [chord, config.smooth, moves],
  );

  /**
   * The melody over a chord: its own third and fifth, an octave up.
   *
   * Drawn from the chord rather than written out, so it is a line that always
   * fits the harmony and moves when the harmony does. An octave above keeps the
   * two hands visibly apart on the board.
   */
  const melodyNote = useCallback(
    (step: number) => {
      if (!chord) return null;
      const midis = voicingOf(chord.form, 0).midis;
      const at = step === 2 ? FIFTH_AT : THIRD_AT;
      return (midis[at] ?? midis[0] ?? 60) + SEMITONES_PER_OCTAVE;
    },
    [chord],
  );

  const onBeat = useCallback(
    (beat: number) => {
      if (!settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], beat % BEATS_PER_BAR === 0 ? 1.1 : 0.6);
    },
    [settings.soundEnabled],
  );

  const metronome = useMetronome({ bpm: tempo, onBeat });

  /** A tempo change or a new practice restarts the loop. */
  useEffect(() => {
    setIndex(0);
    setPressed([]);
    setHand([]);
    dirty.current = false;
  }, [tempo, offBeat, patternId]);

  /** Picks the progression for the next loop, where a practice varies it. */
  const nextProgression = () => {
    if (config.pool && config.pool.length > 0) {
      const options = config.pool.filter((entry) => entry.join() !== numerals.join());
      const from = options.length > 0 ? options : config.pool;
      setNumerals(from[Math.floor(Math.random() * from.length)] ?? numerals);
      return;
    }
    if (config.rotate) {
      // A progression started from a different chord is the same harmony and a
      // different thing to play, which is exactly what 5.10.2 is drilling.
      const next = turn + 1;
      setTurn(next);
      setNumerals(rotated(config.numerals, next));
    }
  };

  /** What a finished loop does to the streak and, on a ladder, the tempo. */
  const closeLoop = (clean: boolean) => {
    const run = clean ? streak + 1 : 0;
    setStreak(run);
    setBest((current) => Math.max(current, run));
    setLoops((current) => current + 1);
    if (!config.ladder) return;
    const at = config.tempos.indexOf(tempo);
    if (!clean) {
      setTempo(config.tempos[Math.max(0, at - 1)] ?? tempo);
      return;
    }
    if (run >= config.loops) {
      setTempo(config.tempos[Math.min(config.tempos.length - 1, at + 1)] ?? tempo);
      setStreak(0);
    }
  };

  /** Banks how far a press was from its beat, keeping changes apart. */
  const bankTiming = (slotAt: Slot) => {
    if (!metronome.running) return;
    const elapsed = metronome.elapsed();
    if (elapsed === null) return;
    const slotMs = beatMs(tempo);
    // The beat this slot was due on, inside the loop that is running.
    const loopMs = beats * slotMs;
    const intoLoop = elapsed % loopMs;
    const error = intoLoop - slotAt.beat * slotMs;
    // Fold a near-miss across the loop boundary into a small error.
    const folded = error > loopMs / 2 ? error - loopMs : error < -loopMs / 2 ? error + loopMs : error;
    setTiming((current) => recordTiming(current, folded));
    if (slotAt.change) setChangeTiming((current) => recordTiming(current, folded));
    if (Math.abs(folded) > TARGET_MS) dirty.current = true;
    record(
      slotAt.melody ? 'melody note' : slotAt.change ? `change to ${chord?.numeral ?? ''}` : 'repeat',
      Math.abs(folded) <= TARGET_MS,
      Math.abs(folded),
    );
  };

  const step = () => {
    setPressed([]);
    const next = index + 1;
    if (next < slots.length) {
      setIndex(next);
      return;
    }
    closeLoop(!dirty.current);
    dirty.current = false;
    nextProgression();
    setIndex(0);
  };

  const press = (key: PianoKey) => {
    if (!slot || !chord) return;

    if (slot.melody) {
      const note = melodyNote(slot.step);
      if (note === null || key.midi !== note) {
        dirty.current = true;
        setWrong(key.sharpName);
        record('melody note', false, null);
        window.setTimeout(() => setWrong(null), 400);
        return;
      }
      if (settings.soundEnabled) instrument.playMidis([key.midi]);
      bankTiming(slot);
      step();
      return;
    }

    const legal = wanted.some((move) => move.midis.includes(key.midi));
    if (!legal) {
      dirty.current = true;
      setWrong(key.sharpName);
      record(`change to ${chord.numeral}`, false, null);
      window.setTimeout(() => setWrong(null), 400);
      return;
    }
    if (pressed.includes(key.midi)) return;

    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    // The first note of a chord is what the timing is taken from; the rest
    // complete the shape.
    if (pressed.length === 0) bankTiming(slot);
    const next = [...pressed, key.midi];
    setPressed(next);
    setWrong(null);
    if (next.length < chord.form.tones) return;

    const shape = [...next].sort((a, b) => a - b);
    if (config.smooth) {
      const travelled = hand.length > 0 ? travel(hand, shape) : 0;
      setMoved((current) => current + travelled);
      setCheapest((current) => current + (moves[0]?.distance ?? travelled));
    }
    setHand(shape);
    step();
  };

  const restart = () => {
    setIndex(0);
    setPressed([]);
    setLoops(0);
    setStreak(0);
    setBest(0);
    setTiming(EMPTY_TIMING);
    setChangeTiming(EMPTY_TIMING);
    setHand([]);
    setMoved(0);
    setCheapest(0);
    setNumerals(config.pool?.[0] ?? config.numerals);
    setTurn(0);
    dirty.current = false;
    clear();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const rate = onBeatRate(timing);
  const changeRate = onBeatRate(changeTiming);
  const strip = slots.map((entry) => {
    const numeral = chords[entry.chord]?.numeral ?? '?';
    if (entry.melody) return `·${entry.step}`;
    return entry.change ? numeral : '—';
  });

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Tempo" hint={config.ladder ? 'The ladder moves this for you.' : 'Raise it for accuracy, not speed.'}>
            <SegmentedControl
              value={String(tempo)}
              options={config.tempos.map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
              onChange={(value) => setTempo(Number(value))}
              block
              ariaLabel="Tempo"
            />
          </Field>
          {(config.patterns?.length ?? 0) > 1 && (
            <Field label="Pattern" hint="Same chords, different accompaniment.">
              <SegmentedControl
                value={patternId}
                options={(config.patterns ?? []).flatMap((id) => {
                  const entry = strumPattern(id);
                  return entry ? [{ value: entry.id, label: entry.label }] : [];
                })}
                onChange={setPatternId}
                block
                ariaLabel="Strum pattern"
              />
            </Field>
          )}
          {config.hitsPerBar === 2 && (
            <Toggle
              checked={offBeat}
              onChange={setOffBeat}
              label="Strike 2 and 4"
              description="The reference's variation — the same rhythm off the strong beats."
            />
          )}
          <Button
            variant={metronome.running ? 'danger' : 'primary'}
            icon={metronome.running ? 'stop' : 'play'}
            onClick={() => (metronome.running ? metronome.stop() : metronome.start())}
            block
          >
            {metronome.running ? 'Stop the click' : 'Start the click'}
          </Button>
          <Button variant="secondary" icon="reset" onClick={restart} block>
            Start again
          </Button>
          <CounterRow>
            <Counter label="Loops" value={`${loops}`} hint="times through" />
            <Counter label="Clean run" value={`${streak}/${config.loops}`} hint={`best ${best}`} />
          </CounterRow>
          <CounterRow>
            <Counter
              label="On the beat"
              value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
              hint={timingBias(timing)}
            />
            <Counter
              label="On the change"
              value={changeRate === null ? '—' : `${Math.round(changeRate * 100)}%`}
              hint={
                changeRate === null || rate === null
                  ? 'chord changes alone'
                  : changeRate >= rate
                    ? 'changes as steady as repeats'
                    : 'the beat goes where the chord changes'
              }
            />
          </CounterRow>
          {config.smooth && (
            <CounterRow>
              <Counter label="Your movement" value={`${moved}`} hint="semitones travelled" />
              <Counter
                label="Shortest"
                value={`${cheapest}`}
                hint={moved <= cheapest ? 'you took it every time' : `${moved - cheapest} further than needed`}
              />
            </CounterRow>
          )}
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — play a loop." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${config.key} major · ${numerals.join(' – ')}`,
          `${tempo} BPM`,
          config.patterns ? (strumPattern(patternId)?.hint ?? null) : null,
          slot?.melody ? 'melody' : slot?.change ? 'change here' : 'hold it',
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {!metronome.running && <Chip>Start the click — this practice is about when, not what</Chip>}
            {metronome.running && wrong !== null && <Chip tone="danger">{wrong} is not it</Chip>}
            {metronome.running && wrong === null && (
              <Chip tone={slot?.change ? 'accent' : 'neutral'}>
                beat {(slot?.beat ?? 0) + 1} of {beats}
                {slot?.melody ? ` · melody note ${slot.step}` : ''}
              </Chip>
            )}
          </>
        }
      >
        {slot?.melody ? '♪' : (chord?.numeral ?? '?')}
      </DrillPrompt>

      <StepStrip items={strip} index={index} wrong={wrong !== null} label="The loop" />

      <div className={styles.tones}>
        {chords.map((entry, at) => (
          <span
            key={entry.form.id}
            className={cn(styles.tone, at === slot?.chord && styles.toneThird)}
          >
            {entry.form.symbol}
            <span className={styles.toneDegree}>{entry.numeral}</span>
          </span>
        ))}
      </div>

      <div className={styles.board}>
        <Cover
          covered={config.blind === true && metronome.running}
          note="Covered — find the chords by touch"
        >
          <ChordKeyboard
            layoutId={LAYOUT_ID}
            lit={slot?.melody ? [melodyNote(slot.step) ?? 60] : hand}
            done={pressed}
            showNames
            onKeyPress={press}
            footerNote={
              slot?.melody
                ? 'One note, on the beat'
                : config.smooth
                  ? 'Any position — the closest one costs least'
                  : 'Strike the chord on the beat'
            }
          />
        </Cover>
      </div>

      <p className={styles.note}>
        The click decides when the chord changes. Timing on a change is scored apart from timing on a
        repeat, because that is where the beat actually goes.
      </p>
    </DrillShell>
  );
}
