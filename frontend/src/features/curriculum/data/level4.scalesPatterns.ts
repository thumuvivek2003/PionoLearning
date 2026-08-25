import { defineLevel } from './defineLevel';

/** L4 — the whole/half-step formula turned into every major and minor scale. */
export const level4 = defineLevel({
  order: 4,
  emoji: '🎼',
  title: 'Scales & Keyboard Patterns',
  summary:
    'One formula, twelve keys — build and play every major and minor scale, then recall them from a random key.',
  buckets: [
    {
      // Built: the two steps, then the formula applied from anywhere.
      title: 'Major Scale Formula',
      practices: [
        { title: 'Whole Step', activity: { kind: 'drill', drillId: 'scale.whole-step' } },
        { title: 'Half Step', activity: { kind: 'drill', drillId: 'scale.half-step' } },
        {
          title: 'W-W-H-W-W-W-H Formula',
          activity: { kind: 'drill', drillId: 'scale.formula' },
        },
        {
          title: 'Formula Starting From Any Note',
          activity: { kind: 'drill', drillId: 'scale.any-note' },
        },
        {
          title: 'Formula on Keyboard',
          activity: { kind: 'drill', drillId: 'scale.on-keyboard' },
        },
        {
          title: 'Scale Construction Drill',
          activity: { kind: 'drill', drillId: 'scale.construct' },
        },
      ],
    },
    {
      // Built: the scale everyone starts with, under both hands and a clock.
      title: 'C Major Scale',
      practices: [
        { title: 'C Major Notes', activity: { kind: 'drill', drillId: 'cmajor.notes' } },
        { title: 'C Major Formula', activity: { kind: 'drill', drillId: 'cmajor.formula' } },
        { title: 'RH C Major', activity: { kind: 'drill', drillId: 'cmajor.rh' } },
        { title: 'LH C Major', activity: { kind: 'drill', drillId: 'cmajor.lh' } },
        { title: 'Hands Together', activity: { kind: 'drill', drillId: 'cmajor.together' } },
        { title: 'Slow Scale Practice', activity: { kind: 'drill', drillId: 'cmajor.slow' } },
        {
          title: 'Random Start Practice',
          activity: { kind: 'drill', drillId: 'cmajor.random-start' },
        },
      ],
    },
    {
      // Built: one sharp, and why the seventh degree is the one that moves.
      title: 'G Major Scale',
      practices: [
        { title: 'G Major Notes', activity: { kind: 'drill', drillId: 'gmajor.notes' } },
        { title: 'F# Recognition', activity: { kind: 'drill', drillId: 'gmajor.f-sharp' } },
        { title: 'G Major Formula', activity: { kind: 'drill', drillId: 'gmajor.formula' } },
        { title: 'RH G Major', activity: { kind: 'drill', drillId: 'gmajor.rh' } },
        { title: 'LH G Major', activity: { kind: 'drill', drillId: 'gmajor.lh' } },
        { title: 'Hands Together', activity: { kind: 'drill', drillId: 'gmajor.together' } },
        { title: 'C → G Comparison', activity: { kind: 'drill', drillId: 'gmajor.compare' } },
      ],
    },
    {
      // Built: one flat, arriving at the fourth — and its own right-hand fingering.
      title: 'F Major Scale',
      practices: [
        { title: 'F Major Notes', activity: { kind: 'drill', drillId: 'fmajor.notes' } },
        { title: 'Bb Recognition', activity: { kind: 'drill', drillId: 'fmajor.b-flat' } },
        { title: 'F Major Formula', activity: { kind: 'drill', drillId: 'fmajor.formula' } },
        { title: 'RH F Major', activity: { kind: 'drill', drillId: 'fmajor.rh' } },
        { title: 'LH F Major', activity: { kind: 'drill', drillId: 'fmajor.lh' } },
        { title: 'Hands Together', activity: { kind: 'drill', drillId: 'fmajor.together' } },
        {
          title: 'C → G → F Comparison',
          activity: { kind: 'drill', drillId: 'fmajor.compare' },
        },
      ],
    },
    {
      title: 'Major Scale Family',
      practices: [
        { title: 'C Major', activity: { kind: 'drill', drillId: 'family.c' } },
        { title: 'G Major', activity: { kind: 'drill', drillId: 'family.g' } },
        { title: 'D Major', activity: { kind: 'drill', drillId: 'family.d' } },
        { title: 'A Major', activity: { kind: 'drill', drillId: 'family.a' } },
        { title: 'E Major', activity: { kind: 'drill', drillId: 'family.e' } },
        { title: 'B Major', activity: { kind: 'drill', drillId: 'family.b' } },
        { title: 'F Major', activity: { kind: 'drill', drillId: 'family.f' } },
        { title: 'Bb Major', activity: { kind: 'drill', drillId: 'family.bb' } },
        { title: 'Eb Major', activity: { kind: 'drill', drillId: 'family.eb' } },
        { title: 'Ab Major', activity: { kind: 'drill', drillId: 'family.ab' } },
        { title: 'Db Major', activity: { kind: 'drill', drillId: 'family.db' } },
        { title: 'Sharp-Key Order', activity: { kind: 'drill', drillId: 'family.sharp-order' } },
        { title: 'Flat-Key Order', activity: { kind: 'drill', drillId: 'family.flat-order' } },
        { title: 'Random Major Scale', activity: { kind: 'drill', drillId: 'family.random' } },
      ],
    },
    {
      title: 'Minor Scale Foundation',
      practices: [
        { title: 'Major vs Minor Sound', activity: { kind: 'drill', drillId: 'minor.sound' } },
        { title: 'Natural Minor Formula', activity: { kind: 'drill', drillId: 'minor.formula' } },
        { title: 'Relative Minor Concept', activity: { kind: 'drill', drillId: 'minor.relative' } },
        { title: 'Relative Minor From Major', activity: { kind: 'drill', drillId: 'minor.sixth' } },
        { title: 'Minor Scale Construction', activity: { kind: 'drill', drillId: 'minor.build' } },
      ],
    },
    {
      title: 'A Minor Scale',
      practices: [
        { title: 'A Minor Notes', activity: { kind: 'drill', drillId: 'aminor.notes' } },
        { title: 'A Minor Formula', activity: { kind: 'drill', drillId: 'aminor.formula' } },
        { title: 'A Minor vs C Major', activity: { kind: 'drill', drillId: 'aminor.vs-c' } },
        { title: 'RH A Minor', activity: { kind: 'drill', drillId: 'aminor.rh' } },
        { title: 'LH A Minor', activity: { kind: 'drill', drillId: 'aminor.lh' } },
        { title: 'Hands Together', activity: { kind: 'drill', drillId: 'aminor.together' } },
      ],
    },
    {
      title: 'E Minor Scale',
      practices: [
        { title: 'E Minor Notes', activity: { kind: 'drill', drillId: 'eminor.notes' } },
        { title: 'E Minor Formula', activity: { kind: 'drill', drillId: 'eminor.formula' } },
        { title: 'E Minor vs G Major', activity: { kind: 'drill', drillId: 'eminor.vs-g' } },
        { title: 'RH E Minor', activity: { kind: 'drill', drillId: 'eminor.rh' } },
        { title: 'LH E Minor', activity: { kind: 'drill', drillId: 'eminor.lh' } },
        { title: 'Hands Together', activity: { kind: 'drill', drillId: 'eminor.together' } },
      ],
    },
    {
      title: 'D Minor Scale',
      practices: [
        { title: 'D Minor Notes', activity: { kind: 'drill', drillId: 'dminor.notes' } },
        { title: 'D Minor Formula', activity: { kind: 'drill', drillId: 'dminor.formula' } },
        { title: 'D Minor vs F Major', activity: { kind: 'drill', drillId: 'dminor.vs-f' } },
        { title: 'RH D Minor', activity: { kind: 'drill', drillId: 'dminor.rh' } },
        { title: 'LH D Minor', activity: { kind: 'drill', drillId: 'dminor.lh' } },
        { title: 'Hands Together', activity: { kind: 'drill', drillId: 'dminor.together' } },
      ],
    },
    {
      title: 'Scale Pattern Recognition',
      practices: [
        { title: 'Identify Starting Note', activity: { kind: 'drill', drillId: 'pattern.start-note' } },
        { title: 'Identify Accidentals', activity: { kind: 'drill', drillId: 'pattern.accidentals' } },
        { title: 'Missing Note Drill', activity: { kind: 'drill', drillId: 'pattern.missing' } },
        { title: 'Ascending Pattern', activity: { kind: 'drill', drillId: 'pattern.ascending' } },
        { title: 'Descending Pattern', activity: { kind: 'drill', drillId: 'pattern.descending' } },
        { title: 'Random Key → Scale', activity: { kind: 'drill', drillId: 'pattern.key-to-scale' } },
        { title: 'Scale → Key', activity: { kind: 'drill', drillId: 'pattern.scale-to-key' } },
        { title: 'Major vs Minor', activity: { kind: 'drill', drillId: 'pattern.quality' } },
      ],
    },
    {
      title: 'Scale Playing Technique',
      practices: [
        { title: 'Finger Numbering', activity: { kind: 'drill', drillId: 'technique.fingers' } },
        { title: 'Thumb Tuck', activity: { kind: 'drill', drillId: 'technique.thumb' } },
        { title: 'Finger Crossing', activity: { kind: 'drill', drillId: 'technique.crossing' } },
        { title: 'Even Notes', activity: { kind: 'drill', drillId: 'technique.even' } },
        { title: 'Slow → Fast', activity: { kind: 'drill', drillId: 'technique.speed' } },
        { title: 'Metronome Practice', activity: { kind: 'drill', drillId: 'technique.metronome' } },
        { title: 'Accent-Free Playing', activity: { kind: 'drill', drillId: 'technique.accents' } },
        { title: 'Ascending + Descending', activity: { kind: 'drill', drillId: 'technique.both-ways' } },
      ],
    },
    {
      title: 'Scale Recall & Random-Key Practice',
      practices: [
        { title: 'Random Key Recognition', activity: { kind: 'drill', drillId: 'recall.key' } },
        { title: 'Name the Scale Notes', activity: { kind: 'drill', drillId: 'recall.name' } },
        { title: 'Find Notes on Keyboard', activity: { kind: 'drill', drillId: 'recall.find' } },
        { title: 'Play Without Looking', activity: { kind: 'drill', drillId: 'recall.blind' } },
        { title: 'Ascending Challenge', activity: { kind: 'drill', drillId: 'recall.ascending' } },
        { title: 'Descending Challenge', activity: { kind: 'drill', drillId: 'recall.descending' } },
        { title: 'Major/Minor Challenge', activity: { kind: 'drill', drillId: 'recall.quality' } },
        { title: 'Timed Scale Challenge', activity: { kind: 'drill', drillId: 'recall.timed' } },
        { title: 'Mistake Correction', activity: { kind: 'drill', drillId: 'recall.correction' } },
        { title: 'Contest Simulation', activity: { kind: 'drill', drillId: 'recall.contest' } },
      ],
    },
  ],
});
