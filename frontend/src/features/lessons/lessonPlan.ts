import type { Lesson } from './lessons.types';

/**
 * Every lesson is drilled at these four speeds, slowest first.
 * Clearing 2 s teaches the position; clearing 0.5 s makes it automatic.
 */
export const LESSON_SPEEDS: readonly number[] = [2, 1.5, 1, 0.5];

/** The ladder is single-note work, so every drill runs in the note trainer. */
export const LESSON_MODULE_ID = 'notes';

/**
 * The ladder.
 *
 * The order is deliberate: it walks outward from the two landmarks the eye can
 * find without counting — the group of two black keys and the group of three.
 * Whites that touch those groups come first, then the blacks themselves under
 * both spellings, then the chromatic fill-in.
 */
export const LESSON_PLAN: readonly Lesson[] = [
  {
    id: 'lesson:01',
    order: 1,
    title: 'C E',
    notes: ['C', 'E'],
    focus: 'The two whites hugging the group of two black keys — C on its left, E on its right.',
    group: 'Naturals',
  },
  {
    id: 'lesson:02',
    order: 2,
    title: 'F A',
    notes: ['F', 'A'],
    focus: 'Into the group of three: F sits on its left edge, A in the upper gap.',
    group: 'Naturals',
  },
  {
    id: 'lesson:03',
    order: 3,
    title: 'D G',
    notes: ['D', 'G'],
    focus: 'The whites buried between blacks — D in the middle of the two, G in the lower gap of the three.',
    group: 'Naturals',
  },
  {
    id: 'lesson:04',
    order: 4,
    title: 'B',
    notes: ['B'],
    focus: 'The last white before the pattern restarts. Find it by falling off the right edge of the three.',
    group: 'Naturals',
  },
  {
    id: 'lesson:05',
    order: 5,
    title: 'C E F A',
    notes: ['C', 'E', 'F', 'A'],
    focus: 'Both landmark pairs together. C/E and F/A must now be told apart at a glance.',
    group: 'Naturals',
  },
  {
    id: 'lesson:06',
    order: 6,
    title: 'D G B',
    notes: ['D', 'G', 'B'],
    focus: 'The harder whites on their own — the two in-between notes plus the closing edge.',
    group: 'Naturals',
  },
  {
    id: 'lesson:07',
    order: 7,
    title: 'C D E F G A B',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    focus: 'All seven naturals. If the earlier rungs stuck, this is just the two halves joined.',
    group: 'Naturals',
  },
  {
    id: 'lesson:08',
    order: 8,
    title: 'C♯ D♯',
    notes: ['C#', 'D#'],
    focus: 'The group of two itself. Only two keys to confuse, so speed comes quickly.',
    group: 'Sharps',
  },
  {
    id: 'lesson:09',
    order: 9,
    title: 'F♯ G♯ A♯',
    notes: ['F#', 'G#', 'A#'],
    focus: 'The group of three. Left, middle, right — no counting from C.',
    group: 'Sharps',
  },
  {
    id: 'lesson:10',
    order: 10,
    title: 'C♯ D♯ F♯ G♯ A♯',
    notes: ['C#', 'D#', 'F#', 'G#', 'A#'],
    focus: 'All five blacks as sharps. The jump from D♯ to F♯ is the one that catches people.',
    group: 'Sharps',
  },
  {
    id: 'lesson:11',
    order: 11,
    title: 'D♭ E♭',
    notes: ['Db', 'Eb'],
    focus: 'The same two keys under their flat names. Same hand, different word.',
    group: 'Flats',
  },
  {
    id: 'lesson:12',
    order: 12,
    title: 'G♭ A♭ B♭',
    notes: ['Gb', 'Ab', 'Bb'],
    focus: 'The group of three as flats. B♭ is the one most players already know.',
    group: 'Flats',
  },
  {
    id: 'lesson:13',
    order: 13,
    title: 'D♭ E♭ G♭ A♭ B♭',
    notes: ['Db', 'Eb', 'Gb', 'Ab', 'Bb'],
    focus: 'All five blacks as flats. Read the letter, then step down — never re-count from C.',
    group: 'Flats',
  },
  {
    id: 'lesson:14',
    order: 14,
    title: 'C C♯ D D♯ E',
    notes: ['C', 'C#', 'D', 'D#', 'E'],
    focus: 'Every key in the two-black region, black and white interleaved.',
    group: 'Chromatic',
  },
  {
    id: 'lesson:15',
    order: 15,
    title: 'F F♯ G G♯ A A♯ B',
    notes: ['F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    focus: 'Every key in the three-black region. Seven in a row is the real test of the landmark.',
    group: 'Chromatic',
  },
  {
    id: 'lesson:16',
    order: 16,
    title: 'C C♯ D D♯ E F F♯ G G♯ A A♯ B',
    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    focus: 'The whole octave. Nothing new — just both regions at once, at every speed.',
    group: 'Chromatic',
  },
];

export const LESSON_GROUP_ORDER: readonly string[] = ['Naturals', 'Sharps', 'Flats', 'Chromatic'];

const LESSON_INDEX: ReadonlyMap<string, Lesson> = new Map(
  LESSON_PLAN.map((lesson) => [lesson.id, lesson]),
);

export function getLesson(id: string | undefined | null): Lesson | undefined {
  return id ? LESSON_INDEX.get(id) : undefined;
}

export function isLessonId(id: string | undefined | null): boolean {
  return getLesson(id) !== undefined;
}

/**
 * Reps needed to clear one drill.
 *
 * Four passes over the set, floored at 20 so a one- or two-note lesson still
 * takes long enough to be a drill rather than a glance.
 */
export function requiredItemsFor(lesson: Lesson): number {
  return Math.max(20, lesson.notes.length * 4);
}

/** Stable key for one lesson at one speed. */
export function drillKey(lessonId: string, seconds: number): string {
  return `${lessonId}@${seconds}`;
}
