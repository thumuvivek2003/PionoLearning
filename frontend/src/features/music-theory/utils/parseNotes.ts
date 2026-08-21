import type { SpelledNote } from '../types/music.types';
import { parseNote } from './normalizeNote';

export interface ParsedList<T> {
  values: T[];
  /** Tokens that could not be understood, kept in input order. */
  invalid: string[];
}

/** Split a free-text list on commas, whitespace or slashes. */
export function tokenize(input: string): string[] {
  return input
    .split(/[,\s/|]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

/** Parse "C, D#, Gb" into spelled notes, reporting anything unreadable. */
export function parseNoteList(input: string): ParsedList<SpelledNote> {
  const values: SpelledNote[] = [];
  const invalid: string[] = [];

  for (const token of tokenize(input)) {
    const note = parseNote(token);
    if (note) values.push(note);
    else invalid.push(token);
  }

  return { values, invalid };
}

/** Render notes back into the comma-separated form shown in the input box. */
export function formatNoteList(notes: readonly SpelledNote[]): string {
  return notes.map((note) => note.name).join(', ');
}

/** Drop entries that repeat an earlier one, keeping the first occurrence. */
export function dedupeBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}
