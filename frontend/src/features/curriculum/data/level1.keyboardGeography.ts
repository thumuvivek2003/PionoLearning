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
      // Built: see the landmark → locate the key → know the note.
      title: 'Black-Key Geography',
      practices: [
        { title: '2-Black-Key Pattern', activity: { kind: 'drill', drillId: 'geo.group-two' } },
        { title: '3-Black-Key Pattern', activity: { kind: 'drill', drillId: 'geo.group-three' } },
        {
          title: 'C from 2-Black Pattern',
          activity: { kind: 'drill', drillId: 'geo.landmark-c' },
        },
        {
          title: 'D from 2-Black Pattern',
          activity: { kind: 'drill', drillId: 'geo.landmark-d' },
        },
        {
          title: 'E from 2-Black Pattern',
          activity: { kind: 'drill', drillId: 'geo.landmark-e' },
        },
        {
          title: 'F from 3-Black Pattern',
          activity: { kind: 'drill', drillId: 'geo.landmark-f' },
        },
        {
          title: 'G from 3-Black Pattern',
          activity: { kind: 'drill', drillId: 'geo.landmark-g' },
        },
        {
          title: 'A from 3-Black Pattern',
          activity: { kind: 'drill', drillId: 'geo.landmark-a' },
        },
        {
          title: 'B from 3-Black Pattern',
          activity: { kind: 'drill', drillId: 'geo.landmark-b' },
        },
        {
          title: 'Black-Key Random Recognition',
          activity: { kind: 'drill', drillId: 'geo.black-position' },
        },
        { title: 'Sharp Names', activity: { kind: 'drill', drillId: 'geo.black-sharps' } },
        { title: 'Flat Names', activity: { kind: 'drill', drillId: 'geo.black-flats' } },
        {
          title: 'Sharp ↔ Flat Equivalents',
          activity: { kind: 'drill', drillId: 'geo.enharmonics' },
        },
      ],
    },
    {
      // Built: the same letter repeats every octave — find it, jump it, name it.
      title: 'Octave Geography',
      practices: [
        { title: 'Find Every C', activity: { kind: 'drill', drillId: 'geo.octave-find-c' } },
        { title: 'Find Every F', activity: { kind: 'drill', drillId: 'geo.octave-find-f' } },
        { title: 'C-to-C Octave', activity: { kind: 'drill', drillId: 'geo.octave-c-to-c' } },
        {
          title: 'Same Note Across Octaves',
          activity: { kind: 'drill', drillId: 'geo.octave-same-note' },
        },
        { title: 'Low vs High', activity: { kind: 'drill', drillId: 'geo.octave-low-high' } },
        {
          title: 'Octave Jump Practice',
          activity: { kind: 'drill', drillId: 'geo.octave-jump' },
        },
        {
          title: 'Random Octave Recognition',
          activity: { kind: 'drill', drillId: 'geo.octave-name' },
        },
      ],
    },
    {
      // Built: the two anchors, then everything that hangs off them.
      title: 'Landmark Recognition',
      practices: [
        {
          title: 'C Landmark Drill',
          activity: { kind: 'drill', drillId: 'geo.landmark-sprint-c' },
        },
        {
          title: 'F Landmark Drill',
          activity: { kind: 'drill', drillId: 'geo.landmark-sprint-f' },
        },
        {
          title: 'C → Surrounding Notes',
          activity: { kind: 'drill', drillId: 'geo.landmark-c-block' },
        },
        {
          title: 'F → Surrounding Notes',
          activity: { kind: 'drill', drillId: 'geo.landmark-f-block' },
        },
        {
          title: 'Landmark → White Keys',
          activity: { kind: 'drill', drillId: 'geo.landmark-white-run' },
        },
        {
          title: 'Landmark → Black Keys',
          activity: { kind: 'drill', drillId: 'geo.landmark-black-run' },
        },
        {
          title: 'Random Landmark Drill',
          activity: { kind: 'drill', drillId: 'geo.landmark-random' },
        },
      ],
    },
    {
      // Built: one recognition engine, nine pressures — plus the sequence run.
      title: 'Random Note Recognition',
      practices: [
        { title: 'Random White Note', activity: { kind: 'drill', drillId: 'geo.random-white' } },
        { title: 'Random Black Note', activity: { kind: 'drill', drillId: 'geo.random-black' } },
        { title: 'Random Sharp Note', activity: { kind: 'drill', drillId: 'geo.random-sharp' } },
        { title: 'Random Flat Note', activity: { kind: 'drill', drillId: 'geo.random-flat' } },
        { title: 'Mixed Random Notes', activity: { kind: 'drill', drillId: 'geo.random-mixed' } },
        { title: 'Note → Key Drill', activity: { kind: 'drill', drillId: 'geo.note-to-key' } },
        { title: 'Key → Note Drill', activity: { kind: 'drill', drillId: 'geo.key-to-note' } },
        {
          title: 'Random Sequence Drill',
          activity: { kind: 'drill', drillId: 'geo.random-sequence' },
        },
        { title: 'No-Counting Drill', activity: { kind: 'drill', drillId: 'geo.no-counting' } },
        { title: 'Speed Recognition', activity: { kind: 'drill', drillId: 'geo.speed-recognition' } },
      ],
    },
    {
      // Built: how far is that from here — answered by landing on it.
      title: 'Distance & Spatial Awareness',
      practices: [
        {
          title: 'Same Note Distance',
          activity: { kind: 'drill', drillId: 'geo.distance-same-note' },
        },
        {
          title: 'Neighbor Distance',
          activity: { kind: 'drill', drillId: 'geo.distance-neighbour' },
        },
        { title: '2-Key Jump', activity: { kind: 'drill', drillId: 'geo.distance-two' } },
        { title: '3-Key Jump', activity: { kind: 'drill', drillId: 'geo.distance-three' } },
        {
          title: 'White-Key Interval Awareness',
          activity: { kind: 'drill', drillId: 'geo.distance-intervals' },
        },
        {
          title: 'Random Distance Drill',
          activity: { kind: 'drill', drillId: 'geo.distance-random' },
        },
      ],
    },
    {
      // Built: the board covers itself, and the misses get named and repaired.
      title: 'Blind / Reduced-Visual Recognition',
      practices: [
        { title: 'Look → Touch', activity: { kind: 'drill', drillId: 'geo.reach-look-touch' } },
        { title: 'Touch → Identify', activity: { kind: 'drill', drillId: 'geo.reach-identify' } },
        {
          title: 'Look Away → Reach',
          activity: { kind: 'drill', drillId: 'geo.reach-look-away' },
        },
        { title: 'Landmark → Reach', activity: { kind: 'drill', drillId: 'geo.reach-landmark' } },
        {
          title: 'Random Blind Reach',
          activity: { kind: 'drill', drillId: 'geo.reach-random' },
        },
        {
          title: 'Blind Accuracy Check',
          activity: { kind: 'drill', drillId: 'geo.reach-accuracy' },
        },
      ],
    },
  ],
});
