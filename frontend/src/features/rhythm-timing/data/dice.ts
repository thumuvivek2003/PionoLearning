import { beatsOf } from './noteValues';
import type { NoteValue } from './noteValues';
import type { RhythmEvent } from './score';

/**
 * Rhythms nobody wrote down.
 *
 * The reference calls it rhythm dice: pick values out of a bag until the bar is
 * full, then play it first time without preparation. Generating them is what
 * makes that possible — a written list becomes a pattern you recognise, and
 * recognising it is precisely what the practice is trying to prevent.
 */

/** How often a drawn value is silent, when rests are in the bag. */
const REST_CHANCE = 0.25;

export interface DiceOptions {
  /** Values that may be drawn. */
  palette: readonly NoteValue[];
  /** Beats in a bar. */
  beatsPerBar?: number;
  /** How many bars to fill. */
  bars?: number;
  /** Allow some of the drawn values to be rests. */
  rests?: boolean;
  random?: () => number;
}

/**
 * A bar filled exactly, drawn from the palette.
 *
 * Only values that still fit are considered, so the bar can never overflow;
 * and because every value in a palette is a multiple of its smallest, whatever
 * is left at the end can always be filled. A rhythm that did not add up would
 * teach the wrong thing quietly.
 */
export function rollBar({
  palette,
  beatsPerBar = 4,
  bars = 1,
  rests = false,
  random = Math.random,
}: DiceOptions): readonly RhythmEvent[] {
  const sorted = [...palette].sort((a, b) => beatsOf(a) - beatsOf(b));
  const smallest = sorted[0];
  if (!smallest) return [];

  const events: RhythmEvent[] = [];
  let left = beatsPerBar * bars;

  while (left > 1e-9) {
    const fits = sorted.filter((value) => beatsOf(value) <= left + 1e-9);
    const value = (fits[Math.floor(random() * fits.length)] ?? smallest) as NoteValue;
    // A bar that opens with silence leaves you nothing to come in on.
    const rest = rests && events.length > 0 && random() < REST_CHANCE;
    events.push(rest ? { value, rest: true } : { value });
    left -= beatsOf(value);
  }

  return events;
}

/** How a rolled bar reads, e.g. "Q E E H" — the shape before it is played. */
export function barShape(events: readonly RhythmEvent[]): string {
  return events
    .map((event) => {
      const letter =
        event.value === 'whole'
          ? 'W'
          : event.value === 'half'
            ? 'H'
            : event.value === 'quarter'
              ? 'Q'
              : event.value === 'eighth'
                ? 'E'
                : 'S';
      return event.rest ? `(${letter})` : letter;
    })
    .join(' ');
}
