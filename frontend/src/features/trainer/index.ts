export type {
  AnswerVerdict,
  ParseResult,
  PracticeMode,
  SessionStatus,
  TrainerItem,
  TrainerModule,
  TrainerPreset,
} from './types/trainer.types';

export { useTrainerSession } from './hooks/useTrainerSession';
export type { TrainerSession, TrainerSessionOptions } from './hooks/useTrainerSession';
export { CUSTOM_PRESET_ID, useTrainerSetup } from './hooks/useTrainerSetup';
export type { TrainerSetup } from './hooks/useTrainerSetup';

export { NoteDisplay } from './components/NoteDisplay';
export { SequenceStrip } from './components/SequenceStrip';
export { TrainerControls } from './components/TrainerControls';
export { TransportPanel } from './components/TransportPanel';
