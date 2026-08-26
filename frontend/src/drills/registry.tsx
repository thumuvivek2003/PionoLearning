import type { ComponentType } from 'react';
import {
  ChordContestDrill,
  ChordEarDrill,
  ChordRhythmDrill,
  ProgressionDrill,
  TriadBuildDrill,
  TriadQuizDrill,
  getChordContestDrill,
  getChordEarDrill,
  getChordRhythmDrill,
  getProgressionDrill,
  getTriadBuildDrill,
  getTriadQuiz,
} from '@/features/chords-harmony';
import {
  EarModeDrill,
  FormulaDrill,
  ScalePlayDrill,
  ScaleQuizDrill,
  ScaleReadDrill,
  ScaleRecallDrill,
  getEarDrill,
  getFormulaDrill,
  getScalePlayDrill,
  getScaleQuiz,
  getScaleReadDrill,
  getScaleRecallDrill,
} from '@/features/scales-patterns';
import {
  AccuracyDrill,
  DurationDrill,
  MetronomeDrill,
  PhraseDrill,
  PulseDrill,
  getAccuracyDrill,
  getDurationDrill,
  getMetronomeDrill,
  getPhraseDrill,
  getPulseDrill,
} from '@/features/rhythm-timing';
import {
  BlackKeyFocusDrill,
  FingerLiftDrill,
  FingerNumberDrill,
  FingerTappingDrill,
  FivePositionDrill,
  HandRunDrill,
  IntervalJumpDrill,
  MovementChoiceDrill,
  NoteFingerDrill,
  RandomNotesDrill,
  RelaxationDrill,
  RhythmDrill,
  ValidationDrill,
  getBlackKeyDrill,
  getFivePattern,
  getHandRunDrill,
  getIntervalDrill,
  getMovementDrill,
  getRandomNoteDrill,
  getRhythmDrill,
  getValidationDrill,
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

  /* ---- L2 · B2.2 — Five-Finger Position ---- */
  {
    id: 'five.rh-up',
    title: 'RH 1-2-3-4-5',
    render: () => <FivePositionDrill config={getFivePattern('rh-up')} />,
  },
  {
    id: 'five.rh-down',
    title: 'RH 5-4-3-2-1',
    render: () => <FivePositionDrill config={getFivePattern('rh-down')} />,
  },
  {
    id: 'five.lh-up',
    title: 'LH 5-4-3-2-1',
    render: () => <FivePositionDrill config={getFivePattern('lh-up')} />,
  },
  {
    id: 'five.lh-down',
    title: 'LH 1-2-3-4-5',
    render: () => <FivePositionDrill config={getFivePattern('lh-down')} />,
  },
  {
    id: 'five.rh-alternating',
    title: 'RH 1-2-1-2',
    render: () => <FivePositionDrill config={getFivePattern('rh-alternating')} />,
  },
  {
    id: 'five.rh-odd',
    title: 'RH 1-3-5-3-1',
    render: () => <FivePositionDrill config={getFivePattern('rh-odd')} />,
  },
  {
    id: 'five.rh-mixed',
    title: 'RH 2-4-1-3-5',
    render: () => <FivePositionDrill config={getFivePattern('rh-mixed')} />,
  },
  {
    id: 'five.lh-combo',
    title: 'LH 5-3-1-3-5',
    render: () => <FivePositionDrill config={getFivePattern('lh-combo')} />,
  },
  {
    id: 'five.both-same',
    title: 'Both hands together',
    render: () => <FivePositionDrill config={getFivePattern('both-same')} />,
  },
  {
    id: 'five.both-opposite',
    title: 'Opposite directions',
    render: () => <FivePositionDrill config={getFivePattern('both-opposite')} />,
  },

  /* ---- L2 · B2.3 — Finger Independence ---- */
  {
    id: 'indep.non-sequential',
    title: '1-3-2-4-3-5',
    render: () => <FivePositionDrill config={getFivePattern('non-sequential')} />,
  },
  {
    id: 'indep.reverse-irregular',
    title: '5-3-4-2-1',
    render: () => <FivePositionDrill config={getFivePattern('reverse-irregular')} />,
  },
  {
    id: 'indep.randomized',
    title: '1-2-4-3-5 and friends',
    render: () => <FivePositionDrill config={getFivePattern('randomized')} />,
  },
  {
    id: 'indep.skip-fingers',
    title: '1-3-5-2-4',
    render: () => <FivePositionDrill config={getFivePattern('skip-fingers')} />,
  },
  {
    id: 'indep.large-changes',
    title: '2-4-1-5-3',
    render: () => <FivePositionDrill config={getFivePattern('large-changes')} />,
  },
  {
    id: 'indep.repeated',
    title: 'Repeated fingers',
    render: () => <FivePositionDrill config={getFivePattern('repeated')} />,
  },
  {
    id: 'indep.hold-move',
    title: 'Hold + move',
    render: () => <FivePositionDrill config={getFivePattern('hold-move')} />,
  },
  {
    id: 'indep.accents',
    title: 'Accent control',
    render: () => <FivePositionDrill config={getFivePattern('accents')} />,
  },

  /* ---- L2 · B2.4 — Finger Skips & Intervals ---- */
  {
    id: 'skip.one-three',
    title: '1 → 3',
    render: () => <IntervalJumpDrill config={getIntervalDrill('one-three')} />,
  },
  {
    id: 'skip.one-four',
    title: '1 → 4',
    render: () => <IntervalJumpDrill config={getIntervalDrill('one-four')} />,
  },
  {
    id: 'skip.one-five',
    title: '1 → 5',
    render: () => <IntervalJumpDrill config={getIntervalDrill('one-five')} />,
  },
  {
    id: 'skip.stacked-thirds',
    title: '1 → 3 → 5',
    render: () => <IntervalJumpDrill config={getIntervalDrill('stacked-thirds')} />,
  },
  {
    id: 'skip.reverse-thirds',
    title: '5 → 3 → 1',
    render: () => <IntervalJumpDrill config={getIntervalDrill('reverse-thirds')} />,
  },
  {
    id: 'skip.random-two',
    title: 'Random 2-note jumps',
    render: () => <IntervalJumpDrill config={getIntervalDrill('random-two')} />,
  },
  {
    id: 'skip.random-three',
    title: 'Random 3-note jumps',
    render: () => <IntervalJumpDrill config={getIntervalDrill('random-three')} />,
  },
  {
    id: 'skip.transfer',
    title: 'Same fingers, different keys',
    render: () => <IntervalJumpDrill config={getIntervalDrill('transfer')} />,
  },

  /* ---- L2 · B2.5 — Position Shifting ---- */
  {
    id: 'shift.right-1',
    title: 'Shift right by 1',
    render: () => <HandRunDrill config={getHandRunDrill('right-1')} />,
  },
  {
    id: 'shift.right-2',
    title: 'Shift right by 2',
    render: () => <HandRunDrill config={getHandRunDrill('right-2')} />,
  },
  {
    id: 'shift.left-1',
    title: 'Shift left by 1',
    render: () => <HandRunDrill config={getHandRunDrill('left-1')} />,
  },
  {
    id: 'shift.after-5',
    title: 'Shift after 5',
    render: () => <HandRunDrill config={getHandRunDrill('after-5')} />,
  },
  {
    id: 'shift.after-3',
    title: 'Shift after 3',
    render: () => <HandRunDrill config={getHandRunDrill('after-3')} />,
  },
  {
    id: 'shift.random-start',
    title: 'Random starting position',
    render: () => <HandRunDrill config={getHandRunDrill('random-start')} />,
  },
  {
    id: 'shift.recognition',
    title: 'Position recognition',
    render: () => <HandRunDrill config={getHandRunDrill('recognition')} />,
  },
  {
    id: 'shift.silent',
    title: 'Silent repositioning',
    render: () => <HandRunDrill config={getHandRunDrill('silent')} />,
  },

  /* ---- L2 · B2.6 — Thumb Movement ---- */
  {
    id: 'thumb.under',
    title: 'Thumb under',
    render: () => <HandRunDrill config={getHandRunDrill('thumb-under')} />,
  },
  {
    id: 'thumb.beside',
    title: 'Thumb beside the hand',
    render: () => <HandRunDrill config={getHandRunDrill('thumb-beside')} />,
  },
  {
    id: 'thumb.cross-basic',
    title: '1→2→3→1',
    render: () => <HandRunDrill config={getHandRunDrill('cross-basic')} />,
  },
  {
    id: 'thumb.cross-extended',
    title: '1→2→3→4→1',
    render: () => <HandRunDrill config={getHandRunDrill('cross-extended')} />,
  },
  {
    id: 'thumb.reverse-cross',
    title: 'Reverse crossing',
    render: () => <HandRunDrill config={getHandRunDrill('reverse-cross')} />,
  },
  {
    id: 'thumb.slow-cross',
    title: 'Slow crossing',
    render: () => <HandRunDrill config={getHandRunDrill('slow-cross')} />,
  },

  /* ---- L2 · B2.7 — Finger Crossing ---- */
  {
    id: 'cross.basic',
    title: '1-2-3-1',
    render: () => <HandRunDrill config={getHandRunDrill('seven-basic')} />,
  },
  {
    id: 'cross.reverse',
    title: '3-2-1-3',
    render: () => <HandRunDrill config={getHandRunDrill('seven-reverse')} />,
  },
  {
    id: 'cross.extended',
    title: '1-2-3-4-5-1',
    render: () => <HandRunDrill config={getHandRunDrill('seven-extended')} />,
  },
  {
    id: 'cross.scale',
    title: 'Scale fragments',
    render: () => <HandRunDrill config={getHandRunDrill('seven-scale')} />,
  },
  {
    id: 'cross.varied',
    title: 'Crossing after different fingers',
    render: () => <HandRunDrill config={getHandRunDrill('seven-varied')} />,
  },
  {
    id: 'cross.ladder',
    title: 'Slow → medium → fast',
    render: () => <HandRunDrill config={getHandRunDrill('seven-ladder')} />,
  },

  /* ---- L2 · B2.8 — Stretch vs Shift vs Cross ---- */
  {
    id: 'choose.nearby',
    title: 'Nearby note',
    render: () => <MovementChoiceDrill config={getMovementDrill('nearby')} />,
  },
  {
    id: 'choose.reach',
    title: 'Comfortable reach',
    render: () => <MovementChoiceDrill config={getMovementDrill('reach')} />,
  },
  {
    id: 'choose.jump',
    title: 'Large jump',
    render: () => <MovementChoiceDrill config={getMovementDrill('jump')} />,
  },
  {
    id: 'choose.ascending',
    title: 'Continuous ascending notes',
    render: () => <MovementChoiceDrill config={getMovementDrill('ascending')} />,
  },
  {
    id: 'choose.descending',
    title: 'Continuous descending notes',
    render: () => <MovementChoiceDrill config={getMovementDrill('descending')} />,
  },
  {
    id: 'choose.isolated',
    title: 'Random isolated note',
    render: () => <MovementChoiceDrill config={getMovementDrill('isolated')} />,
  },
  {
    id: 'choose.mixed',
    title: 'Long sequence',
    render: () => <MovementChoiceDrill config={getMovementDrill('mixed')} />,
  },

  /* ---- L2 · B2.9 — Black Keys & Finger Geography ---- */
  {
    id: 'black.groups',
    title: 'Black-key recognition',
    render: () => <BlackKeyFocusDrill config={getBlackKeyDrill('groups')} />,
  },
  {
    id: 'black.c-sharp',
    title: 'C♯ / D♭',
    render: () => <BlackKeyFocusDrill config={getBlackKeyDrill('c-sharp')} />,
  },
  {
    id: 'black.d-sharp',
    title: 'D♯ / E♭',
    render: () => <BlackKeyFocusDrill config={getBlackKeyDrill('d-sharp')} />,
  },
  {
    id: 'black.f-sharp',
    title: 'F♯ / G♭',
    render: () => <BlackKeyFocusDrill config={getBlackKeyDrill('f-sharp')} />,
  },
  {
    id: 'black.g-sharp',
    title: 'G♯ / A♭',
    render: () => <BlackKeyFocusDrill config={getBlackKeyDrill('g-sharp')} />,
  },
  {
    id: 'black.a-sharp',
    title: 'A♯ / B♭',
    render: () => <BlackKeyFocusDrill config={getBlackKeyDrill('a-sharp')} />,
  },
  {
    id: 'black.neighbours',
    title: 'Natural + black combinations',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('neighbours')} />,
  },
  {
    id: 'black.random',
    title: 'Random black keys',
    render: () => <BlackKeyFocusDrill config={getBlackKeyDrill('random')} />,
  },

  /* ---- L2 · B2.10 — Random Finger Decisions ---- */
  {
    id: 'decide.naturals',
    title: 'Random natural notes',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('naturals')} />,
  },
  {
    id: 'decide.two',
    title: 'Random 2-note patterns',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('two-note')} />,
  },
  {
    id: 'decide.three',
    title: 'Random 3-note patterns',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('three-note')} />,
  },
  {
    id: 'decide.four',
    title: 'Random 4-note patterns',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('four-note')} />,
  },
  {
    id: 'decide.five',
    title: 'Random 5-note patterns',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('five-note')} />,
  },
  {
    id: 'decide.position',
    title: 'Random starting position',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('random-start')} />,
  },
  {
    id: 'decide.direction',
    title: 'Random direction',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('random-direction')} />,
  },
  {
    id: 'decide.black-white',
    title: 'Random black + white keys',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('black-white')} />,
  },
  {
    id: 'decide.timed',
    title: 'Timed random notes',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('timed')} />,
  },
  {
    id: 'decide.adaptive',
    title: 'Accuracy-first random practice',
    render: () => <RandomNotesDrill config={getRandomNoteDrill('adaptive')} />,
  },

  /* ---- L2 · B2.11 — Rhythm + Finger Technique ---- */
  {
    id: 'rhythm.quarters',
    title: 'Quarter notes',
    render: () => <RhythmDrill config={getRhythmDrill('quarters')} />,
  },
  {
    id: 'rhythm.eighths',
    title: 'Eighth notes',
    render: () => <RhythmDrill config={getRhythmDrill('eighths')} />,
  },
  {
    id: 'rhythm.slow',
    title: 'Metronome slow',
    render: () => <RhythmDrill config={getRhythmDrill('slow')} />,
  },
  {
    id: 'rhythm.ladder',
    title: 'Metronome increase',
    render: () => <RhythmDrill config={getRhythmDrill('ladder')} />,
  },
  {
    id: 'rhythm.rhythms',
    title: 'Same pattern, different rhythms',
    render: () => <RhythmDrill config={getRhythmDrill('rhythms')} />,
  },
  {
    id: 'rhythm.accents',
    title: 'Accent patterns',
    render: () => <RhythmDrill config={getRhythmDrill('accents')} />,
  },

  /* ---- L2 · B2.12 — Muscle-Memory Validation ---- */
  {
    id: 'validate.slow',
    title: 'Extremely slow practice',
    render: () => <ValidationDrill config={getValidationDrill('slow')} />,
  },
  {
    id: 'validate.eyes-open',
    title: 'Eyes-open accuracy',
    render: () => <ValidationDrill config={getValidationDrill('eyes-open')} />,
  },
  {
    id: 'validate.eyes-off',
    title: 'Eyes-off practice',
    render: () => <ValidationDrill config={getValidationDrill('eyes-off')} />,
  },
  {
    id: 'validate.randomized',
    title: 'Randomized patterns',
    render: () => <ValidationDrill config={getValidationDrill('randomized')} />,
  },
  {
    id: 'validate.transposed',
    title: 'Change starting notes',
    render: () => <ValidationDrill config={getValidationDrill('transposed')} />,
  },
  {
    id: 'validate.refingered',
    title: 'Change fingers when appropriate',
    render: () => <ValidationDrill config={getValidationDrill('refingered')} />,
  },
  {
    id: 'validate.review',
    title: 'Record yourself',
    render: () => <ValidationDrill config={getValidationDrill('review')} />,
  },
  {
    id: 'validate.stop-on-errors',
    title: 'Stop on repeated errors',
    render: () => <ValidationDrill config={getValidationDrill('stop-on-errors')} />,
  },

  /* ---- L3 · B3.1 — Pulse & Beat ---- */
  {
    id: 'pulse.understanding',
    title: 'Understanding the beat',
    render: () => <PulseDrill config={getPulseDrill('understanding')} />,
  },
  {
    id: 'pulse.counting',
    title: 'Counting 1 2 3 4',
    render: () => <PulseDrill config={getPulseDrill('counting')} />,
  },
  {
    id: 'pulse.tapping',
    title: 'Foot tapping',
    render: () => <PulseDrill config={getPulseDrill('tapping')} />,
  },
  {
    id: 'pulse.clapping',
    title: 'Hand clapping',
    render: () => <PulseDrill config={getPulseDrill('clapping')} />,
  },
  {
    id: 'pulse.beat-vs-note',
    title: 'Beat vs note',
    render: () => <PulseDrill config={getPulseDrill('beat-vs-note')} />,
  },
  {
    id: 'pulse.silent',
    title: 'Silent beats',
    render: () => <PulseDrill config={getPulseDrill('silent')} />,
  },
  {
    id: 'pulse.accent',
    title: 'Accent on beat 1',
    render: () => <PulseDrill config={getPulseDrill('accent')} />,
  },

  /* ---- L3 · B3.2 — Note Durations ---- */
  {
    id: 'duration.whole',
    title: 'Whole note',
    render: () => <DurationDrill config={getDurationDrill('whole')} />,
  },
  {
    id: 'duration.half',
    title: 'Half note',
    render: () => <DurationDrill config={getDurationDrill('half')} />,
  },
  {
    id: 'duration.quarter',
    title: 'Quarter note',
    render: () => <DurationDrill config={getDurationDrill('quarter')} />,
  },
  {
    id: 'duration.eighth',
    title: 'Eighth notes',
    render: () => <DurationDrill config={getDurationDrill('eighth')} />,
  },
  {
    id: 'duration.sixteenth',
    title: 'Sixteenth notes',
    render: () => <DurationDrill config={getDurationDrill('sixteenth')} />,
  },
  {
    id: 'duration.rests',
    title: 'Note + rest',
    render: () => <DurationDrill config={getDurationDrill('rests')} />,
  },
  {
    id: 'duration.switching',
    title: 'Duration switching',
    render: () => <DurationDrill config={getDurationDrill('switching')} />,
  },
  {
    id: 'duration.hold-release',
    title: 'Hold vs release',
    render: () => <DurationDrill config={getDurationDrill('hold-release')} />,
  },

  /* ---- L3 · B3.3 — Counting & Subdivision ---- */
  {
    id: 'count.basic',
    title: 'Basic counting',
    render: () => <PulseDrill config={getPulseDrill('count-basic')} />,
  },
  {
    id: 'count.eighths',
    title: 'Eighth-note counting',
    render: () => <PulseDrill config={getPulseDrill('count-eighths')} />,
  },
  {
    id: 'count.sixteenths',
    title: 'Sixteenth counting',
    render: () => <PulseDrill config={getPulseDrill('count-sixteenths')} />,
  },
  {
    id: 'count.clap-quarters',
    title: 'Clap quarter notes',
    render: () => <PulseDrill config={getPulseDrill('clap-quarters')} />,
  },
  {
    id: 'count.clap-eighths',
    title: 'Clap eighth notes',
    render: () => <PulseDrill config={getPulseDrill('clap-eighths')} />,
  },
  {
    id: 'count.notes-rests',
    title: 'Alternate notes & rests',
    render: () => <PulseDrill config={getPulseDrill('notes-rests')} />,
  },
  {
    id: 'count.while-playing',
    title: 'Count while playing',
    render: () => <PulseDrill config={getPulseDrill('count-playing')} />,
  },
  {
    id: 'count.internal',
    title: 'Internal counting',
    render: () => <PulseDrill config={getPulseDrill('internal')} />,
  },

  /* ---- L3 · B3.4 — Metronome Training ---- */
  {
    id: 'metro.understanding',
    title: 'Understanding BPM',
    render: () => <MetronomeDrill config={getMetronomeDrill('understanding')} />,
  },
  {
    id: 'metro.40',
    title: '40 BPM',
    render: () => <MetronomeDrill config={getMetronomeDrill('bpm-40')} />,
  },
  {
    id: 'metro.50',
    title: '50 BPM',
    render: () => <MetronomeDrill config={getMetronomeDrill('bpm-50')} />,
  },
  {
    id: 'metro.60',
    title: '60 BPM',
    render: () => <MetronomeDrill config={getMetronomeDrill('bpm-60')} />,
  },
  {
    id: 'metro.80',
    title: '80 BPM',
    render: () => <MetronomeDrill config={getMetronomeDrill('bpm-80')} />,
  },
  {
    id: 'metro.100',
    title: '100 BPM',
    render: () => <MetronomeDrill config={getMetronomeDrill('bpm-100')} />,
  },
  {
    id: 'metro.120',
    title: '120 BPM',
    render: () => <MetronomeDrill config={getMetronomeDrill('bpm-120')} />,
  },
  {
    id: 'metro.ladder',
    title: 'Tempo ladder',
    render: () => <MetronomeDrill config={getMetronomeDrill('ladder')} />,
  },
  {
    id: 'metro.gap',
    title: 'Metronome gap',
    render: () => <MetronomeDrill config={getMetronomeDrill('gap')} />,
  },
  {
    id: 'metro.accuracy',
    title: 'Metronome accuracy',
    render: () => <MetronomeDrill config={getMetronomeDrill('accuracy')} />,
  },

  /* ---- L3 · B3.5 — Rhythm Patterns ---- */
  {
    id: 'pattern.quarters',
    title: 'Four quarter notes',
    render: () => <DurationDrill config={getDurationDrill('four-quarters')} />,
  },
  {
    id: 'pattern.halves',
    title: 'Half + half',
    render: () => <DurationDrill config={getDurationDrill('half-half')} />,
  },
  {
    id: 'pattern.q-h-q',
    title: 'Quarter + half + quarter',
    render: () => <DurationDrill config={getDurationDrill('quarter-half-quarter')} />,
  },
  {
    id: 'pattern.eighth-pairs',
    title: 'Eighth-note pairs',
    render: () => <DurationDrill config={getDurationDrill('eighth-pairs')} />,
  },
  {
    id: 'pattern.quarter-eighths',
    title: 'Quarter + eighths',
    render: () => <DurationDrill config={getDurationDrill('quarter-eighths')} />,
  },
  {
    id: 'pattern.eighth-quarter',
    title: 'Eighth + quarter combinations',
    render: () => <DurationDrill config={getDurationDrill('eighth-quarter')} />,
  },
  {
    id: 'pattern.note-rest',
    title: 'Note + rest patterns',
    render: () => <DurationDrill config={getDurationDrill('note-rest')} />,
  },
  {
    id: 'pattern.random',
    title: 'Random rhythm patterns',
    render: () => <DurationDrill config={getDurationDrill('random')} />,
  },

  /* ---- L3 · B3.6 — Rhythm Accuracy ---- */
  {
    id: 'accuracy.rhythms',
    title: 'Same note, different rhythms',
    render: () => <AccuracyDrill config={getAccuracyDrill('rhythms')} />,
  },
  {
    id: 'accuracy.repeats',
    title: 'Repeated note timing',
    render: () => <AccuracyDrill config={getAccuracyDrill('repeats')} />,
  },
  {
    id: 'accuracy.rushing',
    title: 'Rushing detection',
    render: () => <AccuracyDrill config={getAccuracyDrill('rushing')} />,
  },
  {
    id: 'accuracy.dragging',
    title: 'Dragging detection',
    render: () => <AccuracyDrill config={getAccuracyDrill('dragging')} />,
  },
  {
    id: 'accuracy.evenness',
    title: 'Evenness practice',
    render: () => <AccuracyDrill config={getAccuracyDrill('evenness')} />,
  },
  {
    id: 'accuracy.start',
    title: 'Start on beat',
    render: () => <AccuracyDrill config={getAccuracyDrill('start')} />,
  },
  {
    id: 'accuracy.stop',
    title: 'Stop on beat',
    render: () => <AccuracyDrill config={getAccuracyDrill('stop')} />,
  },
  {
    id: 'accuracy.recover',
    title: 'Recover after mistake',
    render: () => <AccuracyDrill config={getAccuracyDrill('recover')} />,
  },

  /* ---- L3 · B3.7 — Practical Keyboard Rhythm ---- */
  {
    id: 'phrase.single',
    title: 'Single-note rhythm',
    render: () => <PhraseDrill config={getPhraseDrill('single-note')} />,
  },
  {
    id: 'phrase.two',
    title: '2-note patterns',
    render: () => <PhraseDrill config={getPhraseDrill('two-note')} />,
  },
  {
    id: 'phrase.three',
    title: '3-note patterns',
    render: () => <PhraseDrill config={getPhraseDrill('three-note')} />,
  },
  {
    id: 'phrase.four',
    title: '4-note patterns',
    render: () => <PhraseDrill config={getPhraseDrill('four-note')} />,
  },
  {
    id: 'phrase.melody',
    title: 'Simple melody + metronome',
    render: () => <PhraseDrill config={getPhraseDrill('melody')} />,
  },
  {
    id: 'phrase.melody-counting',
    title: 'Melody with counting',
    render: () => <PhraseDrill config={getPhraseDrill('melody-counting')} />,
  },
  {
    id: 'phrase.melody-internal',
    title: 'Melody without counting',
    render: () => <PhraseDrill config={getPhraseDrill('melody-internal')} />,
  },
  {
    id: 'phrase.review',
    title: 'Record & review',
    render: () => <PhraseDrill config={getPhraseDrill('review')} />,
  },

  /* ---- L3 · B3.8 — Contest-Level Timing ---- */
  {
    id: 'contest.count-in',
    title: 'Start with count-in',
    render: () => <PhraseDrill config={getPhraseDrill('count-in')} />,
  },
  {
    id: 'contest.consistent',
    title: 'Consistent tempo',
    render: () => <PhraseDrill config={getPhraseDrill('consistent')} />,
  },
  {
    id: 'contest.mistakes',
    title: 'Playing through mistakes',
    render: () => <PhraseDrill config={getPhraseDrill('through-mistakes')} />,
  },
  {
    id: 'contest.tempos',
    title: 'Different tempos',
    render: () => <PhraseDrill config={getPhraseDrill('tempos')} />,
  },
  {
    id: 'contest.no-metronome',
    title: 'No-metronome test',
    render: () => <PhraseDrill config={getPhraseDrill('no-metronome')} />,
  },
  {
    id: 'contest.return',
    title: 'Metronome return test',
    render: () => <PhraseDrill config={getPhraseDrill('return-test')} />,
  },
  {
    id: 'contest.performance',
    title: 'Performance practice',
    render: () => <PhraseDrill config={getPhraseDrill('performance')} />,
  },
  {
    id: 'contest.mock',
    title: 'Mock contest performance',
    render: () => <PhraseDrill config={getPhraseDrill('mock')} />,
  },


  /* ---- L4 · B4.1 — Major Scale Formula ---- */
  {
    id: 'scale.whole-step',
    title: 'Whole step',
    render: () => <ScaleQuizDrill config={getScaleQuiz('whole')} />,
  },
  {
    id: 'scale.half-step',
    title: 'Half step',
    render: () => <ScaleQuizDrill config={getScaleQuiz('half')} />,
  },
  {
    id: 'scale.formula',
    title: 'W-W-H-W-W-W-H formula',
    render: () => <FormulaDrill config={getFormulaDrill('formula')} />,
  },
  {
    id: 'scale.any-note',
    title: 'Formula from any note',
    render: () => <FormulaDrill config={getFormulaDrill('any-note')} />,
  },
  {
    id: 'scale.on-keyboard',
    title: 'Formula on the keyboard',
    render: () => <FormulaDrill config={getFormulaDrill('keyboard')} />,
  },
  {
    id: 'scale.construct',
    title: 'Scale construction drill',
    render: () => <FormulaDrill config={getFormulaDrill('construct')} />,
  },

  /* ---- L4 · B4.2 — C Major Scale ---- */
  {
    id: 'cmajor.notes',
    title: 'C major notes',
    render: () => <ScaleQuizDrill config={getScaleQuiz('c-notes')} />,
  },
  {
    id: 'cmajor.formula',
    title: 'C major formula',
    render: () => <FormulaDrill config={getFormulaDrill('c-formula')} />,
  },
  {
    id: 'cmajor.rh',
    title: 'RH C major',
    render: () => <ScalePlayDrill config={getScalePlayDrill('rh-c')} />,
  },
  {
    id: 'cmajor.lh',
    title: 'LH C major',
    render: () => <ScalePlayDrill config={getScalePlayDrill('lh-c')} />,
  },
  {
    id: 'cmajor.together',
    title: 'Hands together — C',
    render: () => <ScalePlayDrill config={getScalePlayDrill('together-c')} />,
  },
  {
    id: 'cmajor.slow',
    title: 'Slow scale practice',
    render: () => <ScalePlayDrill config={getScalePlayDrill('slow')} />,
  },
  {
    id: 'cmajor.random-start',
    title: 'Random start practice',
    render: () => <ScalePlayDrill config={getScalePlayDrill('random-start')} />,
  },

  /* ---- L4 · B4.3 — G Major Scale ---- */
  {
    id: 'gmajor.notes',
    title: 'G major notes',
    render: () => <ScaleQuizDrill config={getScaleQuiz('g-notes')} />,
  },
  {
    id: 'gmajor.f-sharp',
    title: 'F# recognition',
    render: () => <ScaleQuizDrill config={getScaleQuiz('f-sharp')} />,
  },
  {
    id: 'gmajor.formula',
    title: 'G major formula',
    render: () => <FormulaDrill config={getFormulaDrill('g-formula')} />,
  },
  {
    id: 'gmajor.rh',
    title: 'RH G major',
    render: () => <ScalePlayDrill config={getScalePlayDrill('rh-g')} />,
  },
  {
    id: 'gmajor.lh',
    title: 'LH G major',
    render: () => <ScalePlayDrill config={getScalePlayDrill('lh-g')} />,
  },
  {
    id: 'gmajor.together',
    title: 'Hands together — G',
    render: () => <ScalePlayDrill config={getScalePlayDrill('together-g')} />,
  },
  {
    id: 'gmajor.compare',
    title: 'C → G comparison',
    render: () => <ScaleQuizDrill config={getScaleQuiz('c-g')} />,
  },

  /* ---- L4 · B4.4 — F Major Scale ---- */
  {
    id: 'fmajor.notes',
    title: 'F major notes',
    render: () => <ScaleQuizDrill config={getScaleQuiz('f-notes')} />,
  },
  {
    id: 'fmajor.b-flat',
    title: 'Bb recognition',
    render: () => <ScaleQuizDrill config={getScaleQuiz('b-flat')} />,
  },
  {
    id: 'fmajor.formula',
    title: 'F major formula',
    render: () => <FormulaDrill config={getFormulaDrill('f-formula')} />,
  },
  {
    id: 'fmajor.rh',
    title: 'RH F major',
    render: () => <ScalePlayDrill config={getScalePlayDrill('rh-f')} />,
  },
  {
    id: 'fmajor.lh',
    title: 'LH F major',
    render: () => <ScalePlayDrill config={getScalePlayDrill('lh-f')} />,
  },
  {
    id: 'fmajor.together',
    title: 'Hands together — F',
    render: () => <ScalePlayDrill config={getScalePlayDrill('together-f')} />,
  },
  {
    id: 'fmajor.compare',
    title: 'C → G → F comparison',
    render: () => <ScaleQuizDrill config={getScaleQuiz('c-g-f')} />,
  },

  /* ---- L4 · B4.5 — Major Scale Family ---- */
  {
    id: 'family.c',
    title: 'C major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-c')} />,
  },
  {
    id: 'family.g',
    title: 'G major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-g')} />,
  },
  {
    id: 'family.d',
    title: 'D major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-d')} />,
  },
  {
    id: 'family.a',
    title: 'A major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-a')} />,
  },
  {
    id: 'family.e',
    title: 'E major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-e')} />,
  },
  {
    id: 'family.b',
    title: 'B major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-b')} />,
  },
  {
    id: 'family.f',
    title: 'F major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-f')} />,
  },
  {
    id: 'family.bb',
    title: 'Bb major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-bb')} />,
  },
  {
    id: 'family.eb',
    title: 'Eb major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-eb')} />,
  },
  {
    id: 'family.ab',
    title: 'Ab major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-ab')} />,
  },
  {
    id: 'family.db',
    title: 'Db major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('family-db')} />,
  },
  {
    id: 'family.sharp-order',
    title: 'Sharp-key order',
    render: () => <ScaleQuizDrill config={getScaleQuiz('sharp-order')} />,
  },
  {
    id: 'family.flat-order',
    title: 'Flat-key order',
    render: () => <ScaleQuizDrill config={getScaleQuiz('flat-order')} />,
  },
  {
    id: 'family.random',
    title: 'Random major scale',
    render: () => <FormulaDrill config={getFormulaDrill('family-random')} />,
  },

  /* ---- L4 · B4.6 — Minor Scale Foundation ---- */
  {
    id: 'minor.sound',
    title: 'Major vs minor sound',
    render: () => <EarModeDrill config={getEarDrill('major-minor')} />,
  },
  {
    id: 'minor.formula',
    title: 'Natural minor formula',
    render: () => <FormulaDrill config={getFormulaDrill('minor-formula')} />,
  },
  {
    id: 'minor.relative',
    title: 'Relative minor concept',
    render: () => <ScaleQuizDrill config={getScaleQuiz('relative-concept')} />,
  },
  {
    id: 'minor.sixth',
    title: 'Relative minor from major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('relative-sixth')} />,
  },
  {
    id: 'minor.build',
    title: 'Minor scale construction',
    render: () => <FormulaDrill config={getFormulaDrill('minor-build')} />,
  },

  /* ---- L4 · B4.7 — A Minor Scale ---- */
  {
    id: 'aminor.notes',
    title: 'A minor notes',
    render: () => <ScaleQuizDrill config={getScaleQuiz('a-minor-notes')} />,
  },
  {
    id: 'aminor.formula',
    title: 'A minor formula',
    render: () => <FormulaDrill config={getFormulaDrill('a-minor-formula')} />,
  },
  {
    id: 'aminor.vs-c',
    title: 'A minor vs C major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('a-minor-vs-c')} />,
  },
  {
    id: 'aminor.rh',
    title: 'RH A minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('rh-am')} />,
  },
  {
    id: 'aminor.lh',
    title: 'LH A minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('lh-am')} />,
  },
  {
    id: 'aminor.together',
    title: 'Hands together — A minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('together-am')} />,
  },

  /* ---- L4 · B4.8 — E Minor Scale ---- */
  {
    id: 'eminor.notes',
    title: 'E minor notes',
    render: () => <ScaleQuizDrill config={getScaleQuiz('e-minor-notes')} />,
  },
  {
    id: 'eminor.formula',
    title: 'E minor formula',
    render: () => <FormulaDrill config={getFormulaDrill('e-minor-formula')} />,
  },
  {
    id: 'eminor.vs-g',
    title: 'E minor vs G major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('e-minor-vs-g')} />,
  },
  {
    id: 'eminor.rh',
    title: 'RH E minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('rh-em')} />,
  },
  {
    id: 'eminor.lh',
    title: 'LH E minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('lh-em')} />,
  },
  {
    id: 'eminor.together',
    title: 'Hands together — E minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('together-em')} />,
  },
  /* ---- L4 · B4.9 — D Minor Scale ---- */
  {
    id: 'dminor.notes',
    title: 'D minor notes',
    render: () => <ScaleQuizDrill config={getScaleQuiz('d-minor-notes')} />,
  },
  {
    id: 'dminor.formula',
    title: 'D minor formula',
    render: () => <FormulaDrill config={getFormulaDrill('d-minor-formula')} />,
  },
  {
    id: 'dminor.vs-f',
    title: 'D minor vs F major',
    render: () => <ScaleQuizDrill config={getScaleQuiz('d-minor-vs-f')} />,
  },
  {
    id: 'dminor.rh',
    title: 'RH D minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('rh-dm')} />,
  },
  {
    id: 'dminor.lh',
    title: 'LH D minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('lh-dm')} />,
  },
  {
    id: 'dminor.together',
    title: 'Hands together — D minor',
    render: () => <ScalePlayDrill config={getScalePlayDrill('together-dm')} />,
  },

  /* ---- L4 · B4.10 — Scale Pattern Recognition ---- */
  {
    id: 'pattern.start-note',
    title: 'Identify starting note',
    render: () => <ScaleReadDrill config={getScaleReadDrill('start-note')} />,
  },
  {
    id: 'pattern.accidentals',
    title: 'Identify accidentals',
    render: () => <ScaleReadDrill config={getScaleReadDrill('spot-accidentals')} />,
  },
  {
    id: 'pattern.missing',
    title: 'Missing note drill',
    render: () => <ScaleReadDrill config={getScaleReadDrill('missing-note')} />,
  },
  {
    id: 'pattern.ascending',
    title: 'Ascending pattern',
    render: () => <ScaleReadDrill config={getScaleReadDrill('ascending')} />,
  },
  {
    id: 'pattern.descending',
    title: 'Descending pattern',
    render: () => <ScaleReadDrill config={getScaleReadDrill('descending')} />,
  },
  {
    id: 'pattern.key-to-scale',
    title: 'Random key → scale',
    render: () => <FormulaDrill config={getFormulaDrill('key-to-scale')} />,
  },
  {
    id: 'pattern.scale-to-key',
    title: 'Scale → key',
    render: () => <ScaleReadDrill config={getScaleReadDrill('scale-to-key')} />,
  },
  {
    id: 'pattern.quality',
    title: 'Major vs minor',
    render: () => <ScaleReadDrill config={getScaleReadDrill('major-or-minor')} />,
  },

  /* ---- L4 · B4.11 — Scale Playing Technique ---- */
  {
    id: 'technique.fingers',
    title: 'Finger numbering',
    render: () => <ScalePlayDrill config={getScalePlayDrill('finger-numbers')} />,
  },
  {
    id: 'technique.thumb',
    title: 'Thumb tuck',
    render: () => <ScalePlayDrill config={getScalePlayDrill('thumb-tuck')} />,
  },
  {
    id: 'technique.crossing',
    title: 'Finger crossing',
    render: () => <ScalePlayDrill config={getScalePlayDrill('finger-crossing')} />,
  },
  {
    id: 'technique.even',
    title: 'Even notes',
    render: () => <ScalePlayDrill config={getScalePlayDrill('even-notes')} />,
  },
  {
    id: 'technique.speed',
    title: 'Slow → fast',
    render: () => <ScalePlayDrill config={getScalePlayDrill('slow-fast')} />,
  },
  {
    id: 'technique.metronome',
    title: 'Metronome practice',
    render: () => <ScalePlayDrill config={getScalePlayDrill('metronome')} />,
  },
  {
    id: 'technique.accents',
    title: 'Accent-free playing',
    render: () => <ScalePlayDrill config={getScalePlayDrill('accent-free')} />,
  },
  {
    id: 'technique.both-ways',
    title: 'Ascending + descending',
    render: () => <ScalePlayDrill config={getScalePlayDrill('up-and-down')} />,
  },

  /* ---- L4 · B4.12 — Scale Recall & Random-Key Practice ---- */
  {
    id: 'recall.key',
    title: 'Random key recognition',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('key-recognition')} />,
  },
  {
    id: 'recall.name',
    title: 'Name the scale notes',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('name-notes')} />,
  },
  {
    id: 'recall.find',
    title: 'Find notes on keyboard',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('find-notes')} />,
  },
  {
    id: 'recall.blind',
    title: 'Play without looking',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('play-blind')} />,
  },
  {
    id: 'recall.ascending',
    title: 'Ascending challenge',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('ascending-challenge')} />,
  },
  {
    id: 'recall.descending',
    title: 'Descending challenge',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('descending-challenge')} />,
  },
  {
    id: 'recall.quality',
    title: 'Major/minor challenge',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('quality-challenge')} />,
  },
  {
    id: 'recall.timed',
    title: 'Timed scale challenge',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('timed-challenge')} />,
  },
  {
    id: 'recall.correction',
    title: 'Mistake correction',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('mistake-correction')} />,
  },
  {
    id: 'recall.contest',
    title: 'Contest simulation',
    render: () => <ScaleRecallDrill config={getScaleRecallDrill('contest-simulation')} />,
  },

  /* ---- L5 · B5.1 — Triads & Chord Formula ---- */
  {
    id: 'triad.chord',
    title: 'What is a chord?',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('what-is-a-chord')} />,
  },
  {
    id: 'triad.concept',
    title: 'Triad concept',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('triad-concept')} />,
  },
  {
    id: 'triad.degrees',
    title: 'Scale degrees',
    render: () => <TriadQuizDrill config={getTriadQuiz('scale-degrees')} />,
  },
  {
    id: 'triad.major',
    title: 'Major triad formula',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('major-formula')} />,
  },
  {
    id: 'triad.minor',
    title: 'Minor triad formula',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('minor-formula')} />,
  },
  {
    id: 'triad.compare',
    title: 'Major vs minor',
    render: () => <TriadQuizDrill config={getTriadQuiz('major-vs-minor')} />,
  },
  {
    id: 'triad.construct',
    title: 'Triad construction drill',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('construction-drill')} />,
  },
  {
    id: 'triad.recognise',
    title: 'Triad recognition',
    render: () => <TriadQuizDrill config={getTriadQuiz('triad-recognition')} />,
  },


  /* ---- L5 · B5.2 — Major Chords ---- */
  {
    id: 'major.c',
    title: 'C major chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('c-major')} />,
  },
  {
    id: 'major.d',
    title: 'D major chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('d-major')} />,
  },
  {
    id: 'major.e',
    title: 'E major chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('e-major')} />,
  },
  {
    id: 'major.f',
    title: 'F major chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('f-major')} />,
  },
  {
    id: 'major.g',
    title: 'G major chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('g-major')} />,
  },
  {
    id: 'major.a',
    title: 'A major chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('a-major')} />,
  },
  {
    id: 'major.b',
    title: 'B major chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('b-major')} />,
  },
  {
    id: 'major.sharps',
    title: 'Sharp major chords',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('black-major')} />,
  },
  {
    id: 'major.flats',
    title: 'Flat naming',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('flat-naming')} />,
  },
  {
    id: 'major.twelve',
    title: '12 major chord drill',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('twelve-major')} />,
  },

  /* ---- L5 · B5.3 — Minor Chords ---- */
  {
    id: 'minor.c',
    title: 'C minor chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('c-minor')} />,
  },
  {
    id: 'minor.d',
    title: 'D minor chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('d-minor')} />,
  },
  {
    id: 'minor.e',
    title: 'E minor chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('e-minor')} />,
  },
  {
    id: 'minor.f',
    title: 'F minor chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('f-minor')} />,
  },
  {
    id: 'minor.g',
    title: 'G minor chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('g-minor')} />,
  },
  {
    id: 'minor.a',
    title: 'A minor chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('a-minor')} />,
  },
  {
    id: 'minor.b',
    title: 'B minor chord',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('b-minor')} />,
  },
  {
    id: 'minor.blackkeys',
    title: 'Sharp/flat minor chords',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('black-minor')} />,
  },
  {
    id: 'minor.switch',
    title: 'Major vs minor drill',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('quality-switch')} />,
  },
  {
    id: 'minor.twelve',
    title: '12 minor chord drill',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('twelve-minor')} />,
  },


  /* ---- L5 · B5.4 — Chord Inversions ---- */
  {
    id: 'inv.root',
    title: 'Root position',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('position-0')} />,
  },
  {
    id: 'inv.first',
    title: '1st inversion',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('position-1')} />,
  },
  {
    id: 'inv.second',
    title: '2nd inversion',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('position-2')} />,
  },
  {
    id: 'inv.recognise',
    title: 'Inversion recognition',
    render: () => <TriadQuizDrill config={getTriadQuiz('inversion-recognition')} />,
  },
  {
    id: 'inv.major',
    title: 'Major chord inversions',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('positions-major')} />,
  },
  {
    id: 'inv.minor',
    title: 'Minor chord inversions',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('positions-minor')} />,
  },
  {
    id: 'inv.switching',
    title: 'Inversion switching',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('inversion-switching')} />,
  },
  {
    id: 'inv.same',
    title: 'Same chord, different position',
    render: () => <TriadQuizDrill config={getTriadQuiz('same-chord')} />,
  },
  {
    id: 'inv.movement',
    title: 'Minimal movement drill',
    render: () => <ProgressionDrill config={getProgressionDrill('minimal-movement')} />,
  },
  {
    id: 'inv.random',
    title: 'Random inversion drill',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('random-inversion')} />,
  },

  /* ---- L5 · B5.5 — 7th Chords ---- */
  {
    id: 'seventh.what',
    title: 'What is a 7th chord?',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('what-is-a-seventh')} />,
  },
  {
    id: 'seventh.maj',
    title: 'Major 7',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('maj7-formula')} />,
  },
  {
    id: 'seventh.dom',
    title: 'Dominant 7',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('dom7-formula')} />,
  },
  {
    id: 'seventh.min',
    title: 'Minor 7',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('min7-formula')} />,
  },
  {
    id: 'seventh.maj-practice',
    title: 'Major 7 practice',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('maj7-mastery')} />,
  },
  {
    id: 'seventh.dom-practice',
    title: 'Dominant 7 practice',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('dom7-mastery')} />,
  },
  {
    id: 'seventh.min-practice',
    title: 'Minor 7 practice',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('min7-mastery')} />,
  },
  {
    id: 'seventh.compare',
    title: '7th chord comparison',
    render: () => <TriadQuizDrill config={getTriadQuiz('seventh-comparison')} />,
  },
  {
    id: 'seventh.inversions',
    title: '7th chord inversions',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('seventh-inversions')} />,
  },
  {
    id: 'seventh.random',
    title: 'Random 7th drill',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('random-seventh')} />,
  },


  /* ---- L5 · B5.6 — Diatonic Chords ---- */
  {
    id: 'dia.family',
    title: 'Chords from a major scale',
    render: () => <ProgressionDrill config={getProgressionDrill('family-build')} />,
  },
  {
    id: 'dia.i',
    title: 'I chord',
    render: () => <ProgressionDrill config={getProgressionDrill('degree-I')} />,
  },
  {
    id: 'dia.ii',
    title: 'ii chord',
    render: () => <ProgressionDrill config={getProgressionDrill('degree-ii')} />,
  },
  {
    id: 'dia.iii',
    title: 'iii chord',
    render: () => <ProgressionDrill config={getProgressionDrill('degree-iii')} />,
  },
  {
    id: 'dia.iv',
    title: 'IV chord',
    render: () => <ProgressionDrill config={getProgressionDrill('degree-IV')} />,
  },
  {
    id: 'dia.v',
    title: 'V chord',
    render: () => <ProgressionDrill config={getProgressionDrill('degree-V')} />,
  },
  {
    id: 'dia.vi',
    title: 'vi chord',
    render: () => <ProgressionDrill config={getProgressionDrill('degree-vi')} />,
  },
  {
    id: 'dia.vii',
    title: 'vii° chord',
    render: () => <ProgressionDrill config={getProgressionDrill('degree-vii°')} />,
  },
  {
    id: 'dia.numerals',
    title: 'Roman numerals',
    render: () => <TriadQuizDrill config={getTriadQuiz('roman-numerals')} />,
  },
  {
    id: 'dia.cfamily',
    title: 'C major chord family',
    render: () => <ProgressionDrill config={getProgressionDrill('chord-family')} />,
  },

  /* ---- L5 · B5.7 — Chord Progressions ---- */
  {
    id: 'prog.i-iv-v',
    title: 'I-IV-V',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-i-iv-v')} />,
  },
  {
    id: 'prog.i-v-i',
    title: 'I-V-I',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-i-v-i')} />,
  },
  {
    id: 'prog.i-v-vi-iv',
    title: 'I-V-vi-IV',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-i-v-vi-iv')} />,
  },
  {
    id: 'prog.vi-iv-i-v',
    title: 'vi-IV-I-V',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-vi-iv-i-v')} />,
  },
  {
    id: 'prog.i-vi-iv-v',
    title: 'I-vi-IV-V',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-i-vi-iv-v')} />,
  },
  {
    id: 'prog.ii-v-i',
    title: 'ii-V-I',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-ii-v-i')} />,
  },
  {
    id: 'prog.iv-v-i',
    title: 'IV-V-I',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-iv-v-i')} />,
  },
  {
    id: 'prog.keys',
    title: 'Progressions in different keys',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-keys')} />,
  },
  {
    id: 'prog.listen',
    title: 'Progression recognition',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-listen')} />,
  },
  {
    id: 'prog.random',
    title: 'Random progression drill',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-random')} />,
  },


  /* ---- L5 · B5.8 — Chord Changes & Rhythm ---- */
  {
    id: 'rhy.one',
    title: 'One chord per bar',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('one-per-bar')} />,
  },
  {
    id: 'rhy.two',
    title: 'Two chords per bar',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('two-per-bar')} />,
  },
  {
    id: 'rhy.metronome',
    title: 'Metronome chord practice',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('metronome')} />,
  },
  {
    id: 'rhy.whole',
    title: 'Whole-note chords',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('whole-notes')} />,
  },
  {
    id: 'rhy.half',
    title: 'Half-note chords',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('half-notes')} />,
  },
  {
    id: 'rhy.quarter',
    title: 'Quarter-note chords',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('quarter-notes')} />,
  },
  {
    id: 'rhy.melody',
    title: 'Chord + melody',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('chord-melody')} />,
  },
  {
    id: 'rhy.smooth',
    title: 'Smooth chord transitions',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('smooth')} />,
  },
  {
    id: 'rhy.loop',
    title: 'Progression loop',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('loop')} />,
  },
  {
    id: 'rhy.speed',
    title: 'Speed drill',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('speed')} />,
  },

  /* ---- L5 · B5.9 — Chord Ear Training ---- */
  {
    id: 'ear.quality',
    title: 'Major vs minor',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-quality')} />,
  },
  {
    id: 'ear.root',
    title: 'Root note recognition',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-root')} />,
  },
  {
    id: 'ear.bass',
    title: 'Chord bass recognition',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-bass')} />,
  },
  {
    id: 'ear.position',
    title: 'Root position vs inversion',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-position')} />,
  },
  {
    id: 'ear.function',
    title: 'I vs IV vs V',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-function')} />,
  },
  {
    id: 'ear.major-prog',
    title: 'Major progression recognition',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-predict')} />,
  },
  {
    id: 'ear.minor-prog',
    title: 'Minor progression recognition',
    render: () => <ProgressionDrill config={getProgressionDrill('prog-minor')} />,
  },
  {
    id: 'ear.qualities',
    title: 'Chord quality drill',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-qualities')} />,
  },
  {
    id: 'ear.recall',
    title: 'Sing the root',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-recall')} />,
  },
  {
    id: 'ear.random',
    title: 'Random chord quiz',
    render: () => <ChordEarDrill config={getChordEarDrill('ear-everything')} />,
  },


  /* ---- L5 · B5.10 — Practical Song Application ---- */
  {
    id: 'song.two',
    title: 'Simple 2-chord songs',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('song-two')} />,
  },
  {
    id: 'song.three',
    title: '3-chord songs',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('song-three')} />,
  },
  {
    id: 'song.four',
    title: '4-chord songs',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('song-four')} />,
  },
  {
    id: 'song.melody',
    title: 'Chord + melody',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('song-melody')} />,
  },
  {
    id: 'song.patterns',
    title: 'Chord rhythm patterns',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('song-patterns')} />,
  },
  {
    id: 'song.inversions',
    title: 'Inversion-based accompaniment',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('song-inversions')} />,
  },
  {
    id: 'song.transpose',
    title: 'Transpose a song',
    render: () => <ProgressionDrill config={getProgressionDrill('song-transpose')} />,
  },
  {
    id: 'song.blind',
    title: 'Play without looking',
    render: () => <ChordRhythmDrill config={getChordRhythmDrill('song-blind')} />,
  },
  {
    id: 'song.random',
    title: 'Random chord challenge',
    render: () => <TriadBuildDrill config={getTriadBuildDrill('song-random')} />,
  },
  {
    id: 'song.contest',
    title: 'Contest simulation',
    render: () => <ChordContestDrill config={getChordContestDrill('chord-contest')} />,
  },
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
