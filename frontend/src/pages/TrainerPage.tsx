import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import {
  PianoKeyboard,
  buildHighlightMap,
  getKeyboardLayout,
  voicePitchClasses,
} from '@/features/piano';
import type { HighlightSource } from '@/features/piano';
import { useSettings } from '@/features/settings';
import { useStatistics } from '@/features/statistics';
import {
  NoteDisplay,
  SequenceStrip,
  TrainerControls,
  TransportPanel,
  useTrainerSession,
  useTrainerSetup,
} from '@/features/trainer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { instrument } from '@/lib/audio';
import { getModuleOrDefault } from '@/modules/registry';
import type { TrainerItem } from '@/features/trainer';
import styles from './pages.module.css';
import trainerStyles from '@/features/trainer/components/trainer.module.css';

/**
 * Composition root for a practice run.
 *
 * It wires the pieces together and owns none of the logic: the module supplies
 * the items, the setup hook owns the pool, the session hook owns the timing,
 * and the keyboard just renders a highlight map.
 */
export function TrainerPage() {
  const { moduleId } = useParams();
  const module = getModuleOrDefault(moduleId);

  const { settings, update } = useSettings();
  const { record } = useStatistics();

  const setup = useTrainerSetup(module);

  const meta = useMemo(
    () => ({ moduleId: module.id, moduleTitle: module.title, setLabel: setup.setLabel }),
    [module.id, module.title, setup.setLabel],
  );

  const session = useTrainerSession({
    pool: setup.items,
    intervalSeconds: settings.intervalSeconds,
    sessionSeconds: settings.sessionSeconds,
    strategyId: settings.strategyId,
    mode: settings.mode,
    meta,
    onSessionEnd: record,
  });

  const isTest = settings.mode === 'test';
  // Chord pools voice a single position; note pools light every octave.
  const isChordPool = setup.items.some((item) => item.pitchClasses.length > 1);
  const revealNext = settings.showNextItem && !isTest;

  // Which keyboard colours the legend checkboxes have switched on.
  const channels = useMemo(
    () => ({
      previous: settings.highlightPrevious,
      current: settings.highlightCurrent,
      next: settings.highlightNext,
    }),
    [settings.highlightCurrent, settings.highlightNext, settings.highlightPrevious],
  );

  /* Sound follows the item, not the render — stepId changes exactly once per item. */
  useEffect(() => {
    if (!settings.soundEnabled || !session.current) return;
    instrument.play(session.current.pitchClasses);
    // stepId is the intentional trigger; current is read at fire time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.stepId, settings.soundEnabled]);

  /**
   * A single note lights every octave so you learn all its positions.
   * A chord lights one voicing so you learn the hand shape.
   */
  const toHighlight = useMemo(() => {
    return (item: TrainerItem | null): HighlightSource | undefined => {
      if (!item) return undefined;
      const allOctaves = item.pitchClasses.length === 1 && settings.highlightAllOctaves;
      return allOctaves
        ? { pitchClasses: item.pitchClasses }
        : { midis: voicePitchClasses(item.pitchClasses) };
    };
  }, [settings.highlightAllOctaves]);

  const highlights = useMemo(
    () =>
      buildHighlightMap({
        current: channels.current ? toHighlight(session.current) : undefined,
        previous: channels.previous ? toHighlight(session.previous) : undefined,
        // Reading ahead on the keys is off unless both the colour and the reveal allow it.
        next: channels.next && revealNext ? toHighlight(session.next) : undefined,
      }),
    [channels, revealNext, session.current, session.next, session.previous, toHighlight],
  );

  useKeyboardShortcuts(
    useMemo(
      () => ({
        ' ': () => session.togglePlay(),
        ArrowRight: () => session.goNext(),
        ArrowLeft: () => session.goPrevious(),
        Escape: () => session.stop(),
        '1': () => isTest && session.isActive && session.answer('correct'),
        '2': () => isTest && session.isActive && session.answer('wrong'),
      }),
      [isTest, session],
    ),
  );

  const layout = getKeyboardLayout(settings.keyboardLayoutId);

  return (
    <AppShell
      title={`Random ${module.short} Trainer`}
      subtitle={`${setup.setLabel} · ${setup.items.length} in pool · ${settings.mode === 'test' ? 'Test mode' : 'Practice mode'}`}
      activeModuleId={module.id}
    >
      <TrainerControls
        module={module}
        setup={setup}
        intervalSeconds={settings.intervalSeconds}
        onIntervalChange={(seconds) => update('intervalSeconds', seconds)}
        sessionSeconds={settings.sessionSeconds}
        onSessionSecondsChange={(seconds) => update('sessionSeconds', seconds)}
        mode={settings.mode}
        onModeChange={(mode) => update('mode', mode)}
        disabled={session.isActive}
      />

      <div className={trainerStyles.stageGrid}>
        <section className={trainerStyles.stage}>
          <NoteDisplay
            previous={session.previous}
            current={session.current}
            next={session.next}
            showNext={revealNext}
            idleHint={
              setup.items.length === 0
                ? `Add some ${module.short.toLowerCase()} to begin`
                : 'Press START or hit Space'
            }
            onPrevious={session.goPrevious}
            onNext={session.goNext}
            navigationEnabled={session.isActive}
          />
          <SequenceStrip
            sequence={session.sequence}
            index={session.index}
            revealUpcoming={revealNext}
          />
        </section>

        <TransportPanel
          isActive={session.isActive}
          isRunning={session.isRunning}
          canStart={setup.items.length > 0}
          secondsLeft={session.secondsLeft}
          progress={session.progress}
          sessionSeconds={settings.sessionSeconds}
          sessionSecondsLeft={session.sessionSecondsLeft}
          sessionProgress={session.sessionProgress}
          elapsedSeconds={session.elapsedSeconds}
          itemsShown={session.itemsShown}
          correct={session.correct}
          wrong={session.wrong}
          mode={settings.mode}
          onStart={session.start}
          onPause={session.pause}
          onResume={session.resume}
          onStop={session.stop}
          onAnswer={session.answer}
        />
      </div>

      <PianoKeyboard
        layout={layout}
        highlights={highlights}
        highlightsVisible={!isTest}
        showNoteNames={settings.showNoteNames}
        channels={channels}
        onChannelChange={(channel, enabled) => {
          if (channel === 'current') update('highlightCurrent', enabled);
          else if (channel === 'previous') update('highlightPrevious', enabled);
          else update('highlightNext', enabled);
        }}
      />

      <p className={styles.footnote}>
        {isTest
          ? 'Test mode hides the keyboard highlights — find the keys on your real piano, then grade yourself.'
          : isChordPool
            ? 'Practice mode shows one playable voicing of the current chord so you learn the hand shape.'
            : 'Practice mode lights up every position of the current note so you can link the name to the 2–3 black-key pattern.'}
      </p>
    </AppShell>
  );
}
