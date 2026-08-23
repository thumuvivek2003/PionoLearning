import type { Relation, RelationDrillConfig } from '../geography.types';

const RIGHT: Relation = {
  id: 'right',
  steps: 1,
  label: 'Right',
  question: 'One white key right of',
};

const LEFT: Relation = {
  id: 'left',
  steps: -1,
  label: 'Left',
  question: 'One white key left of',
};

const SKIP_RIGHT: Relation = {
  id: 'skip-right',
  steps: 2,
  label: 'Skip right',
  question: 'Two white keys right of',
};

const SKIP_LEFT: Relation = {
  id: 'skip-left',
  steps: -2,
  label: 'Skip left',
  question: 'Two white keys left of',
};

/**
 * The four relation drills of bucket 1.1.
 *
 * They are one screen with four configurations rather than four screens: the
 * question is always "which letter is N white keys from this one", and only the
 * distance and the coaching change. Adding "skip-two" later is a data entry.
 */
export const RELATION_DRILLS: Readonly<Record<string, RelationDrillConfig>> = {
  ascending: {
    id: 'ascending',
    goal: 'Right = the next natural note. No counting from C.',
    steps: [
      'Read the note, name its right-hand neighbour, then answer.',
      'Answer with a letter button, the matching key, or the letter keys C–B.',
      'On the real keyboard, play the pair upward so the ear agrees with the eye.',
    ],
    watchFor: 'Reciting "C D E F…" under your breath to get there. That is the habit this drill replaces.',
    relations: [RIGHT],
  },
  descending: {
    id: 'descending',
    goal: 'Left = the previous natural note, and C wraps back to B.',
    steps: [
      'Read the note, name what sits immediately to its left, then answer.',
      'Play the pair downward on the keyboard afterwards.',
      'Watch the wrap: left of C is B, not "nothing".',
    ],
    watchFor: 'Hesitating at C and F. Those are the two places the alphabet appears to break.',
    relations: [LEFT],
  },
  adjacent: {
    id: 'adjacent',
    goal: 'See one key, know both its neighbours — local awareness, not the whole sequence.',
    steps: [
      'The prompt names a note and a side. Answer that neighbour.',
      'Say the whole picture out loud: "This is G. Left is F. Right is A."',
      'Then play left → note → right on the keyboard.',
    ],
    watchFor: 'Answering fast in one direction and slowly in the other. Run Mixed until both are level.',
    relations: [LEFT, RIGHT],
  },
  skip: {
    id: 'skip',
    goal: 'Two white keys away, skipping the one between — the start of spatial distance.',
    steps: [
      'Read the note and the direction, then name the note two white keys away.',
      'Play the pair, then fill in the skipped note to hear what you jumped.',
      'Chain them on the keyboard: C → E → G, D → F → A.',
    ],
    watchFor: 'Counting the black keys. Skips are measured in white keys only.',
    relations: [SKIP_RIGHT, SKIP_LEFT],
  },
};

export function getRelationDrill(id: string): RelationDrillConfig {
  const config = RELATION_DRILLS[id];
  if (!config) throw new Error(`Unknown relation drill: ${id}`);
  return config;
}
