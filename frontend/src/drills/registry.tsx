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
  EnharmonicDrill,
  FindKeyDrill,
  KeyNameDrill,
  LandmarkNoteDrill,
  NaturalSequenceDrill,
  RelationDrill,
  getGroupDrill,
  getLandmarkDrill,
  getRelationDrill,
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
