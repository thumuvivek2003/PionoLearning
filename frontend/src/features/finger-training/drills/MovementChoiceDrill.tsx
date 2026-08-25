import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  RunCounters,
  StepStrip,
  WeakSpots,
  formatMs,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { handShort } from '../data/fingers';
import { placeRun, startsFor } from '../data/intervalRuns';
import type { RunNote } from '../data/intervalRuns';
import {
  TECHNIQUES,
  classify,
  situationSteps,
  techniqueCorrection,
  techniqueLabel,
  techniqueWhy,
} from '../data/movement';
import type { Situation, Technique } from '../data/movement';
import { KIND_LABELS, generateSituation } from '../data/movementDrills';
import type { MovementDrillConfig, SituationKind } from '../data/movementDrills';
import type { Hand } from '../finger.types';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** Wide enough for a leap of seven white keys from anywhere sensible. */
const LAYOUT_ID = '49';

/** A decision should take a moment's thought, not a minute's. */
const DECISION_TARGET_MS = 2500;

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

/** Where a run is: choosing the movement, or making it. */
type Phase = 'decide' | 'play';

interface Dealt {
  kind: SituationKind;
  situation: Situation;
  technique: Technique;
  keys: readonly PianoKey[];
}

/**
 * Turns a situation into notes on a board, or null when it will not fit.
 *
 * The notes are the notes in either hand — a descending line descends whichever
 * hand plays it. Only the fingering is hand-specific, and the references write
 * it right-hand-first, so the left hand is given the shape without numbers
 * rather than numbers that would be wrong for it.
 */
function place(layout: KeyboardLayout, situation: Situation, hand: Hand): Dealt['keys'] | null {
  const notes: readonly RunNote[] = situation.offsets.map((offset, index) => ({
    offset,
    finger: hand === 'right' ? situation.fingers?.[index] : undefined,
  }));
  const starts = startsFor(layout, notes);
  const start = starts[Math.floor(Math.random() * starts.length)];
  return start ? (placeRun(layout, start, notes)?.keys ?? null) : null;
}

/**
 * 2.8.1 – 2.8.7 — choosing the movement, not just making it.
 *
 * The reference's three-question test is the whole bucket: how far is it, is the
 * line continuous, and what happens after. Those questions have one answer each,
 * so situations are *generated* and *classified* rather than listed — the drill
 * can deal endlessly and never repeat itself, which is what stops the mixed
 * practice from being memorised.
 *
 * Decide mode is the exercise proper: name the movement before you are allowed
 * to play it. A wrong answer is answered with the reason rather than a buzz,
 * because "that is further than the hand comfortably spans" is the thing worth
 * keeping. The ledger is kept per movement, so the panel names the decision you
 * keep getting wrong — which is a more useful sentence than any score.
 */
export function MovementChoiceDrill({ config }: { config: MovementDrillConfig }) {
  const [hand, setHand] = useState<Hand>('right');
  const [deciding, setDeciding] = useState(config.decide);
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  const [dealt, setDealt] = useState<Dealt | null>(null);
  const [phase, setPhase] = useState<Phase>(config.decide ? 'decide' : 'play');
  const [given, setGiven] = useState<Technique | null>(null);
  const [index, setIndex] = useState(0);
  const [landed, setLanded] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [decisions, setDecisions] = useState({ right: 0, asked: 0 });
  const shownAt = useRef<number>(performance.now());

  /** Deals a situation, and somewhere on the board to play it. */
  const deal = useCallback(() => {
    // A shape that will not fit is redealt rather than squeezed onto the board.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const kind = config.kinds[Math.floor(Math.random() * config.kinds.length)] as SituationKind;
      const situation = generateSituation(kind);
      const keys = place(layout, situation, hand);
      if (keys) {
        setDealt({ kind, situation, technique: classify(situation.offsets), keys });
        break;
      }
    }
    setPhase(deciding ? 'decide' : 'play');
    setGiven(null);
    setIndex(0);
    setLanded([]);
    setWrong(null);
    setNote(null);
    shownAt.current = performance.now();
  }, [config.kinds, deciding, hand, layout]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, deciding, hand]);

  const keys = dealt?.keys ?? [];
  const expected = keys[index];
  const complete = keys.length > 0 && index >= keys.length && phase === 'play';

  const decide = (technique: Technique) => {
    if (phase !== 'decide' || given !== null || !dealt) return;

    const isRight = technique === dealt.technique;
    setGiven(technique);
    setDecisions((current) => ({ right: current.right + (isRight ? 1 : 0), asked: current.asked + 1 }));
    record(
      techniqueLabel(dealt.technique),
      isRight,
      isRight ? performance.now() - shownAt.current : null,
    );
    if (!isRight) stumble();
    setNote(isRight ? techniqueWhy(dealt.technique) : techniqueCorrection(technique, dealt.technique));
    // The run is played either way — knowing the answer is only half of it.
    window.setTimeout(() => setPhase('play'), isRight ? 700 : 1600);
  };

  const press = (key: PianoKey) => {
    if (phase !== 'play' || complete || !expected) return;

    if (key.midi !== expected.midi) {
      stumble();
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }

    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    setLanded((current) => [...current, key.midi]);

    const next = index + 1;
    setIndex(next);
    if (next >= keys.length) finish();
  };

  const spots = weakSpots(book, { targetMs: DECISION_TARGET_MS });
  const steps = dealt ? situationSteps(dealt.situation.offsets) : [];
  const strip = keys.map((key, position) => {
    const finger = hand === 'right' ? dealt?.situation.fingers?.[position] : undefined;
    return position === 0
      ? (finger ? `${key.sharpName}·${finger}` : key.sharpName)
      : `${key.sharpName}${finger ? `·${finger}` : ''}`;
  });
  const rate = decisions.asked === 0 ? null : decisions.right / decisions.asked;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Hand" hint="The left hand meets these shapes mirrored.">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>
          <Toggle
            checked={deciding}
            onChange={setDeciding}
            label="Decide first"
            description="Name the movement before the notes unlock — the exercise proper."
          />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New situation
          </Button>
          <RunCounters stats={stats} runsLabel="Situations" />
          {deciding && (
            <CounterRow>
              <Counter
                label="Decisions"
                value={`${decisions.right}/${decisions.asked}`}
                hint={rate === null ? 'name it first' : `${Math.round(rate * 100)}% right`}
              />
              <Counter label="Last run" value={formatMs((stats.lastSeconds ?? 0) * 1000)} />
            </CounterRow>
          )}
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more situations." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${handShort(hand)} · ${dealt ? KIND_LABELS[dealt.kind] : ''}`,
          steps.length === 1
            ? `${Math.abs(steps[0] as number)} white ${Math.abs(steps[0] as number) === 1 ? 'key' : 'keys'} away`
            : `${keys.length} notes`,
        ].join(' · ')}
        wide={phase === 'decide'}
        footer={
          <>
            {complete && (
              <Chip tone="accent">
                {keys.map((key) => key.sharpName).join(' → ')}
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && note && (
              <Chip tone={given !== null && given !== dealt?.technique ? 'danger' : 'accent'}>{note}</Chip>
            )}
            {!complete && !note && phase === 'decide' && <Chip>Which movement does this need?</Chip>}
            {!complete && !note && phase === 'play' && (
              <Chip>
                Note {index + 1} of {keys.length}
              </Chip>
            )}
          </>
        }
      >
        {phase === 'decide' ? '?' : (dealt ? techniqueLabel(dealt.technique) : '—')}
      </DrillPrompt>

      <StepStrip
        items={strip}
        index={phase === 'play' && !complete ? index : -1}
        showProgress={phase === 'play'}
        wrong={wrong !== null}
        label="The situation"
      />

      {phase === 'decide' && (
        <div className={styles.choices}>
          {TECHNIQUES.map((technique) => (
            <button
              key={technique}
              type="button"
              className={styles.choice}
              disabled={given !== null}
              onClick={() => decide(technique)}
            >
              {techniqueLabel(technique)}
            </button>
          ))}
        </div>
      )}

      <div className={styles.board}>
        <HandKeyboard
          layoutId={LAYOUT_ID}
          done={landed}
          // The first note is where the hand starts; the rest is the question.
          lit={phase === 'play' && index === 0 && keys[0] ? [keys[0].midi] : undefined}
          wrong={wrong}
          showNames={showNames}
          onKeyPress={phase === 'play' ? press : undefined}
          footerNote={
            phase === 'decide' ? 'Decide before you play' : complete ? 'Landed' : 'Play it as you decided'
          }
        />
      </div>

      <p className={styles.note}>
        How far is it · is the line continuous · what happens after. Three questions, one answer.
      </p>
    </DrillShell>
  );
}
