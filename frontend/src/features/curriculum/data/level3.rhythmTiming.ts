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
      // Built: the pulse, measured — including the bars where the click stops.
      title: 'Pulse & Beat',
      practices: [
        {
          title: 'Understanding the Beat',
          activity: { kind: 'drill', drillId: 'pulse.understanding' },
        },
        { title: 'Counting 1 2 3 4', activity: { kind: 'drill', drillId: 'pulse.counting' } },
        { title: 'Foot Tapping', activity: { kind: 'drill', drillId: 'pulse.tapping' } },
        { title: 'Hand Clapping', activity: { kind: 'drill', drillId: 'pulse.clapping' } },
        { title: 'Beat vs Note', activity: { kind: 'drill', drillId: 'pulse.beat-vs-note' } },
        { title: 'Silent Beats', activity: { kind: 'drill', drillId: 'pulse.silent' } },
        { title: 'Accent on Beat 1', activity: { kind: 'drill', drillId: 'pulse.accent' } },
      ],
    },
    {
      // Built: how long a sound lasts — the first bucket that scores the release.
      title: 'Note Durations',
      practices: [
        { title: 'Whole Note', activity: { kind: 'drill', drillId: 'duration.whole' } },
        { title: 'Half Note', activity: { kind: 'drill', drillId: 'duration.half' } },
        { title: 'Quarter Note', activity: { kind: 'drill', drillId: 'duration.quarter' } },
        { title: 'Eighth Notes', activity: { kind: 'drill', drillId: 'duration.eighth' } },
        { title: 'Sixteenth Notes', activity: { kind: 'drill', drillId: 'duration.sixteenth' } },
        { title: 'Note + Rest', activity: { kind: 'drill', drillId: 'duration.rests' } },
        {
          title: 'Duration Switching',
          activity: { kind: 'drill', drillId: 'duration.switching' },
        },
        { title: 'Hold vs Release', activity: { kind: 'drill', drillId: 'duration.hold-release' } },
      ],
    },
    {
      // Built: inside the beat — and the click taken away a layer at a time.
      title: 'Counting & Subdivision',
      practices: [
        { title: 'Basic Counting', activity: { kind: 'drill', drillId: 'count.basic' } },
        {
          title: 'Eighth-Note Counting',
          activity: { kind: 'drill', drillId: 'count.eighths' },
        },
        {
          title: 'Sixteenth Counting',
          activity: { kind: 'drill', drillId: 'count.sixteenths' },
        },
        {
          title: 'Clap Quarter Notes',
          activity: { kind: 'drill', drillId: 'count.clap-quarters' },
        },
        {
          title: 'Clap Eighth Notes',
          activity: { kind: 'drill', drillId: 'count.clap-eighths' },
        },
        {
          title: 'Alternate Notes & Rests',
          activity: { kind: 'drill', drillId: 'count.notes-rests' },
        },
        {
          title: 'Count While Playing',
          activity: { kind: 'drill', drillId: 'count.while-playing' },
        },
        { title: 'Internal Counting', activity: { kind: 'drill', drillId: 'count.internal' } },
      ],
    },
    {
      // Built: the click as teacher — held, climbed, removed, and swept.
      title: 'Metronome Training',
      practices: [
        {
          title: 'Understanding BPM',
          activity: { kind: 'drill', drillId: 'metro.understanding' },
        },
        { title: '40 BPM', activity: { kind: 'drill', drillId: 'metro.40' } },
        { title: '50 BPM', activity: { kind: 'drill', drillId: 'metro.50' } },
        { title: '60 BPM', activity: { kind: 'drill', drillId: 'metro.60' } },
        { title: '80 BPM', activity: { kind: 'drill', drillId: 'metro.80' } },
        { title: '100 BPM', activity: { kind: 'drill', drillId: 'metro.100' } },
        { title: '120 BPM', activity: { kind: 'drill', drillId: 'metro.120' } },
        { title: 'Tempo Ladder', activity: { kind: 'drill', drillId: 'metro.ladder' } },
        { title: 'Metronome Gap', activity: { kind: 'drill', drillId: 'metro.gap' } },
        { title: 'Metronome Accuracy', activity: { kind: 'drill', drillId: 'metro.accuracy' } },
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
