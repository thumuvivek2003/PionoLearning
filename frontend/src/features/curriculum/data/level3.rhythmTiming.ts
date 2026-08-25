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
      // Built: written rhythms, and bars rolled on the spot to read first time.
      title: 'Rhythm Patterns',
      practices: [
        {
          title: 'Four Quarter Notes',
          activity: { kind: 'drill', drillId: 'pattern.quarters' },
        },
        { title: 'Half + Half', activity: { kind: 'drill', drillId: 'pattern.halves' } },
        {
          title: 'Quarter + Half + Quarter',
          activity: { kind: 'drill', drillId: 'pattern.q-h-q' },
        },
        {
          title: 'Eighth-Note Pairs',
          activity: { kind: 'drill', drillId: 'pattern.eighth-pairs' },
        },
        {
          title: 'Quarter + Eighths',
          activity: { kind: 'drill', drillId: 'pattern.quarter-eighths' },
        },
        {
          title: 'Eighth + Quarter Combinations',
          activity: { kind: 'drill', drillId: 'pattern.eighth-quarter' },
        },
        {
          title: 'Note + Rest Patterns',
          activity: { kind: 'drill', drillId: 'pattern.note-rest' },
        },
        {
          title: 'Random Rhythm Patterns',
          activity: { kind: 'drill', drillId: 'pattern.random' },
        },
      ],
    },
    {
      // Built: one question at a time — placement, spacing, entry, ending, recovery.
      title: 'Rhythm Accuracy',
      practices: [
        {
          title: 'Same Note, Different Rhythms',
          activity: { kind: 'drill', drillId: 'accuracy.rhythms' },
        },
        {
          title: 'Repeated Note Timing',
          activity: { kind: 'drill', drillId: 'accuracy.repeats' },
        },
        { title: 'Rushing Detection', activity: { kind: 'drill', drillId: 'accuracy.rushing' } },
        {
          title: 'Dragging Detection',
          activity: { kind: 'drill', drillId: 'accuracy.dragging' },
        },
        { title: 'Evenness Practice', activity: { kind: 'drill', drillId: 'accuracy.evenness' } },
        { title: 'Start on Beat', activity: { kind: 'drill', drillId: 'accuracy.start' } },
        { title: 'Stop on Beat', activity: { kind: 'drill', drillId: 'accuracy.stop' } },
        {
          title: 'Recover After Mistake',
          activity: { kind: 'drill', drillId: 'accuracy.recover' },
        },
      ],
    },
    {
      // Built: one key up to a tune, with the counting removed a step at a time.
      title: 'Practical Keyboard Rhythm',
      practices: [
        { title: 'Single-Note Rhythm', activity: { kind: 'drill', drillId: 'phrase.single' } },
        { title: '2-Note Patterns', activity: { kind: 'drill', drillId: 'phrase.two' } },
        { title: '3-Note Patterns', activity: { kind: 'drill', drillId: 'phrase.three' } },
        { title: '4-Note Patterns', activity: { kind: 'drill', drillId: 'phrase.four' } },
        {
          title: 'Simple Melody + Metronome',
          activity: { kind: 'drill', drillId: 'phrase.melody' },
        },
        {
          title: 'Melody With Counting',
          activity: { kind: 'drill', drillId: 'phrase.melody-counting' },
        },
        {
          title: 'Melody Without Counting',
          activity: { kind: 'drill', drillId: 'phrase.melody-internal' },
        },
        { title: 'Record & Review', activity: { kind: 'drill', drillId: 'phrase.review' } },
      ],
    },
    {
      // Built: start on time, hold it, survive a mistake, finish on time — scored.
      title: 'Contest-Level Timing',
      practices: [
        {
          title: 'Start With Count-In',
          activity: { kind: 'drill', drillId: 'contest.count-in' },
        },
        { title: 'Consistent Tempo', activity: { kind: 'drill', drillId: 'contest.consistent' } },
        {
          title: 'Playing Through Mistakes',
          activity: { kind: 'drill', drillId: 'contest.mistakes' },
        },
        { title: 'Different Tempos', activity: { kind: 'drill', drillId: 'contest.tempos' } },
        {
          title: 'No-Metronome Test',
          activity: { kind: 'drill', drillId: 'contest.no-metronome' },
        },
        {
          title: 'Metronome Return Test',
          activity: { kind: 'drill', drillId: 'contest.return' },
        },
        {
          title: 'Performance Practice',
          activity: { kind: 'drill', drillId: 'contest.performance' },
        },
        {
          title: 'Mock Contest Performance',
          activity: { kind: 'drill', drillId: 'contest.mock' },
        },
      ],
    },
  ],
});
