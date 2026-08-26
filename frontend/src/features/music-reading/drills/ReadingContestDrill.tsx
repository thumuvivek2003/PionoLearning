import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Chip, Cover } from '@/components/ui';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  TimerBar,
  WeakSpots,
  useAnswerDeadline,
  useScoreBook,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { clefName, noteAt } from '../data/staff';
import { altersLetter, signatureOf, signatureSteps } from '../data/keySignatures';
import type { ReadingContestConfig } from '../data/contestDrills';
import { Staff } from '../components/Staff';
import type { StaffMark } from '../components/Staff';
import { ReadingKeyboard } from '../components/ReadingKeyboard';
import styles from '../components/reading.module.css';

const LAYOUT_ID = '49';
const TARGET_MS = 3000;

/** What one round cost. */
interface Scored {
  label: string;
  seconds: number | null;
  mistakes: number;
  expired: boolean;
}

/**
 * 6.10.10 — the level's final test.
 *
 * Ten rounds of reading, arriving without warning: single notes in both clefs,
 * runs that step and runs that leap, two key signatures, and one round with the
 * keyboard covered. No round asks anything a previous bucket did not teach.
 *
 * The card is the output. A total says whether the run went well and nothing
 * about why — a bass-clef problem and a key-signature problem produce the same
 * number and need completely different practice — so every round is recorded on
 * its own line.
 */
export function ReadingContestDrill({ config }: { config: ReadingContestConfig }) {
  const { settings } = useSettings();
  const { book, record, clear } = useScoreBook();

  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [start, setStart] = useState(0);
  const [card, setCard] = useState<readonly Scored[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const mistakes = useRef(0);
  const closing = useRef(false);

  const done = round >= config.rounds.length;
  const at = config.rounds[round];

  /** The run this round shows, drawn once from the round's own index. */
  const steps = useMemo(() => {
    if (!at) return [];
    const from = at.starts[start % at.starts.length] ?? 0;
    const size = at.skips ? 2 : 1;
    return Array.from({ length: at.length }, (_entry, position) => from + position * size);
  }, [at, start]);

  const notes = useMemo(
    () => (at ? steps.map((step) => noteAt(at.clef, step)) : []),
    [at, steps],
  );

  /** What the signature does to a letter, if one is in force. */
  const shiftFor = useCallback(
    (letter: string) => {
      if (!at?.key) return 0;
      const signature = signatureOf(at.key);
      if (!signature || !altersLetter(at.key, letter)) return 0;
      return signature.kind === 'sharp' ? 1 : -1;
    },
    [at?.key],
  );

  const closeRound = useCallback(
    (expired: boolean) => {
      if (closing.current || !at) return;
      closing.current = true;
      const seconds =
        startedAt.current === null ? null : (performance.now() - startedAt.current) / 1000;
      setCard((current) => [...current, { label: at.label, seconds, mistakes: mistakes.current, expired }]);
      record(at.label, !expired && mistakes.current === 0, seconds === null ? null : seconds * 1000);
      setRound((current) => current + 1);
      setIndex(0);
      setStart((current) => current + 3);
      setWrong(null);
      startedAt.current = null;
      mistakes.current = 0;
      closing.current = false;
    },
    [at, record],
  );

  const deadline = useAnswerDeadline({
    ms: done ? 0 : (at?.seconds ?? 0) * 1000,
    active: !done,
    resetKey: `${round}`,
    onExpire: () => closeRound(true),
  });

  const press = (key: PianoKey) => {
    if (done || !at) return;
    const note = notes[index];
    if (!note) return;

    const wanted = note.midi + shiftFor(note.letter);
    if (key.midi !== wanted) {
      mistakes.current += 1;
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 400);
      return;
    }

    if (startedAt.current === null) startedAt.current = performance.now();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    const next = index + 1;
    setIndex(next);
    if (next >= notes.length) closeRound(false);
  };

  const restart = () => {
    setRound(0);
    setIndex(0);
    setStart(0);
    setCard([]);
    setWrong(null);
    startedAt.current = null;
    mistakes.current = 0;
    closing.current = false;
    clear();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const total = card.reduce((sum, entry) => sum + (entry.seconds ?? 0), 0);
  const clean = card.filter((entry) => entry.mistakes === 0 && !entry.expired).length;
  const slips = card.reduce((sum, entry) => sum + entry.mistakes, 0);

  const marks: readonly StaffMark[] = notes.map((note, position) => ({
    step: note.step,
    tone: position < index ? 'success' : position === index ? 'accent' : 'muted',
    label: position < index ? note.letter : undefined,
  }));

  const signature = useMemo(() => {
    if (!at?.key) return [];
    const kind = signatureOf(at.key)?.kind;
    if (!kind) return [];
    return signatureSteps(at.key, at.clef).map((step) => ({ step, accidental: kind }));
  }, [at]);

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          <CounterRow>
            <Counter label="Round" value={`${Math.min(round + 1, config.rounds.length)}/${config.rounds.length}`} hint="of the run" />
            <Counter label="Clean" value={`${clean}/${card.length}`} hint="no slips, in time" />
          </CounterRow>
          <CounterRow>
            <Counter label="Total" value={total === 0 ? '—' : `${total.toFixed(1)}s`} hint="across the run" />
            <Counter label="Slips" value={`${slips}`} hint="wrong keys" />
          </CounterRow>
          <Button variant="secondary" icon="reset" onClick={restart} block>
            New run
          </Button>
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — finish a run." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={
          done
            ? `Run complete — ${clean} of ${config.rounds.length} clean in ${total.toFixed(1)}s`
            : `${at?.label ?? ''} · ${at?.brief ?? ''}`
        }
        footer={
          <>
            {done && (
              <Chip tone={clean === config.rounds.length ? 'accent' : 'neutral'}>
                {slips} slip{slips === 1 ? '' : 's'} · {card.filter((e) => e.expired).length} out of time
              </Chip>
            )}
            {!done && wrong !== null && <Chip tone="danger">Not that one</Chip>}
            {!done && wrong === null && (
              <Chip tone={at?.key ? 'accent' : 'neutral'}>
                {at?.key ? `${at.key} major — the signature applies` : `${clefName(at?.clef ?? 'treble')} clef`}
                {' · '}
                {index + 1} of {notes.length}
              </Chip>
            )}
          </>
        }
      >
        {done ? '✓' : (notes[index]?.name ?? '?')}
      </DrillPrompt>

      {!done && at && (
        <Staff clef={at.clef} marks={marks} signature={signature} label={`${at.label} round`} />
      )}

      {!done && (at?.seconds ?? 0) > 0 && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="This round" />
      )}

      {!done && (
        <div className={styles.board}>
          <Cover covered={at?.blind === true} note="Covered — read it and reach">
            <ReadingKeyboard
              layoutId={LAYOUT_ID}
              secondary={wrong === null ? undefined : [wrong]}
              showNames={at?.blind !== true}
              onKeyPress={press}
              footerNote="Play the run left to right"
            />
          </Cover>
        </div>
      )}

      {card.length > 0 && (
        <ol className={styles.card} aria-label="Contest card">
          {card.map((entry, position) => (
            <li
              key={`${entry.label}-${position}`}
              className={cn(styles.cardRow, (entry.mistakes > 0 || entry.expired) && styles.cardRowMiss)}
            >
              <span className={styles.cardIndex}>{position + 1}</span>
              <span>{entry.label}</span>
              <span className={styles.cardTime}>
                {entry.seconds === null ? '—' : `${entry.seconds.toFixed(1)}s`}
              </span>
              <span>{entry.expired ? 'out of time' : entry.mistakes === 0 ? '✓' : `${entry.mistakes}✗`}</span>
            </li>
          ))}
        </ol>
      )}

      <p className={styles.note}>
        Ten rounds, no warning. The card is the point — a total says how the run went and nothing
        about which reading skill let you down.
      </p>
    </DrillShell>
  );
}
