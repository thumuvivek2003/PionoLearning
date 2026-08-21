import type { TrainerModule } from '@/features/trainer/types/trainer.types';
import { chordTrainerModule } from './chord-trainer';
import { noteTrainerModule } from './note-trainer';

/**
 * Registry of pluggable trainer projects.
 *
 * ── Adding a new project ──────────────────────────────────────────────
 * 1. Create src/modules/<your-module>/index.ts
 * 2. Export an object satisfying TrainerModule
 * 3. Add it to the array below
 *
 * Nothing else in the app has to change: routing, the sidebar, the session
 * engine, the keyboard and the statistics all read from this registry.
 */
const REGISTERED_MODULES: readonly TrainerModule[] = [noteTrainerModule, chordTrainerModule];

const MODULE_INDEX: ReadonlyMap<string, TrainerModule> = new Map(
  REGISTERED_MODULES.map((module) => [module.id, module]),
);

export function listModules(): readonly TrainerModule[] {
  return REGISTERED_MODULES;
}

export function getModule(id: string | undefined): TrainerModule | undefined {
  return id ? MODULE_INDEX.get(id) : undefined;
}

export function getModuleOrDefault(id: string | undefined): TrainerModule {
  return getModule(id) ?? (REGISTERED_MODULES[0] as TrainerModule);
}

export const DEFAULT_MODULE_ID = (REGISTERED_MODULES[0] as TrainerModule).id;
