import { useSyncExternalStore } from 'react';
import { eventPhase } from './config';

const subscribe = () => () => {};

/**
 * True while the Loy Krathong event window is open (through 25 Nov 2569, see LK_EVENT).
 * Seasonal entry points use it so they disappear by themselves after the festival.
 * False on the server and during hydration: the pages are prerendered, so the date has
 * to be read in the browser.
 */
export function useLoySeason(): boolean {
  return useSyncExternalStore(subscribe, () => eventPhase() === 'open', () => false);
}
