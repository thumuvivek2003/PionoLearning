import type { ComponentType } from 'react';
import {
  FingerLiftDrill,
  FingerNumberDrill,
  FingerTappingDrill,
  NoteFingerDrill,
  RelaxationDrill,
} from '@/features/finger-training';
import {
  FindKeyDrill,
  KeyNameDrill,
  NaturalSequenceDrill,
  RelationDrill,
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
