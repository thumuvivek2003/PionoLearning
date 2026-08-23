import { defineLevel } from './defineLevel';

/** L1 — find any key by sight, using the 2–3 black-key groups as landmarks. */
export const level1 = defineLevel({
  order: 1,
  emoji: '🎹',
  title: 'Keyboard Geography',
  summary:
    'Name and find every key by sight — the 2–3 black-key landmarks, octaves, distances and blind reach.',
  buckets: [
    {
      // Built: note name → visual pattern → physical key → instant recognition.
      title: 'White Key Geography',
      practices: [
        {
          title: 'Learn C D E F G A B',
          activity: { kind: 'drill', drillId: 'geo.natural-sequence' },
        },
        {
          title: 'Ascending Note Sequence',
          activity: { kind: 'drill', drillId: 'geo.ascending' },
        },
        {
          title: 'Descending Note Sequence',
          activity: { kind: 'drill', drillId: 'geo.descending' },
        },
        { title: 'Adjacent White Keys', activity: { kind: 'drill', drillId: 'geo.adjacent' } },
        { title: 'Skip-One Recognition', activity: { kind: 'drill', drillId: 'geo.skip-one' } },
        {
          title: 'White-Key Random Recognition',
          activity: { kind: 'drill', drillId: 'geo.key-to-name' },
        },
        {
          title: 'White-Key → Location',
          activity: { kind: 'drill', drillId: 'geo.name-to-key' },
        },
      ],
    },
    {
      title: 'Black-Key Geography',
      practices: [
        '2-Black-Key Pattern',
        '3-Black-Key Pattern',
        'C from 2-Black Pattern',
        'D from 2-Black Pattern',
        'E from 2-Black Pattern',
        'F from 3-Black Pattern',
        'G from 3-Black Pattern',
        'A from 3-Black Pattern',
        'B from 3-Black Pattern',
        'Black-Key Random Recognition',
        'Sharp Names',
        'Flat Names',
        'Sharp ↔ Flat Equivalents',
      ],
    },
    {
      title: 'Octave Geography',
      practices: [
        'Find Every C',
        'Find Every F',
        'C-to-C Octave',
        'Same Note Across Octaves',
        'Low vs High',
        'Octave Jump Practice',
        'Random Octave Recognition',
      ],
    },
    {
      title: 'Landmark Recognition',
      practices: [
        'C Landmark Drill',
        'F Landmark Drill',
        'C → Surrounding Notes',
        'F → Surrounding Notes',
        'Landmark → White Keys',
        'Landmark → Black Keys',
        'Random Landmark Drill',
      ],
    },
    {
      title: 'Random Note Recognition',
      practices: [
        'Random White Note',
        'Random Black Note',
        'Random Sharp Note',
        'Random Flat Note',
        'Mixed Random Notes',
        'Note → Key Drill',
        'Key → Note Drill',
        'Random Sequence Drill',
        'No-Counting Drill',
        'Speed Recognition',
      ],
    },
    {
      title: 'Distance & Spatial Awareness',
      practices: [
        'Same Note Distance',
        'Neighbor Distance',
        '2-Key Jump',
        '3-Key Jump',
        'White-Key Interval Awareness',
        'Random Distance Drill',
      ],
    },
    {
      title: 'Blind / Reduced-Visual Recognition',
      practices: [
        'Look → Touch',
        'Touch → Identify',
        'Look Away → Reach',
        'Landmark → Reach',
        'Random Blind Reach',
        'Blind Accuracy Check',
      ],
    },
  ],
});
