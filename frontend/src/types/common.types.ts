export type ThemeMode = 'dark' | 'light';

export type AccentColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';

export interface Option<T extends string | number = string> {
  value: T;
  label: string;
  group?: string;
  disabled?: boolean;
}

/** ISO-8601 timestamp string. */
export type Timestamp = string;
