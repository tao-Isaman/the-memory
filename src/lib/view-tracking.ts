// Phase 0: anonymous recipient view-tracking client helpers.
// Best-effort analytics — every call is wrapped so it can never break the viewer.

const VIEWER_ID_KEY = 'thememory_viewer_id';
const ENDPOINT = '/api/memory/view';

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // RFC4122 v4 fallback (keeps the value valid for the UUID column).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable anonymous id for this viewer (persists in localStorage across memories). */
export function getViewerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(VIEWER_ID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(VIEWER_ID_KEY, id);
  }
  return id;
}

/** Fresh id for a single viewing session (one open of a memory). */
export function newSessionId(): string {
  return uuid();
}

type StartPayload = {
  action: 'start';
  viewId: string;
  memoryId: string;
  viewerId: string;
  isOwner: boolean;
  storiesTotal: number;
};

type UpdatePayload = {
  action: 'progress' | 'end';
  viewId: string;
  maxStoryReached: number;
  completed: boolean;
  durationSeconds: number;
};

export type ViewEventPayload = StartPayload | UpdatePayload;

/** Send a view event. Uses sendBeacon for end-of-session flushes so it survives page unload. */
export function sendViewEvent(payload: ViewEventPayload, useBeacon = false): void {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify(payload);
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body,
    });
  } catch {
    // best-effort; never block the UI on analytics
  }
}
