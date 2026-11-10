import { useSyncExternalStore } from 'react';

/**
 * Whether the Loy Krathong popup has taken this page load's "one modal" turn.
 * Other prompts (push-notification modal) read it and stay away for the rest of the page
 * load, so a user never has to close two dialogs in a row; they get their turn on the
 * next visit. It latches: closing the popup does not release the turn.
 */
let taken = false;
const listeners = new Set<() => void>();

export function takeLoyPopupTurn(): void {
  if (taken) return;
  taken = true;
  listeners.forEach((l) => l());
}

export function useLoyPopupTookTurn(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => taken,
    () => false,
  );
}
