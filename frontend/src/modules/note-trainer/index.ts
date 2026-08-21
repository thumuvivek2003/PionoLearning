import { dedupeBy, parseNoteList } from '@/features/music-theory';
import type {
  ParseResult,
  TrainerItem,
  TrainerModule,
} from '@/features/trainer/types/trainer.types';
import { DEFAULT_NOTE_PRESET_ID, NOTE_PRESETS, noteToItem } from './presets';

/**
 * Project: single-note recognition.
 * Answers "which key on the piano is this note?".
 */
export const noteTrainerModule: TrainerModule = {
  id: 'notes',
  title: 'Note Trainer',
  short: 'Notes',
  description: 'Random single notes drawn from a scale or a custom set.',
  icon: 'music-note',
  presetLabel: 'Scale / Mode',
  inputLabel: 'Notes (editable)',
  inputPlaceholder: 'C, D, E, F, G, A, B',
  inputHint: 'Separate with commas. Use # for sharp and b for flat — C#, Eb, F#.',
  presets: NOTE_PRESETS,
  defaultPresetId: DEFAULT_NOTE_PRESET_ID,

  parse(input: string): ParseResult {
    const { values, invalid } = parseNoteList(input);
    const items = dedupeBy(values.map(noteToItem), (item) => item.id);
    return { items, invalid };
  },

  serialize(items: readonly TrainerItem[]): string {
    return items.map((item) => item.label).join(', ');
  },

  examples: ['C, D, E, F, G, A, B', 'C#, D#, F#, G#, A#', 'Db, Eb, Gb, Ab, Bb'],
};

export { NOTE_PRESETS, noteToItem };
