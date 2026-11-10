import { useSyncExternalStore } from 'react';

/**
 * Whether the Loy Krathong popup is on screen right now. Other prompts read it so that
 * only one modal shows at a time: they wait until this one is closed.
 */
let open = false;
const listeners = new Set<() => void>();

export function setLoyPopupOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  listeners.forEach((l) => l());
}

export function useLoyPopupOpen(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
    () => false,
  );
}
