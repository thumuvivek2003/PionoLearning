/**
 * Thin, typed wrapper over localStorage.
 * Everything that persists goes through here, so swapping to IndexedDB or a
 * backend later touches exactly one file.
 */
export interface Storage {
  read<T>(key: string, fallback: T): T;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
}

function isAvailable(): boolean {
  try {
    const probe = '__prt_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const memory = new Map<string, string>();

/** Falls back to an in-memory map when storage is blocked (private mode, SSR). */
export const storage: Storage = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = isAvailable() ? window.localStorage.getItem(key) : (memory.get(key) ?? null);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  write<T>(key: string, value: T): void {
    try {
      const raw = JSON.stringify(value);
      if (isAvailable()) window.localStorage.setItem(key, raw);
      else memory.set(key, raw);
    } catch {
      /* Quota or serialisation failure must never break practice. */
    }
  },

  remove(key: string): void {
    try {
      if (isAvailable()) window.localStorage.removeItem(key);
      else memory.delete(key);
    } catch {
      /* ignore */
    }
  },
};
