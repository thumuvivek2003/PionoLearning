export const APP_NAME = 'Piano Random';
export const APP_SUBTITLE = 'Trainer';
export const APP_VERSION = '1.0.0';

/** Seconds each item stays on screen. */
export const TIMER_OPTIONS: readonly number[] = [0.5, 1, 1.5, 2, 3, 5, 10];

export const MIN_INTERVAL_SECONDS = 0.2;
export const MAX_INTERVAL_SECONDS = 60;
export const DEFAULT_INTERVAL_SECONDS = 2;

/** Whole-session duration presets, in seconds. 0 = no limit. */
export const SESSION_TIMER_OPTIONS: readonly number[] = [0, 60, 120, 180, 300, 600, 900];

/** How many upcoming items the sequence strip keeps ready. */
export const SEQUENCE_LOOKAHEAD = 24;
/** How many past items stay visible to the left of the current one. */
export const SEQUENCE_LOOKBEHIND = 8;

/** Countdown refresh rate — smooth enough for the ring, cheap enough to run. */
export const TICK_MS = 50;

export const STORAGE_KEYS = {
  settings: 'prt.settings.v1',
  statistics: 'prt.statistics.v1',
  sessionSetup: 'prt.session-setup.v1',
} as const;

export const MAX_STORED_SESSIONS = 50;
