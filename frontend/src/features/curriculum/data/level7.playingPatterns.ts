import { defineLevel } from './defineLevel';

/** L7 — the shapes real pieces are made of, and both hands at once. */
export const level7 = defineLevel({
  order: 7,
  emoji: '🎹',
  title: 'Playing Patterns',
  summary:
    'Turn theory into playing — melodies, broken chords, arpeggios, Alberti bass and two-hand coordination.',
  buckets: [
    {
      title: 'Melodies',
      practices: [
        { title: 'Right-Hand Melodies', activity: { kind: 'drill', drillId: 'mel.right' } },
        { title: 'Left-Hand Melodies', activity: { kind: 'drill', drillId: 'mel.left' } },
        { title: 'Stepwise Melodies', activity: { kind: 'drill', drillId: 'mel.stepwise' } },
        { title: 'Skipping Melodies', activity: { kind: 'drill', drillId: 'mel.skips' } },
        { title: 'Repeated Notes', activity: { kind: 'drill', drillId: 'mel.repeated' } },
        { title: 'Melody with Different Rhythms', activity: { kind: 'drill', drillId: 'mel.rhythms' } },
        { title: 'Short Melody Memorization', activity: { kind: 'drill', drillId: 'mel.memorise' } },
      ],
    },
    {
      title: 'Broken Chords',
      practices: [
        { title: '1–3–5 Pattern', activity: { kind: 'drill', drillId: 'bro.135' } },
        { title: '5–3–1 Pattern', activity: { kind: 'drill', drillId: 'bro.531' } },
        { title: 'C Major Broken Chord', activity: { kind: 'drill', drillId: 'bro.c' } },
        { title: 'F Major Broken Chord', activity: { kind: 'drill', drillId: 'bro.f' } },
        { title: 'G Major Broken Chord', activity: { kind: 'drill', drillId: 'bro.g' } },
        { title: 'Major Chord Broken Patterns', activity: { kind: 'drill', drillId: 'bro.major' } },
        { title: 'Minor Chord Broken Patterns', activity: { kind: 'drill', drillId: 'bro.minor' } },
        { title: 'Continuous Broken Chords', activity: { kind: 'drill', drillId: 'bro.continuous' } },
      ],
    },
    {
      title: 'Arpeggios',
      practices: [
        { title: '1–3–5–8 Pattern', activity: { kind: 'drill', drillId: 'arp.1358' } },
        { title: 'Ascending Arpeggios', activity: { kind: 'drill', drillId: 'arp.up' } },
        { title: 'Descending Arpeggios', activity: { kind: 'drill', drillId: 'arp.down' } },
        { title: 'C Major Arpeggio', activity: { kind: 'drill', drillId: 'arp.c' } },
        { title: 'F Major Arpeggio', activity: { kind: 'drill', drillId: 'arp.f' } },
        { title: 'G Major Arpeggio', activity: { kind: 'drill', drillId: 'arp.g' } },
        { title: 'Minor Arpeggios', activity: { kind: 'drill', drillId: 'arp.minor' } },
        { title: 'Arpeggio Repetition', activity: { kind: 'drill', drillId: 'arp.repetition' } },
      ],
    },
    {
      title: 'Alberti Bass',
      practices: [
        { title: 'Alberti Bass Pattern', activity: { kind: 'drill', drillId: 'alb.pattern' } },
        { title: 'C Major Alberti Bass', activity: { kind: 'drill', drillId: 'alb.c' } },
        { title: 'F Major Alberti Bass', activity: { kind: 'drill', drillId: 'alb.f' } },
        { title: 'G Major Alberti Bass', activity: { kind: 'drill', drillId: 'alb.g' } },
        { title: 'Continuous Alberti Bass', activity: { kind: 'drill', drillId: 'alb.continuous' } },
        { title: 'Alberti Bass with Melody', activity: { kind: 'drill', drillId: 'alb.melody' } },
      ],
    },
    {
      title: 'Chord + Melody',
      practices: [
        { title: 'Single Chord + Melody', activity: { kind: 'drill', drillId: 'cm.single' } },
        { title: 'Block Chord + Melody', activity: { kind: 'drill', drillId: 'cm.block' } },
        { title: 'C Chord + Melody', activity: { kind: 'drill', drillId: 'cm.c' } },
        { title: 'C–F–G Chord + Melody', activity: { kind: 'drill', drillId: 'cm.cfg' } },
        { title: 'Chord Changes + Melody', activity: { kind: 'drill', drillId: 'cm.changes' } },
        { title: 'Melody Phrasing', activity: { kind: 'drill', drillId: 'cm.phrasing' } },
        { title: 'Simple Song Arrangement', activity: { kind: 'drill', drillId: 'cm.song' } },
      ],
    },
    {
      title: 'Left-Hand Accompaniment',
      practices: [
        { title: 'Root Notes', activity: { kind: 'drill', drillId: 'lh.roots' } },
        { title: 'Root–Chord Pattern', activity: { kind: 'drill', drillId: 'lh.rootchord' } },
        { title: 'Octave Bass', activity: { kind: 'drill', drillId: 'lh.octave' } },
        { title: 'Bass + Chord', activity: { kind: 'drill', drillId: 'lh.basschord' } },
        { title: 'Waltz Pattern', activity: { kind: 'drill', drillId: 'lh.waltz' } },
        { title: 'Pop Pattern', activity: { kind: 'drill', drillId: 'lh.pop' } },
        { title: 'Broken-Chord Accompaniment', activity: { kind: 'drill', drillId: 'lh.broken' } },
        { title: 'Chord Progression Accompaniment', activity: { kind: 'drill', drillId: 'lh.progression' } },
      ],
    },
    {
      title: 'Two-Hand Coordination',
      practices: [
        { title: 'Hands Together — Same Rhythm', activity: { kind: 'drill', drillId: 'th.same' } },
        { title: 'Hands Together — Different Notes', activity: { kind: 'drill', drillId: 'th.different' } },
        { title: 'Left-Hand Steady + Right-Hand Melody', activity: { kind: 'drill', drillId: 'th.steady' } },
        { title: 'Different Rhythms', activity: { kind: 'drill', drillId: 'th.rhythms' } },
        { title: 'Repeating LH Pattern + RH Melody', activity: { kind: 'drill', drillId: 'th.repeating' } },
        { title: 'Chord Changes + Melody', activity: { kind: 'drill', drillId: 'th.changes' } },
        { title: 'Slow → Medium → Fast', activity: { kind: 'drill', drillId: 'th.speed' } },
        { title: 'Hands-Independent Practice', activity: { kind: 'drill', drillId: 'th.independent' } },
        { title: 'Continuous Playing', activity: { kind: 'drill', drillId: 'th.continuous' } },
        { title: 'Full Two-Hand Song', activity: { kind: 'drill', drillId: 'th.song' } },
      ],
    },
  ],
});
