// Time-in-app tracking for signed-in users. Mirrors lib/view-tracking.ts (the recipient
// equivalent) — best-effort analytics that must never block or break the UI.
//
// The Supabase access token travels in the BODY, not an Authorization header: the
// end-of-session flush uses navigator.sendBeacon, which cannot set custom headers. The
// server derives user_id from that token and never trusts a client-supplied id.

const ENDPOINT = '/api/app/session';

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Fresh id for one app session (one visit to the signed-in app). */
export function newAppSessionId(): string {
  return uuid();
}

/** True when running as an installed PWA rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

type StartPayload = {
  action: 'start';
  sessionId: string;
  token: string;
  locale: string;
  isPwa: boolean;
};

type UpdatePayload = {
  action: 'heartbeat' | 'end';
  sessionId: string;
  token: string;
  /** Absolute accumulated FOREGROUND seconds. The server takes GREATEST(stored, this), so
   *  a late or out-of-order beacon can never shrink a session. */
  durationSeconds: number;
  pageViews: number;
};

export type AppSessionPayload = StartPayload | UpdatePayload;

export function sendAppSessionEvent(payload: AppSessionPayload, useBeacon = false): void {
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
    // best-effort; analytics must never break the app
  }
}
