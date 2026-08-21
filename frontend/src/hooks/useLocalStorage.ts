import { useCallback, useState } from 'react';
import { storage } from '@/lib/storage';

/** State that survives a reload. Same shape as useState. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => storage.read(key, initial));

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof next === 'function' ? (next as (current: T) => T)(current) : next;
        storage.write(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    storage.remove(key);
    setValue(initial);
  }, [initial, key]);

  return [value, update, reset] as const;
}
