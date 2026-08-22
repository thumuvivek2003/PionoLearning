import { defineLevel } from './defineLevel';

/** L3 — the pulse: note values, counting, the metronome, contest-steady tempo. */
export const level3 = defineLevel({
  order: 3,
  emoji: '🥁',
  title: 'Rhythm & Timing',
  summary:
    'Hold a pulse — note durations, counting and subdivision, the metronome, and staying steady under pressure.',
  buckets: [
    {
      title: 'Pulse & Beat',
      practices: [
        'Understanding the Beat',
        'Counting 1 2 3 4',
        'Foot Tapping',
        'Hand Clapping',
        'Beat vs Note',
        'Silent Beats',
        'Accent on Beat 1',
      ],
    },
    {
      title: 'Note Durations',
      practices: [
        'Whole Note',
        'Half Note',
        'Quarter Note',
        'Eighth Notes',
        'Sixteenth Notes',
        'Note + Rest',
        'Duration Switching',
        'Hold vs Release',
      ],
    },
    {
      title: 'Counting & Subdivision',
      practices: [
        'Basic Counting',
        'Eighth-Note Counting',
        'Sixteenth Counting',
        'Clap Quarter Notes',
        'Clap Eighth Notes',
        'Alternate Notes & Rests',
        'Count While Playing',
        'Internal Counting',
      ],
    },
    {
      title: 'Metronome Training',
      practices: [
        'Understanding BPM',
        '40 BPM',
        '50 BPM',
        '60 BPM',
        '80 BPM',
        '100 BPM',
        '120 BPM',
        'Tempo Ladder',
        'Metronome Gap',
        'Metronome Accuracy',
      ],
    },
    {
      title: 'Rhythm Patterns',
      practices: [
        'Four Quarter Notes',
        'Half + Half',
        'Quarter + Half + Quarter',
        'Eighth-Note Pairs',
        'Quarter + Eighths',
        'Eighth + Quarter Combinations',
        'Note + Rest Patterns',
        'Random Rhythm Patterns',
      ],
    },
    {
      title: 'Rhythm Accuracy',
      practices: [
        'Same Note, Different Rhythms',
        'Repeated Note Timing',
        'Rushing Detection',
        'Dragging Detection',
        'Evenness Practice',
        'Start on Beat',
        'Stop on Beat',
        'Recover After Mistake',
      ],
    },
    {
      title: 'Practical Keyboard Rhythm',
      practices: [
        'Single-Note Rhythm',
        '2-Note Patterns',
        '3-Note Patterns',
        '4-Note Patterns',
        'Simple Melody + Metronome',
        'Melody With Counting',
        'Melody Without Counting',
        'Record & Review',
      ],
    },
    {
      title: 'Contest-Level Timing',
      practices: [
        'Start With Count-In',
        'Consistent Tempo',
        'Playing Through Mistakes',
        'Different Tempos',
        'No-Metronome Test',
        'Metronome Return Test',
        'Performance Practice',
        'Mock Contest Performance',
      ],
    },
  ],
});
