import { dedupeBy, parseChordSymbol, tokenize } from '@/features/music-theory';
import type {
  ParseResult,
  TrainerItem,
  TrainerModule,
} from '@/features/trainer/types/trainer.types';
import { CHORD_PRESETS, DEFAULT_CHORD_PRESET_ID, chordToItem } from './presets';

/**
 * Project: chord recognition.
 * Same engine as the note trainer — the only difference is that one item
 * carries three or four pitch classes instead of one.
 */
export const chordTrainerModule: TrainerModule = {
  id: 'chords',
  title: 'Chord Trainer',
  short: 'Chords',
  description: 'Random chords from a key, a chord family or your own list.',
  icon: 'chords',
  presetLabel: 'Key / Chord set',
  inputLabel: 'Chords (editable)',
  inputPlaceholder: 'C, Dm, Em, F, G, Am, Bdim',
  inputHint: 'Separate with commas. Supported: C, Cm, C7, Cmaj7, Cm7, Cdim, Caug, Csus4, Cm7b5.',
  presets: CHORD_PRESETS,
  defaultPresetId: DEFAULT_CHORD_PRESET_ID,

  parse(input: string): ParseResult {
    const items: TrainerItem[] = [];
    const invalid: string[] = [];

    for (const token of tokenize(input)) {
      const chord = parseChordSymbol(token);
      if (chord) items.push(chordToItem(chord));
      else invalid.push(token);
    }

    return { items: dedupeBy(items, (item) => item.id), invalid };
  },

  serialize(items: readonly TrainerItem[]): string {
    return items.map((item) => item.label).join(', ');
  },

  examples: ['C, Dm, Em, F, G, Am, Bdim', 'Cmaj7, Dm7, G7, Cmaj7', 'C, Am, F, G'],
};

export { CHORD_PRESETS, chordToItem };
