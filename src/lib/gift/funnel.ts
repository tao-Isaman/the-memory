// Shared funnel helpers for the /gift mini-game → create flow.
//
// The CTA must survive a full login round-trip (returning users via `?next=`,
// brand-new users via onboarding) and land the person on /create with the
// recipient name prefilled. The recipient name + campaign source therefore ride
// in localStorage as a backstop, since `next` is dropped on the new-user
// onboarding path.

const GIFT_CTX_KEY = 'gift_ctx';
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2h — a stale context should not leak into an unrelated later visit

export interface GiftCtx {
  name: string;
  src: string;
}

export function setGiftCtx(ctx: GiftCtx): void {
  try {
    localStorage.setItem(GIFT_CTX_KEY, JSON.stringify({ ...ctx, ts: Date.now() }));
  } catch {
    /* private mode / storage blocked — the ?to query still covers returning users */
  }
}

export function readGiftCtx(): GiftCtx | null {
  try {
    const raw = localStorage.getItem(GIFT_CTX_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as GiftCtx & { ts?: number };
    if (!v || typeof v.name !== 'string') return null;
    if (v.ts && Date.now() - v.ts > MAX_AGE_MS) {
      clearGiftCtx();
      return null;
    }
    return { name: v.name, src: typeof v.src === 'string' ? v.src : '' };
  } catch {
    return null;
  }
}

export function clearGiftCtx(): void {
  try {
    localStorage.removeItem(GIFT_CTX_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Accept a post-login redirect target ONLY if it is an internal path — begins
 * with a single "/" and not "//" (protocol-relative) or a scheme. Guards every
 * `next` against an open-redirect.
 */
export function safeInternalPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  if (/^\/\\|%2f%2f/i.test(next)) return null; // backslash / encoded "//"
  return next;
}

/** The /create URL a gift CTA (or the onboarding hand-off) points at. */
export function giftCreateUrl(ctx: GiftCtx): string {
  const q = new URLSearchParams({
    utm_source: 'gift',
    utm_medium: 'minigame',
    utm_campaign: 'xmas_ny',
  });
  if (ctx.name) q.set('to', ctx.name);
  if (ctx.src) q.set('gift_src', ctx.src);
  return `/create?${q.toString()}`;
}
