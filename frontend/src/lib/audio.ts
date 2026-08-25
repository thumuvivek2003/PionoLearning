import { midiToFrequency, toMidi } from '@/features/music-theory';
import type { PitchClass } from '@/features/music-theory';

/** Octave used for playback; low enough to sound like a piano register. */
const BASE_OCTAVE = 4;
const NOTE_SECONDS = 0.9;

/**
 * Minimal Web Audio voice.
 *
 * Deliberately behind an interface: the trainer only asks it to "play these
 * pitch classes", so a sampled piano could replace it without touching the UI.
 */
export interface Instrument {
  /**
   * Plays pitch classes, voiced from a fixed octave.
   *
   * Pitch *height* is not meaningful here — every C sounds like the same C —
   * which is right for the trainers, where the answer is the note name.
   */
  play(pitchClasses: readonly PitchClass[]): void;
  /**
   * Plays exact keys, so two keys an octave apart really sound an octave
   * apart. The octave drills need this: the whole point they teach is that
   * C4 and C5 are the same letter at a different height.
   *
   * `gain` scales the volume around 1, so an accent drill can demonstrate the
   * difference it is asking you to make.
   */
  playMidis(midis: readonly number[], gain?: number): void;
  /**
   * Plays keys one after another, so a scale sounds like a scale.
   *
   * The ear practices need a melody rather than a chord: relative keys hold the
   * same notes, so the only thing that separates them is the order they arrive
   * in and where the line comes to rest. Scheduled on the audio clock rather
   * than with timers, so the notes stay even while the screen is busy.
   */
  playSequence(midis: readonly number[], gapSeconds?: number): void;
  /** Cuts anything still sounding, so a replay does not stack on the last one. */
  silence(): void;
  dispose(): void;
}

class OscillatorInstrument implements Instrument {
  #context: AudioContext | null = null;
  /** Voices still scheduled or sounding, so they can be cut short. */
  #voices = new Set<OscillatorNode>();

  #ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.#context ??= new Ctor();
    if (this.#context.state === 'suspended') void this.#context.resume();
    return this.#context;
  }

  play(pitchClasses: readonly PitchClass[]): void {
    // Stack the tones upward so a chord voices like a real hand position.
    this.playMidis(
      pitchClasses.map((pitchClass, index) => {
        const previous = pitchClasses[index - 1];
        const octave = BASE_OCTAVE + (previous !== undefined && pitchClass < previous ? 1 : 0);
        return toMidi(pitchClass, octave);
      }),
    );
  }

  playMidis(midis: readonly number[], gain = 1): void {
    const context = this.#ensureContext();
    if (!context || midis.length === 0) return;

    const startedAt = context.currentTime;
    // Share one gain node so a four-note chord is not four times as loud.
    const master = context.createGain();
    master.gain.value = (0.9 / Math.sqrt(midis.length)) * Math.max(0.1, Math.min(2, gain));
    master.connect(context.destination);

    midis.forEach((midi) => this.#voice(context, master, midi, startedAt, NOTE_SECONDS));
  }

  playSequence(midis: readonly number[], gapSeconds = 0.32): void {
    const context = this.#ensureContext();
    if (!context || midis.length === 0) return;
    this.silence();

    const startedAt = context.currentTime;
    const master = context.createGain();
    master.gain.value = 0.9;
    master.connect(context.destination);

    // Notes overlap a little, which is what makes a run sound joined up rather
    // than like eight separate presses.
    const held = Math.max(gapSeconds * 1.4, 0.3);
    midis.forEach((midi, index) => {
      this.#voice(context, master, midi, startedAt + index * gapSeconds, held);
    });
  }

  silence(): void {
    for (const voice of this.#voices) {
      try {
        voice.stop();
      } catch {
        // Already stopped; nothing to cut.
      }
    }
    this.#voices.clear();
  }

  /** One note: an oscillator under its own envelope, tracked so it can be cut. */
  #voice(
    context: AudioContext,
    master: GainNode,
    midi: number,
    startAt: number,
    seconds: number,
  ): void {
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = midiToFrequency(midi);

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(0.28, startAt + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + seconds);

    oscillator.connect(envelope).connect(master);
    oscillator.start(startAt);
    oscillator.stop(startAt + seconds + 0.05);
    this.#voices.add(oscillator);
    oscillator.onended = () => this.#voices.delete(oscillator);
  }

  dispose(): void {
    this.silence();
    void this.#context?.close();
    this.#context = null;
  }
}

export const instrument: Instrument = new OscillatorInstrument();
