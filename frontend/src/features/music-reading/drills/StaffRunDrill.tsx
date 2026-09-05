import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PianoKey } from '@/features/piano';
import {
  BeatLamps,
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  GuidedNote,
  GuidedSound,
  LEAD_IN_BEATS,
  PlayWhere,
  RunCounters,
  StepStrip,
  TimerBar,
  WeakSpots,
  beatMs,
  onBeatRate,
  recordTiming,
  timingBias,
  useAnswerDeadline,
  useGuidedRun,
  useMetronome,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import type { GuidedTick, PlaySurface, TimingTally } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import type { Clef, Step } from '../reading.types';
import { clefName, noteAt } from '../data/staff';
import { altersLetter, signatureOf, signatureSteps } from '../data/keySignatures';
import type { Contour, NoteValue, StaffRunConfig } from '../data/runDrills';
import { CONTOUR_NAME, VALUE_BEATS, allowanceAt, beatsOf, runSteps } from '../data/runDrills';
import { StaffSystem } from '../components/StaffSystem';
import type { StaffMark } from '../components/Staff';
import { ReadingKeyboard } from '../components/ReadingKeyboard';
import styles from '../components/reading.module.css';

const LAYOUT_ID = '49';
const CLICK_MIDI = 84;
/** A note reached more slowly than this was worked out rather than read. */
const TARGET_MS = 1500;

/**
 * A run of notes read left to right — 6.2, 6.3, 6.9 and most of 6.10.
 *
 * One engine because all of those are the same act with different amounts to
 * take in: one note or eight, stepping or leaping, one staff or two, with a key
 * signature in force or without, against a click or in your own time. Splitting
 * them would have meant several drills drawing the same staff and disagreeing
 * about it.
 *
 * **Every note is scored where it sits**, not the run as a whole. A run that
 * stalls on one note is a note problem, and a drill that reported "eleven
 * seconds" would hide which one — so the panel names the note rather than the
 * run. When a signature is in force the note is scored under the key too, since
 * forgetting to apply it is a different fault from misreading the position.
 */
export function StaffRunDrill({ config }: { config: StaffRunConfig }) {
  const [showNames, setShowNames] = useState(false);
  const [clef, setClef] = useState<Clef>(config.clef);
  const [tempo, setTempo] = useState(config.tempos[0] ?? 60);
  const { settings } = useSettings();
  const { book, record, clear } = useScoreBook();

  /** Seeded from the app-wide preference; overridable for this one practice. */
  const [surface, setSurface] = useState<PlaySurface>(
    settings.externalKeyboard ? 'external' : 'screen',
  );
  useEffect(() => {
    setSurface(settings.externalKeyboard ? 'external' : 'screen');
  }, [settings.externalKeyboard]);
  const guiding = surface === 'external';
  /** Sound each note as it falls due, so a read can be checked by ear. */
  const [guideNotes, setGuideNotes] = useState(false);

  const [start, setStart] = useState<Step>(config.starts[0] ?? 0);
  const [contour, setContour] = useState<Contour>(config.contours[0] ?? 'up');
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [missed, setMissed] = useState<readonly number[]>([]);
  const [runs, setRuns] = useState(0);
  const [right, setRight] = useState(0);
  const [timing, setTiming] = useState<TimingTally>(EMPTY_TIMING);
  const stepAt = useRef<number | null>(null);
  const closing = useRef(false);

  const steps = useMemo(() => runSteps(config, start, contour), [config, contour, start]);
  /** Which note length each position carries, cycling through the values. */
  const values = useMemo<readonly NoteValue[]>(
    () => steps.map((_entry, at) => config.values[at % config.values.length] ?? 'quarter'),
    [config.values, steps],
  );
  const dueAt = useMemo(() => beatsOf(values), [values]);

  /** What the signature does to a letter, if one is in force. */
  const shiftFor = useCallback(
    (letter: string) => {
      if (!config.key) return 0;
      const signature = signatureOf(config.key);
      if (!signature || !altersLetter(config.key, letter)) return 0;
      return signature.kind === 'sharp' ? 1 : -1;
    },
    [config.key],
  );

  const upper = useMemo(() => steps.map((step) => noteAt(clef, step)), [clef, steps]);
  /** The lower staff's notes, when a practice reads two at once. */
  const lower = useMemo(
    () => (config.second ? steps.map((step) => noteAt(config.second!, step)) : []),
    [config.second, steps],
  );

  /** The keys each position asks for — one, or one per staff. */
  const wantedAt = useCallback(
    (at: number): readonly number[] => {
      const top = upper[at];
      if (!top) return [];
      const keys = [top.midi + shiftFor(top.letter)];
      const bottom = lower[at];
      if (bottom) keys.push(bottom.midi + shiftFor(bottom.letter));
      return keys;
    },
    [lower, shiftFor, upper],
  );

  const [pressed, setPressed] = useState<readonly number[]>([]);
  /** A guided read loops, so nothing is ever complete while it runs. */
  const complete = !guiding && index >= steps.length;

  const deal = useCallback(() => {
    setStart((current) => {
      const options = config.starts.filter((entry) => entry !== current);
      const from = options.length > 0 ? options : config.starts;
      return from[Math.floor(Math.random() * from.length)] ?? current;
    });
    setContour((current) => {
      const options = config.contours.filter((entry) => entry !== current);
      const from = options.length > 0 ? options : config.contours;
      return from[Math.floor(Math.random() * from.length)] ?? current;
    });
    // Alternating clefs is how 6.9.7 keeps both hands in play.
    if (config.id === 'sight-hands-separately') {
      setClef((current) => (current === 'treble' ? 'bass' : 'treble'));
    }
    setIndex(0);
    setPressed([]);
    setWrong(null);
    setMissed([]);
    stepAt.current = null;
    closing.current = false;
  }, [config.contours, config.id, config.starts]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow]);

  const close = useCallback(
    (expired: boolean) => {
      if (closing.current) return;
      closing.current = true;
      setRuns((current) => current + 1);
      if (expired) stumble();
      finish();
    },
    [finish, stumble],
  );

  const allowance = allowanceAt(config, runs);
  const deadline = useAnswerDeadline({
    // Away from the screen there is no press to be late, so no allowance either.
    ms: config.metronome || guiding ? 0 : allowance,
    active: !complete,
    resetKey: `${start}:${contour}:${runs}`,
    onExpire: () => close(true),
  });

  const onBeat = useCallback(
    (beat: number) => {
      if (!config.metronome || !settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], beat % 4 === 0 ? 1.1 : 0.6);
    },
    [config.metronome, settings.soundEnabled],
  );
  const metronome = useMetronome({ bpm: tempo, onBeat });

  /** Moves past a note, whether it was played or missed. */
  const advance = (played: boolean) => {
    if (!played) setMissed((current) => [...current, index]);
    setPressed([]);
    const next = index + 1;
    setIndex(next);
    if (next >= steps.length) close(false);
  };

  const press = (key: PianoKey) => {
    if (guiding) return;
    if (complete) return;
    const wanted = wantedAt(index);
    const note = upper[index];
    if (wanted.length === 0 || !note) return;

    /** Filed by note, and by key too when a signature is doing the work. */
    const label = config.key
      ? `${config.key} — ${note.letter}${shiftFor(note.letter) > 0 ? '#' : shiftFor(note.letter) < 0 ? 'b' : ''}`
      : `${clefName(clef)} ${note.name}`;

    if (!wanted.includes(key.midi)) {
      stumble();
      record(label, false, null);
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 400);
      // No-stopping practices move on regardless, which is the point of them.
      if (config.noStopping) advance(false);
      return;
    }
    if (pressed.includes(key.midi)) return;

    const now = performance.now();
    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);

    const next = [...pressed, key.midi];
    setPressed(next);
    if (next.length < wanted.length) return;

    // The position is complete: bank its time, and its beat if a click is running.
    record(label, true, stepAt.current === null ? null : now - stepAt.current);
    stepAt.current = now;
    setRight((current) => current + 1);

    if (config.metronome && metronome.running) {
      const elapsed = metronome.elapsed();
      if (elapsed !== null) {
        const slot = beatMs(tempo);
        const due = (dueAt[index] ?? 0) * slot;
        const bar = (dueAt[dueAt.length - 1] ?? 0) * slot + VALUE_BEATS[values[index] ?? 'quarter'] * slot;
        const into = bar > 0 ? elapsed % bar : elapsed;
        const error = into - due;
        const folded = error > bar / 2 ? error - bar : error < -bar / 2 ? error + bar : error;
        setTiming((current) => recordTiming(current, folded));
      }
    }

    advance(true);
  };

  const restart = () => {
    setRuns(0);
    setRight(0);
    setTiming(EMPTY_TIMING);
    clear();
    dealNow();
  };

  /**
   * The run laid out as even slots, fine enough for its shortest note value.
   *
   * A read is the case this matters most for: half and whole notes are exactly
   * what a beginner rushes, and a cue that holds for the right number of clicks
   * teaches the value in a way a note-per-click cue cannot.
   */
  const resolution = useMemo(() => {
    const shortest = values.reduce(
      (least, value) => Math.min(least, VALUE_BEATS[value] ?? 1),
      1,
    );
    return shortest >= 1 ? 1 : Math.min(4, Math.round(1 / shortest));
  }, [values]);

  const slotsPerPass = Math.max(
    1,
    Math.round(values.reduce((sum, value) => sum + (VALUE_BEATS[value] ?? 1), 0) * resolution),
  );

  /** Which note each slot belongs to, so a long note keeps its cue. */
  const slotOwner = useMemo(() => {
    const owners = new Array<number>(slotsPerPass).fill(0);
    values.forEach((value, at) => {
      const from = Math.round((dueAt[at] ?? 0) * resolution);
      const span = Math.max(1, Math.round((VALUE_BEATS[value] ?? 1) * resolution));
      for (let slot = from; slot < from + span && slot < owners.length; slot += 1) owners[slot] = at;
    });
    return owners;
  }, [dueAt, resolution, slotsPerPass, values]);

  /** The cue the guide last sounded, so a held note is not struck twice. */
  const sounded = useRef(-1);

  const handleTick = ({ counting, index: at, onBeat: onClick, accented }: GuidedTick) => {
    if (settings.soundEnabled) {
      instrument.playMidis([CLICK_MIDI], onClick ? (accented ? 1.1 : 0.6) : 0.25);
    }
    if (counting) {
      sounded.current = -1;
      return;
    }
    if (at === sounded.current) return;
    sounded.current = at;
    if (guideNotes && settings.soundEnabled) instrument.playMidis(wantedAt(at), 0.85);
  };

  const guided = useGuidedRun({
    length: slotsPerPass,
    cueForSlot: (slot) => slotOwner[slot] ?? 0,
    bpm: tempo,
    subdivision: resolution,
    onTick: handleTick,
    // A new run can only arrive between passes, never mid-phrase.
    onCycle: () => deal(),
  });

  /** Which note the screen is on: the beat's in guided mode, the press's on screen. */
  const cue = guiding ? guided.index : index;

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const rate = onBeatRate(timing);

  /*
   * The staff is the cue in guided mode: it marks the note that is due, which
   * is what makes reading away from the screen possible at all.
   */
  const marksFor = (notes: readonly { step: Step; letter: string }[]): readonly StaffMark[] =>
    notes.map((note, at) => ({
      step: note.step,
      hollow: values[at] !== 'quarter',
      tone: missed.includes(at)
        ? 'danger'
        : at < cue
          ? 'success'
          : at === cue && !complete
            ? 'accent'
            : 'muted',
      label: at < cue || showNames ? note.letter : undefined,
    }));

  const signature = useMemo(() => {
    if (!config.key) return [];
    const kind = signatureOf(config.key)?.kind;
    if (!kind) return [];
    return signatureSteps(config.key, clef).map((step) => ({ step, accidental: kind }));
  }, [clef, config.key]);

  const staves = [
    { clef, marks: marksFor(upper) },
    ...(config.second ? [{ clef: config.second, marks: marksFor(lower) }] : []),
  ];

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          <PlayWhere
            value={surface}
            onChange={setSurface}
            hint="On my keyboard counts you in and moves the cue along the staff."
          />
          {config.id === 'sight-hands-separately' && (
            <Field label="Staff" hint="Alternates on its own; this forces one.">
              <SegmentedControl
                value={clef}
                options={[
                  { value: 'treble', label: 'Treble' },
                  { value: 'bass', label: 'Bass' },
                ]}
                onChange={(value) => setClef(value as Clef)}
                block
                ariaLabel="Staff"
              />
            </Field>
          )}
          {(config.metronome || guiding) && (
            <Field
              label="Tempo"
              hint={
                guiding
                  ? 'The staff moves at this speed.'
                  : 'One note per beat, and it does not wait.'
              }
            >
              <SegmentedControl
                value={String(tempo)}
                options={config.tempos.map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
                onChange={(value) => setTempo(Number(value))}
                block
                ariaLabel="Tempo"
              />
            </Field>
          )}
          {guiding ? (
            <>
              {/* One transport: the click and the read are the same run here. */}
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
                description="Hear each note as it falls due, to check your reading against."
              />
            </>
          ) : (
            config.metronome && (
              <Button
                variant={metronome.running ? 'danger' : 'primary'}
                icon={metronome.running ? 'stop' : 'play'}
                onClick={() => (metronome.running ? metronome.stop() : metronome.start())}
                block
              >
                {metronome.running ? 'Stop the click' : 'Start the click'}
              </Button>
            )
          )}
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Letters under the notes"
            description="Support while a run is unfamiliar. Off is the drill."
          />
          {guiding ? (
            <>
              <GuidedNote>
                Nothing can be measured from here — the click holds the tempo and the staff keeps
                your place. Whether you read it right is between you and your ears.
              </GuidedNote>
              <CounterRow>
                <Counter label="Passes" value={String(guided.cycles)} hint="runs read through" />
                <Counter label="Tempo" value={`${tempo}`} hint="BPM" />
              </CounterRow>
            </>
          ) : (
            <>
              <Button variant="secondary" icon="reset" onClick={dealNow} block>
                New run
              </Button>
              <Button variant="secondary" icon="reset" onClick={restart} block>
                Start again
              </Button>
              <RunCounters stats={stats} runsLabel="Runs" />
              <CounterRow>
                <Counter label="Notes right" value={`${right}`} hint="across the session" />
                <Counter
                  label={config.metronome ? 'On the beat' : 'Allowance'}
                  value={
                    config.metronome
                      ? rate === null
                        ? '—'
                        : `${Math.round(rate * 100)}%`
                      : allowance === 0
                        ? '—'
                        : `${(allowance / 1000).toFixed(0)}s`
                  }
                  hint={config.metronome ? timingBias(timing) : 'for the whole run'}
                />
              </CounterRow>
              <WeakSpots
                spots={spots}
                emptyNote="Nothing weak yet — read a few runs."
                onClear={clear}
              />
            </>
          )}
        </>
      }
    >
      <DrillPrompt
        label={[
          config.second ? 'both staves' : `${clefName(clef)} clef`,
          CONTOUR_NAME[contour],
          config.key ? `${config.key} major` : null,
          complete ? 'run complete' : `note ${cue + 1} of ${steps.length}`,
          guiding ? `${tempo} BPM · on your keyboard` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          guiding ? (
            <>
              {guided.phase === 'idle' && <Chip>Read the shape, then press start</Chip>}
              {guided.phase === 'counting' && <Chip tone="next">Count in — {guided.countIn}</Chip>}
              {guided.phase === 'playing' && <Chip>{values[cue] ?? 'quarter'} note</Chip>}
            </>
          ) : (
          <>
            {complete && (
              <Chip tone={missed.length === 0 ? 'accent' : 'neutral'}>
                {missed.length === 0 ? 'Clean run' : `${missed.length} missed`}
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && wrong !== null && (
              <Chip tone="danger">{config.noStopping ? 'Missed — carry on' : 'Not that one'}</Chip>
            )}
            {!complete && wrong === null && (
              <Chip>
                {config.second && pressed.length === 1
                  ? 'One more — the other staff'
                  : index === 0
                    ? 'Read the shape, then start'
                    : `${values[index] ?? 'quarter'} note`}
              </Chip>
            )}
          </>
          )
        }
      >
        {/* The count-in owns the prompt: it is the one thing read from the bench. */}
        {guiding && guided.phase === 'counting'
          ? guided.countIn
          : guiding && guided.phase === 'idle'
            ? '·'
            : complete
              ? '✓'
              : (upper[cue]?.name ?? '?')}
      </DrillPrompt>

      {guiding && <BeatLamps beat={guided.beatInBar} />}

      <StaffSystem staves={staves} signature={signature} label="the run" />

      {config.values.length > 1 && (
        <StepStrip
          items={values.map((value) => `${VALUE_BEATS[value]}`)}
          index={complete ? -1 : cue}
          showProgress={!guiding || guided.phase !== 'idle'}
          label="Beats per note"
        />
      )}

      {allowance > 0 && !config.metronome && !complete && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="This run" />
      )}

      <div className={styles.board}>
        <ReadingKeyboard
          layoutId={LAYOUT_ID}
          secondary={wrong === null ? undefined : [wrong]}
          showNames={showNames}
          onKeyPress={guiding ? undefined : press}
          footerNote={
            guiding
              ? 'Read the staff and play it on your own keyboard'
              : config.second
                ? 'Both notes, in either order'
                : 'Play the run left to right'
          }
        />
      </div>

      <p className={styles.note}>
        A run is a shape before it is a list of notes. Reading all of them from scratch is what makes
        sight reading slow.
      </p>
    </DrillShell>
  );
}
