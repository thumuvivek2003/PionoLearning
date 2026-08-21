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
  play(pitchClasses: readonly PitchClass[]): void;
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
    const context = this.#ensureContext();
    if (!context || pitchClasses.length === 0) return;

    const startedAt = context.currentTime;
    // Share one gain node so a four-note chord is not four times as loud.
    const master = context.createGain();
    master.gain.value = 0.9 / Math.sqrt(pitchClasses.length);
    master.connect(context.destination);

    pitchClasses.forEach((pitchClass, index) => {
      // Stack chord tones upward so they voice like a real hand position.
      const previous = pitchClasses[index - 1];
      const octave = BASE_OCTAVE + (previous !== undefined && pitchClass < previous ? 1 : 0);
      const frequency = midiToFrequency(toMidi(pitchClass, octave));

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
