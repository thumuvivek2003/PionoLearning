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
        'Right-Hand Melodies',
        'Left-Hand Melodies',
        'Stepwise Melodies',
        'Skipping Melodies',
        'Repeated Notes',
        'Melody with Different Rhythms',
        'Short Melody Memorization',
      ],
    },
    {
      title: 'Broken Chords',
      practices: [
        '1–3–5 Pattern',
        '5–3–1 Pattern',
        'C Major Broken Chord',
        'F Major Broken Chord',
        'G Major Broken Chord',
        'Major Chord Broken Patterns',
        'Minor Chord Broken Patterns',
        'Continuous Broken Chords',
      ],
    },
    {
      title: 'Arpeggios',
      practices: [
        '1–3–5–8 Pattern',
        'Ascending Arpeggios',
        'Descending Arpeggios',
        'C Major Arpeggio',
        'F Major Arpeggio',
        'G Major Arpeggio',
        'Minor Arpeggios',
        'Arpeggio Repetition',
      ],
    },
    {
      title: 'Alberti Bass',
      practices: [
        'Alberti Bass Pattern',
        'C Major Alberti Bass',
        'F Major Alberti Bass',
        'G Major Alberti Bass',
        'Continuous Alberti Bass',
        'Alberti Bass with Melody',
      ],
    },
    {
      title: 'Chord + Melody',
      practices: [
        'Single Chord + Melody',
        'Block Chord + Melody',
        'C Chord + Melody',
        'C–F–G Chord + Melody',
        'Chord Changes + Melody',
        'Melody Phrasing',
        'Simple Song Arrangement',
      ],
    },
    {
      title: 'Left-Hand Accompaniment',
      practices: [
        'Root Notes',
        'Root–Chord Pattern',
        'Octave Bass',
        'Bass + Chord',
        'Waltz Pattern',
        'Pop Pattern',
        'Broken-Chord Accompaniment',
        'Chord Progression Accompaniment',
      ],
    },
    {
      title: 'Two-Hand Coordination',
      practices: [
        'Hands Together — Same Rhythm',
        'Hands Together — Different Notes',
        'Left-Hand Steady + Right-Hand Melody',
        'Different Rhythms',
        'Repeating LH Pattern + RH Melody',
        'Chord Changes + Melody',
        'Slow → Medium → Fast',
        'Hands-Independent Practice',
        'Continuous Playing',
        'Full Two-Hand Song',
      ],
    },
  ],
});
