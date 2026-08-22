import type { PracticeMode } from '@/features/trainer/types/trainer.types';
import type { AccentColor, ThemeMode } from '@/types/common.types';

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentColor;
  /** Play the item through the built-in synth when it appears. */
  soundEnabled: boolean;
  /** Print note names on the keys. Turn off for a harder read. */
  showNoteNames: boolean;
  /**
   * Light single notes in every octave. Chords always use one voicing —
   * highlighting four pitch classes across five octaves is unreadable.
   */
  highlightAllOctaves: boolean;
  /**
   * Show the upcoming item. Reading ahead trains
   * your eyes instead of your recognition.
   */
  showNextItem: boolean;
  /** Light the current item on the keyboard. */
  highlightCurrent: boolean;
  /** Also light the item you just played. Off by default — it clutters the read. */
  highlightPrevious: boolean;
  /** Also light the item coming up. Off by default — it lets your eyes run ahead. */
  highlightNext: boolean;
  /** Randomiser difficulty — see features/randomizer. */
  strategyId: string;
  /** 25 / 49 / 61 keys. */
  keyboardLayoutId: string;
  /** Seconds each item stays on screen. */
  intervalSeconds: number;
  /**
   * Whole-session time budget in seconds; 0 means unlimited. Counts down only
   * while the run is playing — pause freezes it, prev/next do not.
   */
  sessionSeconds: number;
  mode: PracticeMode;
  /** Sidebar shows icons only. Ignored on narrow screens, where it is a bar. */
  sidebarCollapsed: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accent: 'violet',
  soundEnabled: false,
  showNoteNames: true,
  highlightAllOctaves: true,
  showNextItem: true,
  highlightCurrent: true,
  highlightPrevious: false,
  highlightNext: false,
  strategyId: 'no-repeat',
  keyboardLayoutId: '61',
  intervalSeconds: 2,
  sessionSeconds: 0,
  mode: 'practice',
  sidebarCollapsed: false,
};
