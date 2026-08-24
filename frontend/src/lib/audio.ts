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
   */
  playMidis(midis: readonly number[]): void;
  dispose(): void;
}

class OscillatorInstrument implements Instrument {
  #context: AudioContext | null = null;

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

  playMidis(midis: readonly number[]): void {
    const context = this.#ensureContext();
    if (!context || midis.length === 0) return;

    const startedAt = context.currentTime;
    // Share one gain node so a four-note chord is not four times as loud.
    const master = context.createGain();
    master.gain.value = 0.9 / Math.sqrt(midis.length);
    master.connect(context.destination);

    midis.forEach((midi) => {
      const frequency = midiToFrequency(midi);

      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;

      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, startedAt);
      envelope.gain.exponentialRampToValueAtTime(0.28, startedAt + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startedAt + NOTE_SECONDS);

      oscillator.connect(envelope).connect(master);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + NOTE_SECONDS + 0.05);
    });
  }

  dispose(): void {
    void this.#context?.close();
    this.#context = null;
  }
}

export const instrument: Instrument = new OscillatorInstrument();
