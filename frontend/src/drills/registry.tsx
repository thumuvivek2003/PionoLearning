import type { ComponentType } from 'react';
import {
  FingerLiftDrill,
  FingerNumberDrill,
  FingerTappingDrill,
  NoteFingerDrill,
  RelaxationDrill,
} from '@/features/finger-training';
import {
  BlackGroupDrill,
  BlackKeyNameDrill,
  BlindIdentifyDrill,
  BlindReachDrill,
  DistanceDrill,
  EnharmonicDrill,
  FindKeyDrill,
  KeyNameDrill,
  LandmarkChainDrill,
  LandmarkNoteDrill,
  LandmarkSprintDrill,
  NaturalSequenceDrill,
  NoteRecognitionDrill,
  OctaveJumpDrill,
  OctaveNameDrill,
  OctaveSweepDrill,
  RandomSequenceDrill,
  RegisterCompareDrill,
  RelationDrill,
  getChainDrill,
  getDistanceDrill,
  getGroupDrill,
  getJumpDrill,
  getLandmarkDrill,
  getReachDrill,
  getRecognitionDrill,
  getRelationDrill,
  getSprintDrill,
  getSweepDrill,
} from '@/features/keyboard-geography';

/**
 * A practice screen that a curriculum practice can point at.
 *
 * `render` takes no props on purpose: whatever a drill needs is bound at
 * registration, so the practice page can mount any drill without knowing what
 * kind it is (Liskov).
 */
export interface Drill {
  id: string;
  /** Shown above the screen, e.g. "Finger numbers — right hand". */
  title: string;
  render: ComponentType;
}

/**
 * Registry of practice screens.
 *
 * ── Adding a screen ───────────────────────────────────────────────────
 * 1. Build the component in its feature folder
 * 2. Register it here with a stable id
 * 3. Point a practice at that id: activity: { kind: 'drill', drillId: '…' }
 *
 * The curriculum data never imports a component, and no page needs a switch
 * statement over drill kinds.
 */
const REGISTERED_DRILLS: readonly Drill[] = [
  /* ---- L1 · B1.1 — White Key Geography ---- */
  {
    id: 'geo.natural-sequence',
    title: 'C D E F G A B',
    render: NaturalSequenceDrill,
  },
  {
    id: 'geo.ascending',
    title: 'Ascending note sequence',
    render: () => <RelationDrill config={getRelationDrill('ascending')} />,
  },
  {
    id: 'geo.descending',
    title: 'Descending note sequence',
    render: () => <RelationDrill config={getRelationDrill('descending')} />,
  },
  {
    id: 'geo.adjacent',
    title: 'Adjacent white keys',
    render: () => <RelationDrill config={getRelationDrill('adjacent')} />,
  },
  {
    id: 'geo.skip-one',
    title: 'Skip-one recognition',
    render: () => <RelationDrill config={getRelationDrill('skip')} />,
  },
  { id: 'geo.key-to-name', title: 'White-key random recognition', render: KeyNameDrill },
  { id: 'geo.name-to-key', title: 'White key → location', render: FindKeyDrill },

  /* ---- L1 · B1.2 — Black-Key Geography ---- */
  {
    id: 'geo.group-two',
    title: '2-black-key pattern',
    render: () => <BlackGroupDrill config={getGroupDrill('two')} />,
  },
  {
    id: 'geo.group-three',
    title: '2 vs 3 black keys',
    render: () => <BlackGroupDrill config={getGroupDrill('both')} />,
  },
  {
    id: 'geo.landmark-c',
    title: 'C from the group of 2',
    render: () => <LandmarkNoteDrill config={getLandmarkDrill('C')} />,
  },
  {
    id: 'geo.landmark-d',
    title: 'D from the group of 2',
    render: () => <LandmarkNoteDrill config={getLandmarkDrill('D')} />,
  },
  {
    id: 'geo.landmark-e',
    title: 'E from the group of 2',
    render: () => <LandmarkNoteDrill config={getLandmarkDrill('E')} />,
  },
  {
    id: 'geo.landmark-f',
    title: 'F from the group of 3',
    render: () => <LandmarkNoteDrill config={getLandmarkDrill('F')} />,
  },
  {
    id: 'geo.landmark-g',
    title: 'G from the group of 3',
    render: () => <LandmarkNoteDrill config={getLandmarkDrill('G')} />,
  },
  {
    id: 'geo.landmark-a',
    title: 'A from the group of 3',
    render: () => <LandmarkNoteDrill config={getLandmarkDrill('A')} />,
  },
  {
    id: 'geo.landmark-b',
    title: 'B from the group of 3',
    render: () => <LandmarkNoteDrill config={getLandmarkDrill('B')} />,
  },
  {
    id: 'geo.black-position',
    title: 'Black-key random recognition',
    render: () => <BlackKeyNameDrill naming="position" />,
  },
  {
    id: 'geo.black-sharps',
    title: 'Sharp names',
    render: () => <BlackKeyNameDrill naming="sharp" />,
  },
  {
    id: 'geo.black-flats',
    title: 'Flat names',
    render: () => <BlackKeyNameDrill naming="flat" />,
  },
  { id: 'geo.enharmonics', title: 'Sharp ↔ flat equivalents', render: EnharmonicDrill },

  /* ---- L1 · B1.3 — Octave Geography ---- */
  {
    id: 'geo.octave-find-c',
    title: 'Find every C',
    render: () => <OctaveSweepDrill config={getSweepDrill('c')} />,
  },
  {
    id: 'geo.octave-find-f',
    title: 'Find every F',
    render: () => <OctaveSweepDrill config={getSweepDrill('f')} />,
  },
  {
    id: 'geo.octave-c-to-c',
    title: 'C to C — one octave',
    render: () => <OctaveJumpDrill config={getJumpDrill('c-to-c')} />,
  },
  {
    id: 'geo.octave-same-note',
    title: 'Same note across octaves',
    render: () => <OctaveSweepDrill config={getSweepDrill('same-note')} />,
  },
  { id: 'geo.octave-low-high', title: 'Low vs high', render: RegisterCompareDrill },
  {
    id: 'geo.octave-jump',
    title: 'Octave jumps',
    render: () => <OctaveJumpDrill config={getJumpDrill('any')} />,
  },
  { id: 'geo.octave-name', title: 'Random octave recognition', render: OctaveNameDrill },

  /* ---- L1 · B1.4 — Landmark Recognition ---- */
  {
    id: 'geo.landmark-sprint-c',
    title: 'C landmark sprint',
    render: () => <LandmarkSprintDrill config={getSprintDrill('c')} />,
  },
  {
    id: 'geo.landmark-sprint-f',
    title: 'F landmark sprint',
    render: () => <LandmarkSprintDrill config={getSprintDrill('f')} />,
  },
  {
    id: 'geo.landmark-c-block',
    title: 'C → D E',
    render: () => <LandmarkChainDrill config={getChainDrill('c-block')} />,
  },
  {
    id: 'geo.landmark-f-block',
    title: 'F → G A B',
    render: () => <LandmarkChainDrill config={getChainDrill('f-block')} />,
  },
  {
    id: 'geo.landmark-white-run',
    title: 'Landmark → white keys',
    render: () => <LandmarkChainDrill config={getChainDrill('white-run')} />,
  },
  {
    id: 'geo.landmark-black-run',
    title: 'Landmark → black keys',
    render: () => <LandmarkChainDrill config={getChainDrill('black-run')} />,
  },
  {
    id: 'geo.landmark-random',
    title: 'Random landmark drill',
    render: () => <LandmarkSprintDrill config={getSprintDrill('random')} />,
  },

  /* ---- L1 · B1.5 — Random Note Recognition ---- */
  {
    id: 'geo.random-white',
    title: 'Random white note',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('white')} />,
  },
  {
    id: 'geo.random-black',
    title: 'Random black note',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('black')} />,
  },
  {
    id: 'geo.random-sharp',
    title: 'Random sharp note',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('sharp')} />,
  },
  {
    id: 'geo.random-flat',
    title: 'Random flat note',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('flat')} />,
  },
  {
    id: 'geo.random-mixed',
    title: 'Mixed random notes',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('mixed')} />,
  },
  {
    id: 'geo.note-to-key',
    title: 'Note → key',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('to-key')} />,
  },
  {
    id: 'geo.key-to-note',
    title: 'Key → note',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('to-name')} />,
  },
  { id: 'geo.random-sequence', title: 'Random sequence', render: RandomSequenceDrill },
  {
    id: 'geo.no-counting',
    title: 'No-counting drill',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('no-counting')} />,
  },
  {
    id: 'geo.speed-recognition',
    title: 'Speed recognition',
    render: () => <NoteRecognitionDrill config={getRecognitionDrill('speed')} />,
  },

  /* ---- L1 · B1.6 — Distance & Spatial Awareness ---- */
  {
    id: 'geo.distance-same-note',
    title: 'Same-note distance',
    render: () => <DistanceDrill config={getDistanceDrill('same-note')} />,
  },
  {
    id: 'geo.distance-neighbour',
    title: 'Neighbour distance',
    render: () => <DistanceDrill config={getDistanceDrill('neighbour')} />,
  },
  {
    id: 'geo.distance-two',
    title: '2-key jump',
    render: () => <DistanceDrill config={getDistanceDrill('jump-2')} />,
  },
  {
    id: 'geo.distance-three',
    title: '3-key jump',
    render: () => <DistanceDrill config={getDistanceDrill('jump-3')} />,
  },
  {
    id: 'geo.distance-intervals',
    title: 'White-key interval awareness',
    render: () => <DistanceDrill config={getDistanceDrill('intervals')} />,
  },
  {
    id: 'geo.distance-random',
    title: 'Random distance drill',
    render: () => <DistanceDrill config={getDistanceDrill('random')} />,
  },

  /* ---- L1 · B1.7 — Blind / Reduced-Visual Recognition ---- */
  {
    id: 'geo.reach-look-touch',
    title: 'Look → touch',
    render: () => <BlindReachDrill config={getReachDrill('look-touch')} />,
  },
  { id: 'geo.reach-identify', title: 'Touch → identify', render: BlindIdentifyDrill },
  {
    id: 'geo.reach-look-away',
    title: 'Look away → reach',
    render: () => <BlindReachDrill config={getReachDrill('look-away')} />,
  },
  {
    id: 'geo.reach-landmark',
    title: 'Landmark → reach',
    render: () => <BlindReachDrill config={getReachDrill('landmark')} />,
  },
  {
    id: 'geo.reach-random',
    title: 'Random blind reach',
    render: () => <BlindReachDrill config={getReachDrill('random-blind')} />,
  },
  {
    id: 'geo.reach-accuracy',
    title: 'Blind accuracy check',
    render: () => <BlindReachDrill config={getReachDrill('accuracy')} />,
  },

  /* ---- L2 · B2.1 — Finger Awareness ---- */
  {
    id: 'finger.numbers.rh',
    title: 'Finger numbers — right hand',
    render: () => <FingerNumberDrill hand="right" />,
  },
  {
    id: 'finger.numbers.lh',
    title: 'Finger numbers — left hand',
    render: () => <FingerNumberDrill hand="left" />,
  },
  { id: 'finger.tapping', title: 'Finger tapping', render: FingerTappingDrill },
  { id: 'finger.lift', title: 'Finger lift control', render: FingerLiftDrill },
  { id: 'finger.relaxation', title: 'Relaxation cycle', render: RelaxationDrill },
  { id: 'finger.note-to-finger', title: 'Note ↔ finger', render: NoteFingerDrill },
];

const DRILL_INDEX: ReadonlyMap<string, Drill> = new Map(
  REGISTERED_DRILLS.map((drill) => [drill.id, drill]),
);

export function listDrills(): readonly Drill[] {
  return REGISTERED_DRILLS;
}

export function getDrill(id: string | undefined | null): Drill | undefined {
  return id ? DRILL_INDEX.get(id) : undefined;
}
