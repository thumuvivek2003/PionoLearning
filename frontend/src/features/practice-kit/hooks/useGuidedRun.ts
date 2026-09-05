import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LEAD_IN_BEATS, beatMs } from '../timing';
import { useMetronome } from './useMetronome';

/** Clicks in a bar, for the accented one. */
const BEATS_PER_BAR = 4;

/** Where a guided run has got to. */
export type GuidedPhase = 'idle' | 'counting' | 'playing' | 'done';

/** One slot of the run — a count-in click, or a cue that has just come due. */
export interface GuidedTick {
  /** Slot number counted from the first count-in click. */
  slot: number;
  /** True while the count-in is still running, so nothing is due yet. */
  counting: boolean;
  /** Which cue is due. Only meaningful once `counting` is false. */
  index: number;
  /** This slot lands on a click rather than between two of them. */
  onBeat: boolean;
  /** First click of a bar — the one worth accenting. */
  accented: boolean;
}

interface GuidedRunOptions {
  /**
   * Slots in one pass through the run.
   *
   * For an even run this is simply the number of cues. For a figure with note
   * values it is the number of the shortest note that fits in a pass, and
   * `cueForSlot` says which note each of those slots belongs to.
   */
  length: number;
  /**
   * Which cue a slot inside a pass belongs to; the slot itself by default.
   *
   * This is what lets one engine conduct both an even scale and a figure of
   * mixed note values: a held note simply owns several consecutive slots, so
   * the cue stays put while the click carries on underneath it.
   */
  cueForSlot?: (slotInPass: number) => number;
  /** Clicks per minute — the tempo the learner sees and sets. */
  bpm: number;
  /** Cues per click. 1 is one note per click, 2 is two, and so on. */
  subdivision?: number;
  /** Clicks of count-in before the first cue is due. */
  leadInBeats?: number;
  /** Stop at the end of one pass instead of going round again. */
  once?: boolean;
  /** Fires as each slot comes due, count-in clicks included. */
  onTick?: (tick: GuidedTick) => void;
  /** Fires once per completed pass, with how many are done. */
  onCycle?: (passes: number) => void;
}

/**
 * A run that advances on the beat rather than on a keypress.
 *
 * The click-driven drills all measure what you played by watching the key you
 * pressed, which only works while the instrument *is* the screen. On a real
 * piano there is nothing to watch, so the app has to change jobs: instead of
 * marking the run it conducts it — counts you in, keeps the beat, and moves the
 * cue on when the next note is due.
 *
 * That trade is deliberate and worth being plain about. A conducted run cannot
 * know whether you played the right note, so a drill in this mode should stop
 * reporting accuracy rather than report a guess. What it can still do — and
 * what actually matters away from the screen — is hold a steady tempo and tell
 * you where in the scale you are meant to be.
 *
 * Timing is derived from the slot number, never accumulated, so a pass stays in
 * step with the click however long the run goes on.
 */
export function useGuidedRun({
  length,
  cueForSlot,
  bpm,
  subdivision = 1,
  leadInBeats = LEAD_IN_BEATS,
  once = false,
  onTick,
  onCycle,
}: GuidedRunOptions) {
  const [cycles, setCycles] = useState(0);
  const [finished, setFinished] = useState(false);

  // Read at fire time, so a fresh closure never restarts the click.
  const callbacks = useRef({ onTick, onCycle });
  useEffect(() => {
    callbacks.current = { onTick, onCycle };
  }, [onCycle, onTick]);

  /** Count-in measured in slots, since that is what the click counts. */
  const leadSlots = leadInBeats * subdivision;

  /** Set once the metronome exists, so a finishing pass can stop the click. */
  const stopAtEnd = useRef<() => void>(() => {});

  // Plain functions rather than memoised ones: the metronome reads its callback
  // from a ref on every slot, so a fresh identity each render costs nothing and
  // guarantees the run is always conducted from the current figure.
  const cueAt = (slot: number) => {
    const cueSlot = slot - leadSlots;
    if (length === 0 || cueSlot < 0) return 0;
    const inPass = cueSlot % length;
    return cueForSlot ? cueForSlot(inPass) : inPass;
  };

  const handleSlot = (slot: number) => {
    const counting = slot < leadSlots;

    callbacks.current.onTick?.({
      slot,
      counting,
      index: cueAt(slot),
      onBeat: slot % subdivision === 0,
      accented: slot % subdivision === 0 && Math.floor(slot / subdivision) % BEATS_PER_BAR === 0,
    });

    if (counting || length === 0) return;

    // A pass ends on the slot that would start the next one, so the last cue of
    // a pass gets its full length before anything is counted.
    const cueSlot = slot - leadSlots;
    if (cueSlot === 0 || cueSlot % length !== 0) return;

    const passes = cueSlot / length;
    setCycles(passes);
    callbacks.current.onCycle?.(passes);
    if (once) {
      setFinished(true);
      stopAtEnd.current();
    }
  };

  // One click per cue, so a subdivided run still advances a note at a time.
  // The drill decides what each slot sounds like from `onBeat` and `accented`.
  const metronome = useMetronome({ bpm: bpm * subdivision, onBeat: handleSlot });
  // Destructured so the transport keeps stable identities: the metronome hands
  // back a fresh object each render, and a caller wants to depend on `stop`
  // from an effect without that effect firing on every render.
  const { beat, running, start: startClick, stop: stopMetronome } = metronome;

  useEffect(() => {
    stopAtEnd.current = stopMetronome;
  }, [stopMetronome]);

  const start = useCallback(() => {
    setCycles(0);
    setFinished(false);
    startClick();
  }, [startClick]);

  const stop = useCallback(() => {
    setFinished(false);
    stopMetronome();
  }, [stopMetronome]);

  const toggle = useCallback(() => {
    if (running) stop();
    else start();
  }, [running, start, stop]);

  // A run re-paced or re-dealt mid-pass starts its count again rather than
  // dropping the learner into the middle of a scale they have not begun.
  useEffect(() => {
    setCycles(0);
    setFinished(false);
  }, [length, subdivision]);

  const slot = beat;
  const started = running && slot >= 0;
  const counting = started && slot < leadSlots;

  const phase = useMemo<GuidedPhase>(() => {
    if (finished) return 'done';
    if (!started) return 'idle';
    return counting ? 'counting' : 'playing';
  }, [counting, finished, started]);

  return {
    phase,
    running,
    /** Which cue is due now; 0 while idle or counting in. */
    index: started ? cueAt(slot) : 0,
    /** Clicks left in the count-in — "3, 2, 1" — or 0 once playing. */
    countIn: counting ? leadInBeats - Math.floor(slot / subdivision) : 0,
    /** Which beat of the bar is live, for a beat indicator; -1 while idle. */
    beatInBar: started ? Math.floor(slot / subdivision) % BEATS_PER_BAR : -1,
    /** Completed passes through the run. */
    cycles,
    /** How long one cue holds, for a countdown or a progress bar. */
    slotMs: beatMs(bpm) / subdivision,
    start,
    stop,
    toggle,
  };
}
