/** Which hand a challenge is played with. */
export type Hand = 'right' | 'left';

/** The chord qualities level 8 recalls at speed. */
export type Quality = 'major' | 'minor' | 'dim';

/**
 * What a round asks for.
 *
 * Level 8 is every earlier level asked again without warning, so a challenge is
 * a discriminated union rather than a pile of optional fields: a round is
 * exactly one of these, and the engine never has to guess which.
 */
export type Challenge =
  | {
      kind: 'note';
      /** Note names in play, spelled the way they are called out. */
      notes: readonly string[];
      /** Octaves a note may be asked in. */
      octaves: readonly number[];
    }
  | {
      kind: 'name-note';
      notes: readonly string[];
      octaves: readonly number[];
      /** Ask which octave it was rather than which note. */
      askOctave: boolean;
    }
  | {
      kind: 'scale';
      keys: readonly string[];
      direction: 'up' | 'down' | 'both';
    }
  | {
      kind: 'chord';
      roots: readonly string[];
      qualities: readonly Quality[];
      /** Positions a chord may be asked in. 0 is root position. */
      inversions: readonly number[];
    }
  | {
      kind: 'name-chord';
      roots: readonly string[];
      qualities: readonly Quality[];
    }
  | {
      kind: 'progression';
      keys: readonly string[];
      /** Roman numeral sequences the round may draw. */
      sequences: readonly (readonly string[])[];
    }
  | {
      kind: 'hear-note';
      notes: readonly string[];
      octaves: readonly number[];
      /** How many notes sound in a row before you play them back. */
      length: number;
    }
  | {
      kind: 'hear-chord';
      roots: readonly string[];
      qualities: readonly Quality[];
      /** Name the quality rather than playing the chord back. */
      nameOnly: boolean;
    }
  | {
      kind: 'rhythm';
      /**
       * Which beats of a bar are struck, counted from 0 in quarters.
       *
       * A rest is simply a beat that is not listed, which is what a rest is —
       * the absence of a strike, not a thing to play.
       */
      beats: readonly number[];
      bars: number;
      /** The key to strike. A rhythm has one note and nothing else. */
      note: string;
    }
  | {
      kind: 'piece';
      key: string;
      /** One entry per bar: the chord beneath, and the melody over it. */
      bars: readonly PieceBar[];
    };

/** One bar of the closing piece. */
export interface PieceBar {
  /** The roman numeral the left hand plays on beat one. */
  numeral: string;
  /** Scale degrees the right hand plays, one per beat. */
  melody: readonly number[];
}

/** One thing to play or answer, once a round has been dealt. */
export interface Round {
  /** What the prompt reads. */
  prompt: string;
  /** How the round is filed in the ledger. */
  scoreKey: string;
  /** The keys to press, in order. Empty for a naming round. */
  keys: readonly number[];
  /**
   * What each key is called here.
   *
   * Carried alongside because a key is unambiguous and its spelling is not: a
   * round that asked for Ab major must show Ab, not G#.
   */
  labels: readonly string[];
  /** Choices for a naming round, correct one included. */
  choices: readonly { value: string; label: string; sub: string }[];
  /** The right answer for a naming round. */
  answer: string;
  /** How many keys belong to the first item — the reaction, not the run. */
  firstItem: number;
  /** Which beat each key is due on, for the rounds played against a click. */
  dueAt?: readonly number[];
  /** True when the round is heard rather than read. */
  heard?: boolean;
}
