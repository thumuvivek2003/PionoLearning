import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Option } from '@/types/common.types';
import type { TrainerItem, TrainerModule } from '../types/trainer.types';

export const CUSTOM_PRESET_ID = 'custom';

interface StoredSetup {
  presetId: string;
  input: string;
}

export interface TrainerSetup {
  presetId: string;
  input: string;
  /** Parsed from `input` — the text box is always the source of truth. */
  items: readonly TrainerItem[];
  invalid: readonly string[];
  isCustom: boolean;
  /** Label used in History, e.g. "C Major" or "Custom (5 notes)". */
  setLabel: string;
  presetOptions: readonly Option[];
  selectPreset: (presetId: string) => void;
  setInput: (text: string) => void;
  restorePreset: () => void;
}

/**
 * Owns "what is in the pool" for one module.
 *
 * Choosing a preset fills the editable box; editing the box flips the
 * selection to Custom. Both paths end up parsed by the module, so the engine
 * only ever sees TrainerItem[].
 */
export function useTrainerSetup(module: TrainerModule): TrainerSetup {
  const [store, setStore] = useLocalStorage<Record<string, StoredSetup>>(
    STORAGE_KEYS.sessionSetup,
    {},
  );

  const defaults = useMemo<StoredSetup>(() => {
    const preset =
      module.presets.find((entry) => entry.id === module.defaultPresetId) ?? module.presets[0];
    return {
      presetId: preset?.id ?? CUSTOM_PRESET_ID,
      input: preset ? module.serialize(preset.build()) : '',
    };
  }, [module]);

  const setup = store[module.id] ?? defaults;

  const write = useCallback(
    (next: StoredSetup) => setStore((current) => ({ ...current, [module.id]: next })),
    [module.id, setStore],
  );

  const selectPreset = useCallback(
    (presetId: string) => {
      const preset = module.presets.find((entry) => entry.id === presetId);
      if (!preset) {
        write({ presetId: CUSTOM_PRESET_ID, input: setup.input });
        return;
      }
      write({ presetId, input: module.serialize(preset.build()) });
    },
    [module, setup.input, write],
  );

  const setInput = useCallback(
    (text: string) => {
      // Any manual edit means the preset no longer describes the pool.
      write({ presetId: CUSTOM_PRESET_ID, input: text });
    },
    [write],
  );

  const restorePreset = useCallback(() => write(defaults), [defaults, write]);

  const { items, invalid } = useMemo(() => module.parse(setup.input), [module, setup.input]);

  const presetOptions = useMemo<Option[]>(
    () => [
      ...module.presets.map((preset) => ({
        value: preset.id,
        label: preset.label,
        group: preset.group,
      })),
      { value: CUSTOM_PRESET_ID, label: 'Custom', group: 'Your own' },
    ],
    [module],
  );

  const isCustom = setup.presetId === CUSTOM_PRESET_ID;

  const setLabel = useMemo(() => {
    if (!isCustom) {
      return module.presets.find((preset) => preset.id === setup.presetId)?.label ?? 'Custom';
    }
    return `Custom (${items.length} ${items.length === 1 ? 'item' : 'items'})`;
  }, [isCustom, items.length, module.presets, setup.presetId]);

  return {
    presetId: setup.presetId,
    input: setup.input,
    items,
    invalid,
    isCustom,
    setLabel,
    presetOptions,
    selectPreset,
    setInput,
    restorePreset,
  };
}
