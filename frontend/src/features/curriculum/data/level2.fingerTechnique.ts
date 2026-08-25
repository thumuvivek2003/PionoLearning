import { defineLevel } from './defineLevel';

/** L2 — fingers 1–5 under control: independence, shifts, thumb crossings. */
export const level2 = defineLevel({
  order: 2,
  emoji: '🖐️',
  title: 'Finger Technique',
  summary:
    'Fingers 1–5 under control — independence, five-finger positions, shifts, thumb crossings and muscle memory.',
  buckets: [
    {
      // Built: brain → finger → key → relax, before any playing.
      title: 'Finger Awareness',
      practices: [
        {
          title: 'Finger numbering — RH',
          activity: { kind: 'drill', drillId: 'finger.numbers.rh' },
        },
        {
          title: 'Finger numbering — LH',
          activity: { kind: 'drill', drillId: 'finger.numbers.lh' },
        },
        { title: 'Finger tapping', activity: { kind: 'drill', drillId: 'finger.tapping' } },
        { title: 'Finger lift control', activity: { kind: 'drill', drillId: 'finger.lift' } },
        { title: 'Finger relaxation', activity: { kind: 'drill', drillId: 'finger.relaxation' } },
        {
          title: 'Finger-to-key awareness',
          activity: { kind: 'drill', drillId: 'finger.note-to-finger' },
        },
      ],
    },
    {
      // Built: home position both hands, then patterns that break the 1-2-3-4-5 habit.
      title: 'Five-Finger Position',
      practices: [
        { title: 'RH 1-2-3-4-5', activity: { kind: 'drill', drillId: 'five.rh-up' } },
        { title: 'RH reverse', activity: { kind: 'drill', drillId: 'five.rh-down' } },
        { title: 'LH 5-4-3-2-1', activity: { kind: 'drill', drillId: 'five.lh-up' } },
        { title: 'LH reverse', activity: { kind: 'drill', drillId: 'five.lh-down' } },
        {
          title: 'RH alternating',
          activity: { kind: 'drill', drillId: 'five.rh-alternating' },
        },
        { title: 'RH odd fingers', activity: { kind: 'drill', drillId: 'five.rh-odd' } },
        { title: 'RH even/odd', activity: { kind: 'drill', drillId: 'five.rh-mixed' } },
        { title: 'LH combinations', activity: { kind: 'drill', drillId: 'five.lh-combo' } },
        {
          title: 'Both hands together',
          activity: { kind: 'drill', drillId: 'five.both-same' },
        },
        {
          title: 'Opposite directions',
          activity: { kind: 'drill', drillId: 'five.both-opposite' },
        },
      ],
    },
    {
      // Built: one finger answers, the other four stay calm.
      title: 'Finger Independence',
      practices: [
        { title: '1-3-2-4-3-5', activity: { kind: 'drill', drillId: 'indep.non-sequential' } },
        { title: '5-3-4-2-1', activity: { kind: 'drill', drillId: 'indep.reverse-irregular' } },
        { title: '1-2-4-3-5', activity: { kind: 'drill', drillId: 'indep.randomized' } },
        { title: '1-3-5-2-4', activity: { kind: 'drill', drillId: 'indep.skip-fingers' } },
        { title: '2-4-1-5-3', activity: { kind: 'drill', drillId: 'indep.large-changes' } },
        { title: 'Repeated fingers', activity: { kind: 'drill', drillId: 'indep.repeated' } },
        { title: 'Hold + move', activity: { kind: 'drill', drillId: 'indep.hold-move' } },
        { title: 'Accent control', activity: { kind: 'drill', drillId: 'indep.accents' } },
      ],
    },
    {
      // Built: distance under the hand, from anywhere on the board.
      title: 'Finger Skips & Intervals',
      practices: [
        { title: '1→3', activity: { kind: 'drill', drillId: 'skip.one-three' } },
        { title: '1→4', activity: { kind: 'drill', drillId: 'skip.one-four' } },
        { title: '1→5', activity: { kind: 'drill', drillId: 'skip.one-five' } },
        { title: '1→3→5', activity: { kind: 'drill', drillId: 'skip.stacked-thirds' } },
        { title: '5→3→1', activity: { kind: 'drill', drillId: 'skip.reverse-thirds' } },
        {
          title: 'Random 2-note jumps',
          activity: { kind: 'drill', drillId: 'skip.random-two' },
        },
        {
          title: 'Random 3-note jumps',
          activity: { kind: 'drill', drillId: 'skip.random-three' },
        },
        {
          title: 'Same fingers, different keys',
          activity: { kind: 'drill', drillId: 'skip.transfer' },
        },
      ],
    },
    {
      // Built: move the hand to the note rather than stretching a finger at it.
      title: 'Position Shifting',
      practices: [
        { title: 'Shift right by 1', activity: { kind: 'drill', drillId: 'shift.right-1' } },
        { title: 'Shift right by 2', activity: { kind: 'drill', drillId: 'shift.right-2' } },
        { title: 'Shift left by 1', activity: { kind: 'drill', drillId: 'shift.left-1' } },
        { title: 'Shift after 5', activity: { kind: 'drill', drillId: 'shift.after-5' } },
        { title: 'Shift after 3', activity: { kind: 'drill', drillId: 'shift.after-3' } },
        {
          title: 'Random starting position',
          activity: { kind: 'drill', drillId: 'shift.random-start' },
        },
        {
          title: 'Position recognition',
          activity: { kind: 'drill', drillId: 'shift.recognition' },
        },
        {
          title: 'Silent repositioning',
          activity: { kind: 'drill', drillId: 'shift.silent' },
        },
      ],
    },
    {
      // Built: the thumb changes position quietly so the hand can keep going.
      title: 'Thumb Movement',
      practices: [
        { title: 'Thumb under', activity: { kind: 'drill', drillId: 'thumb.under' } },
        { title: 'Thumb beside hand', activity: { kind: 'drill', drillId: 'thumb.beside' } },
        { title: '1→2→3→1', activity: { kind: 'drill', drillId: 'thumb.cross-basic' } },
        { title: '1→2→3→4→1', activity: { kind: 'drill', drillId: 'thumb.cross-extended' } },
        { title: 'Reverse crossing', activity: { kind: 'drill', drillId: 'thumb.reverse-cross' } },
        { title: 'Slow crossing', activity: { kind: 'drill', drillId: 'thumb.slow-cross' } },
      ],
    },
    {
      // Built: the position ends, the hand repositions, the thumb carries the line.
      title: 'Finger Crossing',
      practices: [
        { title: '1-2-3-1', activity: { kind: 'drill', drillId: 'cross.basic' } },
        { title: '3-2-1-3', activity: { kind: 'drill', drillId: 'cross.reverse' } },
        { title: '1-2-3-4-5-1', activity: { kind: 'drill', drillId: 'cross.extended' } },
        { title: 'Scale fragments', activity: { kind: 'drill', drillId: 'cross.scale' } },
        {
          title: 'Crossing after different fingers',
          activity: { kind: 'drill', drillId: 'cross.varied' },
        },
        { title: 'Slow → medium → fast', activity: { kind: 'drill', drillId: 'cross.ladder' } },
      ],
    },
    {
      // Built: choosing the movement, which is the skill under all the others.
      title: 'Stretch vs Shift vs Cross',
      practices: [
        { title: 'Nearby note', activity: { kind: 'drill', drillId: 'choose.nearby' } },
        { title: 'Comfortable reach', activity: { kind: 'drill', drillId: 'choose.reach' } },
        { title: 'Large jump', activity: { kind: 'drill', drillId: 'choose.jump' } },
        {
          title: 'Continuous ascending notes',
          activity: { kind: 'drill', drillId: 'choose.ascending' },
        },
        {
          title: 'Continuous descending notes',
          activity: { kind: 'drill', drillId: 'choose.descending' },
        },
        {
          title: 'Random isolated note',
          activity: { kind: 'drill', drillId: 'choose.isolated' },
        },
        { title: 'Long sequence', activity: { kind: 'drill', drillId: 'choose.mixed' } },
      ],
    },
    {
      // Built: the five black keys as places, and the runs that pass through them.
      title: 'Black-Key Geography',
      practices: [
        { title: 'Black-key recognition', activity: { kind: 'drill', drillId: 'black.groups' } },
        { title: 'C♯ / D♭', activity: { kind: 'drill', drillId: 'black.c-sharp' } },
        { title: 'D♯ / E♭', activity: { kind: 'drill', drillId: 'black.d-sharp' } },
        { title: 'F♯ / G♭', activity: { kind: 'drill', drillId: 'black.f-sharp' } },
        { title: 'G♯ / A♭', activity: { kind: 'drill', drillId: 'black.g-sharp' } },
        { title: 'A♯ / B♭', activity: { kind: 'drill', drillId: 'black.a-sharp' } },
        {
          title: 'Natural + black combinations',
          activity: { kind: 'drill', drillId: 'black.neighbours' },
        },
        { title: 'Random black keys', activity: { kind: 'drill', drillId: 'black.random' } },
      ],
    },
    {
      // Built: notes you cannot see coming, and difficulty that follows accuracy.
      title: 'Random Finger Decisions',
      practices: [
        { title: 'Random natural notes', activity: { kind: 'drill', drillId: 'decide.naturals' } },
        {
          title: 'Random 2-note patterns',
          activity: { kind: 'drill', drillId: 'decide.two' },
        },
        {
          title: 'Random 3-note patterns',
          activity: { kind: 'drill', drillId: 'decide.three' },
        },
        {
          title: 'Random 4-note patterns',
          activity: { kind: 'drill', drillId: 'decide.four' },
        },
        {
          title: 'Random 5-note patterns',
          activity: { kind: 'drill', drillId: 'decide.five' },
        },
        {
          title: 'Random starting position',
          activity: { kind: 'drill', drillId: 'decide.position' },
        },
        { title: 'Random direction', activity: { kind: 'drill', drillId: 'decide.direction' } },
        {
          title: 'Random black + white keys',
          activity: { kind: 'drill', drillId: 'decide.black-white' },
        },
        { title: 'Timed random notes', activity: { kind: 'drill', drillId: 'decide.timed' } },
        {
          title: 'Accuracy-first random practice',
          activity: { kind: 'drill', drillId: 'decide.adaptive' },
        },
      ],
    },
    {
      // Built: the fingers submit to the beat, and the beat is measured.
      title: 'Rhythm + Finger Technique',
      practices: [
        { title: 'Quarter notes', activity: { kind: 'drill', drillId: 'rhythm.quarters' } },
        { title: 'Eighth notes', activity: { kind: 'drill', drillId: 'rhythm.eighths' } },
        { title: 'Metronome slow', activity: { kind: 'drill', drillId: 'rhythm.slow' } },
        { title: 'Metronome increase', activity: { kind: 'drill', drillId: 'rhythm.ladder' } },
        {
          title: 'Same pattern different rhythms',
          activity: { kind: 'drill', drillId: 'rhythm.rhythms' },
        },
        { title: 'Accent patterns', activity: { kind: 'drill', drillId: 'rhythm.accents' } },
      ],
    },
    {
      // Built: the quality control — is it learnt, or only learnt here?
      title: 'Muscle-Memory Validation',
      practices: [
        {
          title: 'Extremely slow practice',
          activity: { kind: 'drill', drillId: 'validate.slow' },
        },
        {
          title: 'Eyes-open accuracy',
          activity: { kind: 'drill', drillId: 'validate.eyes-open' },
        },
        { title: 'Eyes-off practice', activity: { kind: 'drill', drillId: 'validate.eyes-off' } },
        {
          title: 'Randomized patterns',
          activity: { kind: 'drill', drillId: 'validate.randomized' },
        },
        {
          title: 'Change starting notes',
          activity: { kind: 'drill', drillId: 'validate.transposed' },
        },
        {
          title: 'Change fingers when appropriate',
          activity: { kind: 'drill', drillId: 'validate.refingered' },
        },
        { title: 'Record yourself', activity: { kind: 'drill', drillId: 'validate.review' } },
        {
          title: 'Stop on repeated errors',
          activity: { kind: 'drill', drillId: 'validate.stop-on-errors' },
        },
      ],
    },
  ],
});
