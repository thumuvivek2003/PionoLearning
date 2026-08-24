import type { Letter } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import { LANDMARK_RULES } from './blackKeys';

/**
 * The two anchors bucket 1.4 is built on, and the blocks they open.
 *
 * C and F are the only white keys that can be found with no reference to
 * another note — everything else in level 1 is described from them. That makes
 * them the two places a run can start, and the two places a run must stop:
 * "C D E" and "F G A B" are not arbitrary groups, they are the stretches
 * between one landmark and the next.
 */
export const LANDMARK_LETTERS: readonly Letter[] = ['C', 'F'];

export function isLandmark(key: PianoKey): boolean {
  return !key.isBlack && LANDMARK_LETTERS.includes(key.sharpName as Letter);
}

/** How a run walks away from its landmark. */
export type ChainKind =
  /** White keys up to the next landmark: C D E, or F G A B. */
  | 'white-block'
  /** Eight white keys, landmark to landmark — a full octave run. */
  | 'white-octave'
  /** Every key up to the next landmark: C C# D D# E, or F F# G G# A A# B. */
  | 'chromatic-block';

/** Keys of a full octave run, counting both ends. */
const OCTAVE_RUN_LENGTH = 8;

/**
 * The run that starts at `anchor`, or null when the board runs out first.
 *
 * A truncated run would teach the wrong shape — "F G A" is not a block — so a
 * chain that cannot finish is no chain at all and the caller picks another
 * anchor.
 */
export function chainFrom(
  layout: KeyboardLayout,
  anchor: PianoKey,
  kind: ChainKind,
): readonly PianoKey[] | null {
  const ahead = layout.keys.filter(
    (key) => key.midi >= anchor.midi && (kind === 'chromatic-block' || !key.isBlack),
  );
  if (ahead[0]?.midi !== anchor.midi) return null;

  if (kind === 'white-octave') {
    const run = ahead.slice(0, OCTAVE_RUN_LENGTH);
    return run.length === OCTAVE_RUN_LENGTH ? run : null;
  }

  // A block is everything up to — but not including — the next landmark.
  const run: PianoKey[] = [anchor];
  for (const key of ahead.slice(1)) {
    if (isLandmark(key)) return run;
    run.push(key);
  }
  return null;
}

/** Every anchor on the board that can carry a complete run. */
export function chainAnchors(
  layout: KeyboardLayout,
  landmarks: readonly Letter[],
  kind: ChainKind,
): readonly PianoKey[] {
  return layout.keys.filter(
    (key) =>
      !key.isBlack &&
      landmarks.includes(key.sharpName as Letter) &&
      chainFrom(layout, key, kind) !== null,
  );
}

/** How a chain reads, e.g. "C D E" — for copy and for the finished chip. */
export function chainShape(keys: readonly PianoKey[]): string {
  return keys.map((key) => key.sharpName).join(' ');
}

/** The rule that finds a landmark, e.g. "Left of the group of 2". */
export function landmarkWhere(letter: Letter): string {
  return LANDMARK_RULES[letter].where;
}
