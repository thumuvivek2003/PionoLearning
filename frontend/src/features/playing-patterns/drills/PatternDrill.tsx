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
  WeakSpots,
  beatMs,
  evenness,
  onBeatRate,
  percent,
  recordTiming,
  timingBias,
  useGuidedRun,
  useMetronome,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import type { GuidedTick, PlaySurface, TimingTally } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { cn } from '@/lib/cn';
import type { Hand, Quality } from '../patterns.types';
import { buildEvents, buildFigure } from '../data/figures';
import type { PatternConfig } from '../data/patternDrills';
import { PatternKeyboard } from '../components/PatternKeyboard';
import styles from '../components/patterns.module.css';

const LAYOUT_ID = '49';
const CLICK_MIDI = 84;
const BEATS_PER_BAR = 4;
/** A note reached more slowly than this was found rather than played. */
const TARGET_MS = 900;

/**
 * Level 7's figures under the hands — melodies, broken chords and arpeggios.
 *
 * One engine for three buckets because they are one act: an ordered line of
 * notes, played with a printed fingering, in time. A melody comes from a scale
 * and a broken chord from a triad, but by the time the figure reaches here they
 * are the same thing, so the measurements can be too.
 *
 * **The turn is timed apart from everything else.** Every figure in this level
 * has one genuinely hard moment — the note after a broken chord reaches its
 * top, the note after an arpeggio touches the octave, the join from the end of
 * a loop back to its start — and an average across the whole figure hides it
 * completely. A figure can be right in every note and still lurch in exactly
 * one place, which is what makes it sound like an exercise rather than music.
 */
export function PatternDrill({ config }: { config: PatternConfig }) {
  const [hand, setHand] = useState<Hand>(config.hands[0] ?? 'right');
  const [quality, setQuality] = useState<Quality>(config.qualities[0] ?? 'major');
  const [tempo, setTempo] = useState(config.tempos[0] ?? 60);
  const [showCues, setShowCues] = useState(config.cues);
  const [showNames, setShowNames] = useState(false);
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
  /** Sound each note as it falls due, so a figure can be checked by ear. */
  const [guideNotes, setGuideNotes] = useState(false);

  const [root, setRoot] = useState(config.roots[0] ?? 'C');
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [loops, setLoops] = useState(0);
  const [clean, setClean] = useState(0);
  const [best, setBest] = useState(0);
  const [gaps, setGaps] = useState<readonly number[]>([]);
  const [turnGaps, setTurnGaps] = useState<readonly number[]>([]);
  const [lastEven, setLastEven] = useState<number | null>(null);
  const [timing, setTiming] = useState<TimingTally>(EMPTY_TIMING);
  const stepAt = useRef<number | null>(null);
  const dirty = useRef(false);

  const figure = useMemo(
    () => buildFigure(config.source, root, quality, hand, config.values),
    [config.source, config.values, hand, quality, root],
  );
  /** The other hand's figure, for the practices that use both. */
  const other = useMemo(
    () =>
      config.left
        ? buildFigure(config.left, root, quality, hand === 'right' ? 'left' : 'right', config.values)
        : null,
    [config.left, config.values, hand, quality, root],
  );
  /** Both figures merged onto one clock, so the hands land together by beat. */
  const notes = useMemo(
    () => (hand === 'right' ? buildEvents(figure, other) : buildEvents(other, figure)),
    [figure, hand, other],
  );
  const dueAt = useMemo(() => notes.map((event) => event.beat), [notes]);
  const barBeats = useMemo(
    () => notes.reduce((sum, event) => sum + (event.right?.beats ?? event.left?.beats ?? 1), 0),
    [notes],
  );

  /**
   * The join from the last note back to the first.
   *
   * A looping figure has a turn there too — often the hardest one — and it
   * would be invisible if only the turns inside the figure were counted.
   */
  const isTurn = useCallback(
    (at: number) => (notes[at]?.turn ?? false) || at === 0,
    [notes],
  );

  /** Which keys the current moment is still waiting for. */
  const [pressed, setPressed] = useState<readonly number[]>([]);

  const onBeat = useCallback(
    (beat: number) => {
      if (!config.metronome || !settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], beat % BEATS_PER_BAR === 0 ? 1.1 : 0.6);
    },
    [config.metronome, settings.soundEnabled],
  );
  const metronome = useMetronome({ bpm: tempo, onBeat });

  const deal = useCallback(() => {
    setRoot((current) => {
      const options = config.roots.filter((entry) => entry !== current);
      const from = options.length > 0 ? options : config.roots;
      return from[Math.floor(Math.random() * from.length)] ?? current;
    });
    if (config.qualities.length > 1) {
      setQuality((current) => (current === 'major' ? 'minor' : 'major'));
    }
    setIndex(0);
    setPlayed([]);
    setPressed([]);
    setWrong(null);
    setGaps([]);
    stepAt.current = null;
    dirty.current = false;
  }, [config.qualities.length, config.roots]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, hand, tempo]);

  /** What a finished loop does to the streak and, on a ladder, the tempo. */
  const closeLoop = (wasClean: boolean) => {
    const streak = wasClean ? clean + 1 : 0;
    setClean(streak >= config.loops ? 0 : streak);
    setBest((current) => Math.max(current, streak));
    setLoops((current) => current + 1);
    setLastEven(evenness(gaps));
    if (!config.ladder) return;
    const at = config.tempos.indexOf(tempo);
    if (!wasClean) {
      setTempo(config.tempos[Math.max(0, at - 1)] ?? tempo);
      return;
    }
    if (streak >= config.loops) setTempo(config.tempos[Math.min(config.tempos.length - 1, at + 1)] ?? tempo);
  };

  /** How a moment reads in the ledger — the notes and the finger taking them. */
  const labelOf = (event: (typeof notes)[number]) => {
    const parts = [event.right, event.left].filter(Boolean);
    return parts.map((note) => `${note!.name} (finger ${note!.finger})`).join(' + ');
  };

  const press = (key: PianoKey) => {
    if (guiding) return;
    const wanted = notes[index];
    if (!wanted) return;

    if (!wanted.midis.includes(key.midi)) {
      dirty.current = true;
      stumble();
      record(labelOf(wanted), false, null);
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 400);
      return;
    }
    if (pressed.includes(key.midi)) return;

    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    setPlayed((current) => [...current, key.midi]);
    const holding = [...pressed, key.midi];
    setPressed(holding);
    // A moment with several keys is not complete until all of them are down.
    if (holding.length < wanted.midis.length) return;
    setPressed([]);

    const now = performance.now();
    begin();

    // Gaps into a turn are banked apart from the rest, which is the diagnosis.
    const previous = stepAt.current;
    if (previous !== null) {
      const gap = now - previous;
      if (isTurn(index)) setTurnGaps((current) => [...current, gap]);
      else setGaps((current) => [...current, gap]);
    }
    record(labelOf(wanted), true, previous === null ? null : now - previous);
    stepAt.current = now;

    if (config.metronome && metronome.running && barBeats > 0) {
      const elapsed = metronome.elapsed();
      if (elapsed !== null) {
        const slot = beatMs(tempo);
        const loopMs = barBeats * slot;
        const into = elapsed % loopMs;
        const error = into - (dueAt[index] ?? 0) * slot;
        const folded = error > loopMs / 2 ? error - loopMs : error < -loopMs / 2 ? error + loopMs : error;
        setTiming((current) => recordTiming(current, folded));
      }
    }

    const next = index + 1;
    if (next < notes.length) {
      setIndex(next);
      return;
    }
    // The loop is complete: a continuous figure starts again without a gap.
    closeLoop(!dirty.current);
    dirty.current = false;
    setPlayed([]);
    setIndex(0);
    if (config.roots.length > 1 || config.qualities.length > 1) finish();
  };

  /**
   * A figure of mixed note values, laid out as even slots.
   *
   * The click has to be fine enough to land on the shortest note in the figure,
   * so the whole loop is measured in that unit and each note simply owns as
   * many slots as it lasts. A half note holds its cue for two, a whole note for
   * four, and the click carries on underneath — which is what reading a figure
   * in time actually feels like.
   */
  const resolution = useMemo(() => {
    const shortest = notes.reduce(
      (least, event) => Math.min(least, event.right?.beats ?? event.left?.beats ?? 1),
      1,
    );
    return shortest >= 1 ? 1 : Math.min(4, Math.round(1 / shortest));
  }, [notes]);

  const slotsPerPass = Math.max(1, Math.round(barBeats * resolution));

  /** Which note each slot of a pass belongs to, so a held note keeps its cue. */
  const slotOwner = useMemo(() => {
    const owners = new Array<number>(slotsPerPass).fill(0);
    notes.forEach((event, at) => {
      const from = Math.round((dueAt[at] ?? 0) * resolution);
      const span = Math.max(1, Math.round((event.right?.beats ?? event.left?.beats ?? 1) * resolution));
      for (let slot = from; slot < from + span && slot < owners.length; slot += 1) owners[slot] = at;
    });
    return owners;
  }, [dueAt, notes, resolution, slotsPerPass]);

  /** The cue the guide last sounded, so a held note is not struck twice. */
  const sounded = useRef(-1);

  const handleTick = ({ counting, index: cue, onBeat: onClick, accented }: GuidedTick) => {
    if (settings.soundEnabled) {
      instrument.playMidis([CLICK_MIDI], onClick ? (accented ? 1.1 : 0.6) : 0.25);
    }
    if (counting) {
      sounded.current = -1;
      return;
    }
    if (cue === sounded.current) return;
    sounded.current = cue;
    const midis = notes[cue]?.midis;
    if (guideNotes && settings.soundEnabled && midis) instrument.playMidis(midis, 0.85);
  };

  const guided = useGuidedRun({
    length: slotsPerPass,
    cueForSlot: (slot) => slotOwner[slot] ?? 0,
    bpm: tempo,
    subdivision: resolution,
    onTick: handleTick,
    // A pass boundary is the only place a new root or quality can arrive
    // without cutting a figure in half.
    onCycle: () => {
      if (config.roots.length > 1 || config.qualities.length > 1) deal();
    },
  });

  /** Which note the screen is on: the beat's in guided mode, the press's on screen. */
  const cue = guiding ? guided.index : index;

  const restart = () => {
    setLoops(0);
    setClean(0);
    setBest(0);
    setGaps([]);
    setTurnGaps([]);
    setLastEven(null);
    setTiming(EMPTY_TIMING);
    clear();
    dealNow();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const mean = (values: readonly number[]) =>
    values.length === 0 ? null : values.reduce((sum, gap) => sum + gap, 0) / values.length;
  const meanGap = mean(gaps);
  const meanTurn = mean(turnGaps);
  /**
   * The turn measured against the notes around it.
   *
   * An even figure takes the same time into its turn as into anything else, so
   * anything far above 1.0 is the lurch made visible.
   */
  const lurch = meanTurn !== null && meanGap !== null && meanGap > 0 ? meanTurn / meanGap : null;
  const rate = onBeatRate(timing);

  const strip = notes.map((event, at) => {
    const note = event.right ?? event.left;
    if (at < cue) return note?.name ?? '·';
    return showCues ? String(note?.finger ?? '·') : '·';
  });

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
            hint="On my keyboard counts you in and moves the cue on the beat."
          />
          {config.hands.length > 1 && (
            <Field label="Hand" hint="The numbering is the same; the order reverses.">
              <SegmentedControl
                value={hand}
                options={[
                  { value: 'right', label: 'Right' },
                  { value: 'left', label: 'Left' },
                ]}
                onChange={(value) => setHand(value as Hand)}
                block
                ariaLabel="Hand"
              />
            </Field>
          )}
          {(config.metronome || guiding) && (
            <Field
              label="Tempo"
              hint={
                guiding
                  ? 'The figure moves at this speed.'
                  : config.ladder
                    ? 'The ladder moves this for you.'
                    : 'Raise it for accuracy.'
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
              {/* One transport: the click and the figure are the same run here. */}
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
                description="Hear each note as it falls due, to check yourself against. Off is the drill."
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
            checked={showCues}
            onChange={setShowCues}
            label="Show the fingering"
            description="Off is the drill — the figure has to come from the hand."
          />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New figure
          </Button>
          <Button variant="secondary" icon="reset" onClick={restart} block>
            Start again
          </Button>
          {guiding ? (
            <>
              <GuidedNote />
              <CounterRow>
                <Counter
                  label="Passes"
                  value={String(guided.cycles)}
                  hint="times round the figure"
                />
                <Counter
                  label="Clean loops"
                  value={`${clean}/${config.loops}`}
                  hint={config.ladder ? 'a full set moves the tempo up' : 'in a row, by your own ear'}
                />
              </CounterRow>
              {/*
                * The ladder is the part worth keeping away from the screen —
                * parking at the fastest tempo you can actually play is the whole
                * method. Nothing here can judge the loop, so you do.
                */}
              <Button
                variant="success"
                icon="check"
                size="sm"
                onClick={() => closeLoop(true)}
                block
              >
                That loop was clean
              </Button>
              <Button variant="ghost" icon="x" size="sm" onClick={() => closeLoop(false)} block>
                I stumbled
              </Button>
            </>
          ) : (
            <>
              <RunCounters stats={stats} runsLabel="Figures" />
              <CounterRow>
                <Counter
                  label="Loops"
                  value={`${loops}`}
                  hint={`clean run ${clean}/${config.loops}, best ${best}`}
                />
                <Counter label="Evenness" value={percent(lastEven)} hint="between the notes" />
              </CounterRow>
              <CounterRow>
                <Counter
                  label="The turn"
                  value={lurch === null ? '—' : `${lurch.toFixed(2)}×`}
                  hint={
                    lurch === null
                      ? 'against the other notes'
                      : lurch <= 1.15
                        ? 'no lurch worth hearing'
                        : 'the figure hesitates where it turns'
                  }
                />
                {config.metronome && (
                  <Counter
                    label="On the beat"
                    value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
                    hint={timingBias(timing)}
                  />
                )}
              </CounterRow>
              <WeakSpots spots={spots} emptyNote="Nothing weak yet — play a loop." onClear={clear} />
            </>
          )}
        </>
      }
    >
      <DrillPrompt
        label={[
          `${root} ${quality}`,
          figure?.line ?? '',
          config.hands.length > 1 ? (hand === 'right' ? 'RH' : 'LH') : null,
          config.metronome || guiding ? `${tempo} BPM` : null,
          guiding ? 'on your keyboard' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          guiding ? (
            <>
              {guided.phase === 'idle' && <Chip>Hands ready, then press start</Chip>}
              {guided.phase === 'counting' && <Chip tone="next">Count in — {guided.countIn}</Chip>}
              {guided.phase === 'playing' && (
                <Chip tone={isTurn(cue) && cue > 0 ? 'accent' : 'neutral'}>
                  {isTurn(cue) && cue > 0
                    ? 'The turn — this is the one that lurches'
                    : `note ${cue + 1} of ${notes.length}`}
                </Chip>
              )}
            </>
          ) : (
            <>
              {wrong !== null && <Chip tone="danger">Not that one — check the finger</Chip>}
              {wrong === null && (
                <Chip tone={isTurn(index) && index > 0 ? 'accent' : 'neutral'}>
                  {isTurn(index) && index > 0
                    ? 'The turn — this is the one that lurches'
                    : `note ${index + 1} of ${notes.length}`}
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
            : showCues
              ? ((notes[cue]?.right ?? notes[cue]?.left)?.finger ?? '·')
              : ((notes[cue]?.right ?? notes[cue]?.left)?.degree ?? '·')}
      </DrillPrompt>

      {guiding && <BeatLamps beat={guided.beatInBar} />}

      <div className={styles.tones}>
        {notes.map((event, at) => {
          const note = event.right ?? event.left;
          return (
            <span
              key={`${event.beat}-${at}`}
              className={cn(styles.tone, event.turn && styles.toneThird)}
            >
              {at < cue ? (note?.name ?? '·') : showCues ? String(note?.finger ?? '·') : '·'}
              <span className={styles.toneDegree}>
                {config.left && event.right && event.left ? 'both' : `${note?.beats ?? 1}b`}
              </span>
            </span>
          );
        })}
      </div>

      <StepStrip
        items={strip}
        index={cue}
        wrong={wrong !== null}
        showProgress={!guiding || guided.phase !== 'idle'}
        label="The figure"
      />

      <div className={styles.board}>
        {/*
          * Away from the screen the board stops being an input and becomes the
          * part you read from, so this is the one mode where it lights the note
          * that is due rather than only the ones already played.
          */}
        <PatternKeyboard
          layoutId={LAYOUT_ID}
          lit={guiding && guided.phase === 'playing' ? (notes[cue]?.midis ?? []) : undefined}
          done={guiding ? [] : played}
          secondary={wrong === null ? undefined : [wrong]}
          showNames={showNames}
          onKeyPress={guiding ? undefined : press}
          footerNote={
            guiding
              ? 'Play this on your own keyboard — the figure moves on the beat'
              : config.left
                ? 'Both hands — every key of the moment before the next one'
                : 'Play the figure in order, with the fingering shown'
          }
        />
      </div>

      <p className={styles.note}>
        Every figure here has one hard moment — where it turns round. That gap is timed on its own,
        because an average across the whole figure would hide it.
      </p>
    </DrillShell>
  );
}
