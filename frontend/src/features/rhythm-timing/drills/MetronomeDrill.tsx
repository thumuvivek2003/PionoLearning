import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl } from '@/components/ui';
import { getKeyboardLayout, whiteStep } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  ON_BEAT_MS,
  WeakSpots,
  beatMs,
  formatMs,
  meanTiming,
  onBeatRate,
  recordTiming,
  timingBias,
  timingNote,
  useMetronome,
  useScoreBook,
  weakSpots,
} from '@/features/practice-kit';
import type { TimingTally } from '@/features/practice-kit';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { countLabel } from '../data/noteValues';
import { LINES, LINE_LABELS } from '../data/metronomeDrills';
import type { LineId, MetronomeDrillConfig } from '../data/metronomeDrills';
import { BeatBar } from '../components/BeatBar';
import { Keyboard } from '../components/Keyboard';
import styles from '../components/rhythm.module.css';

const LAYOUT_ID = '25';
const BEATS_PER_BAR = 4;
const CLICK_MIDI = 84;

/** A press this far from a click belongs to that click. */
const CLAIM_MS = 400;

/** A repetition this accurate counts as clean, for the ladder. */
const CLEAN_RATE = 0.8;

/**
 * 3.4.1 – 3.4.10 — playing with the click, and what the click is doing.
 *
 * One engine for the bucket because every practice is the same measurement with
 * the metronome behaving differently: holding one tempo, climbing rungs that
 * have to be earned, vanishing for a stretch, or walking through several tempos
 * in turn. Each note is scored against the click it belonged to, which is the
 * only way to tell being fast from being early.
 *
 * The sweep is the one to run when something feels wrong: it files every score
 * under its **tempo**, so the panel can say the timing is fine at 60 and 80 and
 * goes at 100. Rushing is nearly always a property of a speed rather than of a
 * player, and knowing which speed is what makes it fixable.
 */
export function MetronomeDrill({ config }: { config: MetronomeDrillConfig }) {
  const [lineId, setLineId] = useState<LineId>(config.line);
  const [rung, setRung] = useState(0);
  const [gapBeats, setGapBeats] = useState(config.gaps?.[0] ?? 8);
  const [note, setNote] = useState<string | null>(null);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  const tempo = config.tempos[Math.min(rung, config.tempos.length - 1)] ?? 60;
  const line = LINES[lineId];
  const slot = beatMs(tempo);

  const [tally, setTally] = useState<TimingTally>(EMPTY_TIMING);
  const [returns, setReturns] = useState<TimingTally>(EMPTY_TIMING);
  const [reps, setReps] = useState(0);
  const [settled, setSettled] = useState<number | null>(null);
  const claimed = useRef<Set<number>>(new Set());
  /** Accuracy of the repetition in progress, for the ladder and the sweep. */
  const cycle = useRef<TimingTally>(EMPTY_TIMING);

  /** True while the click is away — the stretch you have to carry alone. */
  const inGap = useCallback(
    (beat: number) => {
      if (config.mode !== 'gap' || beat < 0) return false;
      return Math.floor(beat / gapBeats) % 2 === 1;
    },
    [config.mode, gapBeats],
  );

  const keys = useMemo(() => {
    const middleC = layout.keys.find((key) => key.midi === 60);
    if (!middleC) return [];
    return line.map((offset) => whiteStep(layout, middleC, offset) ?? middleC);
  }, [layout, line]);

  const reset = useCallback(() => {
    setTally(EMPTY_TIMING);
    setReturns(EMPTY_TIMING);
    setReps(0);
    setNote(null);
    claimed.current = new Set();
    cycle.current = EMPTY_TIMING;
  }, []);

  /** Judges a completed repetition: a rung earned, or a tempo noted. */
  const finishCycle = useCallback(() => {
    const rate = onBeatRate(cycle.current);
    cycle.current = EMPTY_TIMING;
    if (rate === null) return;
    const clean = rate >= CLEAN_RATE;

    setReps((current) => {
      const next = clean ? current + 1 : 0;
      if (config.mode === 'ladder') {
        if (!clean) {
          setRung((level) => {
            const moved = Math.max(0, level - 1);
            setNote(`Back to ${config.tempos[moved]} BPM — earn it again`);
            setSettled(config.tempos[moved] ?? null);
            return moved;
          });
          return 0;
        }
        if (next >= (config.repsPerRung ?? 5)) {
          setRung((level) => {
            const moved = Math.min(config.tempos.length - 1, level + 1);
            setNote(
              moved === level
                ? `Holding at ${config.tempos[moved]} BPM — the top of the ladder`
                : `Up to ${config.tempos[moved]} BPM`,
            );
            setSettled(config.tempos[level] ?? null);
            return moved;
          });
          return 0;
        }
      }
      if (config.mode === 'sweep' && next >= (config.repsPerRung ?? 4)) {
        setRung((level) => (level + 1) % config.tempos.length);
        setNote(`Moving on — ${config.tempos[(rung + 1) % config.tempos.length]} BPM next`);
        return 0;
      }
      return next;
    });
  }, [config.mode, config.repsPerRung, config.tempos, rung]);

  const onBeat = useCallback(
    (beat: number) => {
      if (beat > 0 && beat % line.length === 0) finishCycle();
      if (!settings.soundEnabled || inGap(beat)) return;
      instrument.playMidis([CLICK_MIDI], beat % BEATS_PER_BAR === 0 ? 1.1 : 0.6);
    },
    [finishCycle, inGap, line.length, settings.soundEnabled],
  );

  const metronome = useMetronome({ bpm: tempo, onBeat });

  useEffect(() => {
    reset();
  }, [config, gapBeats, lineId, reset, tempo]);

  /** Scores one attempt against the click it was aiming at. */
  const play = useCallback(
    (key?: PianoKey) => {
      const at = metronome.elapsed();
      if (at === null) return;

      const index = Math.round(at / slot);
      const error = at - index * slot;
      if (index < 0 || Math.abs(error) > CLAIM_MS) return;
      if (claimed.current.has(index)) return;
      claimed.current.add(index);

      const wanted = keys[index % keys.length];
      if (key && wanted && key.midi !== wanted.midi && config.mode !== 'listen') {
        setNote('Wrong note — stay with the click and pick the line up again');
        return;
      }
      if (key && settings.soundEnabled) instrument.playMidis([key.midi]);

      const scoreKey =
        config.mode === 'sweep' || config.mode === 'ladder'
          ? `${tempo} BPM`
          : countLabel(index % BEATS_PER_BAR, BEATS_PER_BAR);

      setTally((current) => recordTiming(current, error));
      cycle.current = recordTiming(cycle.current, error);
      // Coming back after a gap is scored on its own: that is the real test.
      const returning = config.mode === 'gap' && inGap(index - 1) && !inGap(index);
      if (returning) setReturns((current) => recordTiming(current, error));
      record(scoreKey, Math.abs(error) <= ON_BEAT_MS, Math.abs(error));
      setNote(returning ? `Back in — ${timingNote(error)}` : timingNote(error));
    },
    [config.mode, inGap, keys, metronome, record, settings.soundEnabled, slot, tempo],
  );

  useKeyboardShortcuts(useMemo(() => ({ ' ': () => play() }), [play]), metronome.running);

  const spots = weakSpots(book, { targetMs: ON_BEAT_MS });
  const rate = onBeatRate(tally);
  const beat = metronome.beat < 0 ? -1 : metronome.beat % BEATS_PER_BAR;
  const next = metronome.beat < 0 ? null : keys[metronome.beat % keys.length];
  const gapNow = inGap(metronome.beat);

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {config.mode === 'fixed' || config.mode === 'listen' ? (
            <Field label="Tempo" hint="What the click is set to, in beats per minute.">
              <SegmentedControl
                value={String(tempo)}
                options={config.tempos.map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
                onChange={(value) => setRung(config.tempos.indexOf(Number(value)))}
                block
                ariaLabel="Tempo"
              />
            </Field>
          ) : (
            <CounterRow>
              <Counter
                label="Tempo"
                value={`${tempo}`}
                hint={
                  config.mode === 'ladder'
                    ? `rung ${rung + 1} of ${config.tempos.length}`
                    : config.mode === 'sweep'
                      ? `${rung + 1} of ${config.tempos.length}`
                      : 'BPM'
                }
              />
              <Counter
                label="Clean runs"
                value={`${reps}${config.repsPerRung ? `/${config.repsPerRung}` : ''}`}
                hint={config.mode === 'ladder' ? 'to earn the next rung' : 'at this tempo'}
              />
            </CounterRow>
          )}
          {config.mode !== 'listen' && (
            <Field label="Line" hint="What to play, one note per click.">
              <SegmentedControl
                value={lineId}
                options={(Object.keys(LINES) as LineId[]).map((id) => ({
                  value: id,
                  label: LINE_LABELS[id],
                }))}
                onChange={(value) => setLineId(value as LineId)}
                block
                ariaLabel="Line"
              />
            </Field>
          )}
          {config.gaps && config.gaps.length > 1 && (
            <Field label="Gap" hint="Beats the click drops out for.">
              <SegmentedControl
                value={String(gapBeats)}
                options={config.gaps.map((beats) => ({ value: String(beats), label: `${beats}` }))}
                onChange={(value) => setGapBeats(Number(value))}
                block
                ariaLabel="Gap length"
              />
            </Field>
          )}
          <Button
            variant={metronome.running ? 'danger' : 'primary'}
            icon={metronome.running ? 'stop' : 'play'}
            onClick={() => {
              reset();
              if (metronome.running) metronome.stop();
              else metronome.start();
            }}
            block
          >
            {metronome.running ? 'Stop' : 'Start the click'}
          </Button>
          <CounterRow>
            <Counter
              label="On the beat"
              value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
              hint={`inside ${ON_BEAT_MS}ms`}
            />
            <Counter label="Average off" value={formatMs(meanTiming(tally))} hint={timingBias(tally)} />
            {config.mode === 'gap' && (
              <Counter
                label="Coming back"
                value={formatMs(meanTiming(returns))}
                hint={`${returns.notes} returns`}
              />
            )}
            {config.mode === 'ladder' && settled !== null && (
              <Counter label="Your tempo" value={`${settled}`} hint="last one that held" />
            )}
          </CounterRow>
          <WeakSpots
            spots={spots}
            emptyNote="Nothing weak yet — play a few bars."
            onClear={clear}
          />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${tempo} BPM`,
          config.mode === 'listen' ? 'listen and tap' : LINE_LABELS[lineId],
          gapNow ? 'click away — keep going' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {!metronome.running && <Chip>{note ?? 'Press start, then play with the click'}</Chip>}
            {metronome.running && note && (
              <Chip tone={note.includes('on the beat') ? 'accent' : 'danger'}>{note}</Chip>
            )}
            {metronome.running && !note && <Chip tone="accent">Play on every click</Chip>}
          </>
        }
      >
        {metronome.running ? (config.mode === 'listen' ? beat + 1 : (next?.sharpName ?? '·')) : '·'}
      </DrillPrompt>

      <BeatBar beatsPerBar={BEATS_PER_BAR} beat={metronome.running ? beat : -1} silent={gapNow} />

      {config.mode === 'listen' ? (
        <button
          type="button"
          className={styles.pad}
          disabled={!metronome.running}
          onPointerDown={() => play()}
        >
          Tap
          <span className={styles.padHint}>tap here, or press the space bar</span>
        </button>
      ) : (
        <div className={styles.board}>
          <Keyboard
            layout={layout}
            lit={next ? [next.midi] : []}
            onKeyPress={play}
            footerNote={metronome.running ? 'One note per click' : 'Start the click first'}
          />
        </div>
      )}

      <p className={styles.note}>
        Whatever the tempo, the note has to sit on the beat. Fast is a result of that, never a
        substitute for it.
      </p>
    </DrillShell>
  );
}
