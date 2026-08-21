import { LESSON_PLAN } from '@/features/lessons';
import type { Lesson } from '@/features/lessons';
import {
  COMMON_MAJOR_ROOTS,
  COMMON_MINOR_ROOTS,
  SCALE_TYPES,
  buildScaleFrom,
  dedupeBy,
  parseNote,
  pitchClassName,
  toPitchClass,
} from '@/features/music-theory';
import type { Scale, SpelledNote } from '@/features/music-theory';
import type { TrainerItem, TrainerPreset } from '@/features/trainer/types/trainer.types';

export function noteToItem(note: SpelledNote): TrainerItem {
  return {
    id: `note:${note.name}`,
    label: note.name,
    pitchClasses: [note.pitchClass],
    root: note.pitchClass,
  };
}

function scalePreset(rootName: string, scaleTypeId: string, group: string): TrainerPreset | null {
  const scale = buildScaleFrom(rootName, scaleTypeId);
  if (!scale) return null;
  return {
    id: `${scaleTypeId}:${rootName}`,
    label: labelFor(scale),
    group,
    build: () => scale.notes.map(noteToItem),
  };
}

function labelFor(scale: Scale): string {
  return `${scale.root.name} ${scale.type.short}`;
}

const MAJOR_PRESETS = COMMON_MAJOR_ROOTS.flatMap(
  (root) => scalePreset(root, 'major', 'Major scales') ?? [],
);

const MINOR_PRESETS = COMMON_MINOR_ROOTS.flatMap(
  (root) => scalePreset(root, 'natural-minor', 'Minor scales') ?? [],
);

/** Modes and coloured scales, all rooted on C so the shapes are comparable. */
const MODE_PRESETS = SCALE_TYPES.filter(
  (type) => !['major', 'natural-minor', 'chromatic'].includes(type.id),
).flatMap((type) => scalePreset('C', type.id, 'Modes & colours') ?? []);

const ALL_NOTES: TrainerPreset = {
  id: 'all:chromatic',
  label: 'All 12 notes (chromatic)',
  group: 'Whole keyboard',
  build: () =>
    Array.from({ length: 12 }, (_, semitone) => {
      const pitchClass = toPitchClass(semitone);
      return {
        id: `note:${pitchClassName(pitchClass)}`,
        label: pitchClassName(pitchClass),
        pitchClasses: [pitchClass],
        root: pitchClass,
      } satisfies TrainerItem;
    }),
};

const WHITE_NOTES: TrainerPreset = {
  id: 'all:white',
  label: 'White keys only (C D E F G A B)',
  group: 'Whole keyboard',
  build: () => (buildScaleFrom('C', 'major')?.notes ?? []).map(noteToItem),
};

const BLACK_NOTES: TrainerPreset = {
  id: 'all:black',
  label: 'Black keys only (the 2–3 pattern)',
  group: 'Whole keyboard',
  build: () =>
    ([1, 3, 6, 8, 10] as const).map((pitchClass) => ({
      id: `note:${pitchClassName(pitchClass)}`,
      label: pitchClassName(pitchClass),
      sublabel: pitchClassName(pitchClass, 'flat'),
      pitchClasses: [pitchClass],
      root: pitchClass,
    })),
};

/**
 * Each rung of the lesson ladder is also an ordinary preset, so choosing one
 * from the dropdown, deep-linking to it, and recording it in History all work
 * through the machinery that already existed.
 */
function lessonPreset(lesson: Lesson): TrainerPreset {
  return {
    id: lesson.id,
    label: `${String(lesson.order).padStart(2, '0')}. ${lesson.title}`,
    group: 'Lesson ladder',
    build: () =>
      dedupeBy(
        lesson.notes.flatMap((token) => {
          const note = parseNote(token);
          return note ? [noteToItem(note)] : [];
        }),
        (item) => item.id,
      ),
  };
}

const LESSON_PRESETS = LESSON_PLAN.map(lessonPreset);

export const NOTE_PRESETS: readonly TrainerPreset[] = [
  ...LESSON_PRESETS,
  WHITE_NOTES,
  BLACK_NOTES,
  ALL_NOTES,
  ...MAJOR_PRESETS,
  ...MINOR_PRESETS,
  ...MODE_PRESETS,
];

export const DEFAULT_NOTE_PRESET_ID = 'major:C';
