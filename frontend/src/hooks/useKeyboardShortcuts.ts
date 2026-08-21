import { useEffect } from 'react';

export type ShortcutMap = Record<string, (event: KeyboardEvent) => void>;

const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Global key bindings, ignored while the user is typing in a field so the
 * notes input never swallows a space bar as "pause".
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (EDITABLE.has(target.tagName) || target.isContentEditable)) return;

      const handler = shortcuts[event.key] ?? shortcuts[event.key.toLowerCase()];
      if (!handler) return;

      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, shortcuts]);
}
