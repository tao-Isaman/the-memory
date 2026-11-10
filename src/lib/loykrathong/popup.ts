/**
 * When to show the Loy Krathong popup to a signed-in user. Pure, so it can be tested.
 *
 * Shown at most once per user per day, only while the event window is open, and never
 * where it would get in the way: when the user is already heading into a template or is
 * editing an existing memory. (Payment-return and memory-viewer pages are outside the
 * signed-in app layout that mounts the popup, so they never see it.)
 */
export interface PopupContext {
  seasonOpen: boolean;
  /** Query string of the current page, e.g. "?template=loykrathong". */
  search: string;
  /** Local calendar day, "YYYY-MM-DD". */
  today: string;
  /** Day the popup was last shown to this user on this device, or null. */
  lastShownDay: string | null;
}

export function shouldShowLoyPopup(c: PopupContext): boolean {
  if (!c.seasonOpen) return false;
  const params = new URLSearchParams(c.search);
  if (params.has('template') || params.has('edit')) return false;
  return c.lastShownDay !== c.today;
}

export function loyPopupKey(userId: string): string {
  return `loy_popup_shown:${userId}`;
}

/** Local calendar day as "YYYY-MM-DD". */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
