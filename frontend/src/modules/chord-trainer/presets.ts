import {
  COMMON_MAJOR_ROOTS,
  COMMON_MINOR_ROOTS,
  buildScaleFrom,
  chordNoteNames,
  chordsOfType,
  diatonicChords,
} from '@/features/music-theory';
import type { Chord } from '@/features/music-theory';
import type { TrainerItem, TrainerPreset } from '@/features/trainer/types/trainer.types';

export function chordToItem(chord: Chord): TrainerItem {
  return {
    id: `chord:${chord.symbol}`,
    label: chord.symbol,
    sublabel: chordNoteNames(chord),
    pitchClasses: [...chord.pitchClasses],
    root: chord.root.pitchClass,
  };
}

function diatonicPreset(
  rootName: string,
  scaleTypeId: string,
  set: 'triads' | 'sevenths',
  group: string,
): TrainerPreset | null {
  const scale = buildScaleFrom(rootName, scaleTypeId);
  if (!scale) return null;
  const chords = diatonicChords(scale, set);
  if (chords.length === 0) return null;

  return {
    id: `diatonic:${scaleTypeId}:${set}:${rootName}`,
    label: `${scale.root.name} ${scale.type.short} — ${set === 'sevenths' ? '7th chords' : 'triads'}`,
    group,
    build: () => chords.map(chordToItem),
  };
}

function familyPreset(
  id: string,
  label: string,
  chordTypeId: string,
  group: string,
): TrainerPreset {
  return {
    id,
    label,
    group,
    build: () => chordsOfType(chordTypeId, COMMON_MAJOR_ROOTS).map(chordToItem),
  };
}

const KEY_TRIADS = COMMON_MAJOR_ROOTS.flatMap(
  (root) => diatonicPreset(root, 'major', 'triads', 'Chords in a major key') ?? [],
);

const KEY_SEVENTHS = COMMON_MAJOR_ROOTS.flatMap(
  (root) => diatonicPreset(root, 'major', 'sevenths', 'Chords in a major key') ?? [],
);

const MINOR_KEY_TRIADS = COMMON_MINOR_ROOTS.flatMap(
  (root) => diatonicPreset(root, 'natural-minor', 'triads', 'Chords in a minor key') ?? [],
);

const ALL_TRIADS: TrainerPreset = {
  id: 'family:all-triads',
  label: 'All major + minor triads (24)',
  group: 'Chord families',
  build: () => [
    ...chordsOfType('major', COMMON_MAJOR_ROOTS).map(chordToItem),
    ...chordsOfType('minor', COMMON_MAJOR_ROOTS).map(chordToItem),
  ],
};

const POP_PROGRESSION: TrainerPreset = {
  id: 'set:pop-c',
  label: 'Pop chords in C (C, Am, F, G, Dm, Em)',
  group: 'Starter sets',
  build: () => {
    const scale = buildScaleFrom('C', 'major');
    if (!scale) return [];
    const wanted = ['C', 'Am', 'F', 'G', 'Dm', 'Em'];
    const byName = new Map(diatonicChords(scale, 'triads').map((c) => [c.symbol, c]));
    return wanted.flatMap((symbol) => {
      const chord = byName.get(symbol);
      return chord ? [chordToItem(chord)] : [];
    });
  },
};

export const CHORD_PRESETS: readonly TrainerPreset[] = [
  POP_PROGRESSION,
  familyPreset('family:major', 'All major triads (12)', 'major', 'Chord families'),
  familyPreset('family:minor', 'All minor triads (12)', 'minor', 'Chord families'),
  ALL_TRIADS,
  familyPreset('family:dom7', 'All dominant 7ths (12)', 'dom7', 'Chord families'),
  familyPreset('family:maj7', 'All major 7ths (12)', 'maj7', 'Chord families'),
  familyPreset('family:min7', 'All minor 7ths (12)', 'min7', 'Chord families'),
  familyPreset('family:dim', 'All diminished triads (12)', 'dim', 'Chord families'),
  ...KEY_TRIADS,
  ...KEY_SEVENTHS,
  ...MINOR_KEY_TRIADS,
];

export const DEFAULT_CHORD_PRESET_ID = 'diatonic:major:triads:C';
