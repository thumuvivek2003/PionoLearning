import type { PitchClass } from '@/features/music-theory';
import type { Identifiable } from '@/features/randomizer';

/**
 * The single currency of the app.
 *
 * A note produces an item with one pitch class, a chord produces one with
 * three or four. Everything downstream — the display, the sequence strip, the
 * 61-key keyboard, the audio engine, the statistics — works on TrainerItem and
 * therefore never needs to know which module created it (Liskov / DIP).
 */
export interface TrainerItem extends Identifiable {
  /** Stable id, unique inside a pool. e.g. "note:C#", "chord:Dm7". */
  id: string;
  /** Big text shown as CURRENT. e.g. "C#", "Dm7". */
  label: string;
  /** Optional second line. e.g. "D · F · A". */
  sublabel?: string;
  /** Keys to light up on the keyboard. */
  pitchClasses: PitchClass[];
  /** Lowest pitch class, used for audio voicing and sorting. */
  root: PitchClass;
}

export interface ParseResult {
  items: TrainerItem[];
  /** Tokens the module could not understand, reported back to the user. */
  invalid: string[];
}

/** A named, ready-made item set (a scale, a chord family, …). */
export interface TrainerPreset {
  id: string;
  label: string;
  /** Optional heading used to group presets in the dropdown. */
  group?: string;
  build(): TrainerItem[];
}

/**
 * A pluggable trainer — "a project".
 *
 * To add one: create src/modules/<your-module>/, export an object that
 * satisfies this interface, and register it in src/modules/registry.ts.
 * No existing file needs to change beyond that single registration.
 */
export interface TrainerModule {
  id: string;
  /** Sidebar + page title, e.g. "Note Trainer". */
  title: string;
  /** Short label used in compact places. */
  short: string;
  description: string;
  icon: string;
  /** Label above the preset dropdown, e.g. "Scale / Mode". */
  presetLabel: string;
  /** Label above the editable input, e.g. "Notes (editable)". */
  inputLabel: string;
  inputPlaceholder: string;
  inputHint: string;
  presets: readonly TrainerPreset[];
  defaultPresetId: string;
  /** Turn the editable text box into items. */
  parse(input: string): ParseResult;
  /** Render items back into the editable text box. */
  serialize(items: readonly TrainerItem[]): string;
  /** Examples shown on the Settings page. */
  examples: readonly string[];
}

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';

export type PracticeMode = 'practice' | 'test';

export type AnswerVerdict = 'correct' | 'wrong';
