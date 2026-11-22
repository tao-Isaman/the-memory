// Pure date helpers for the /gift mini-game, in Asia/Bangkok time, kept out of
// the React component so they can be unit-tested without a DOM.

const BANGKOK = 'Asia/Bangkok';

/** The day/month/Buddhist-year-2-digit parts of a date in Bangkok time. */
export function bangkokParts(now: Date = new Date()): { dd: string; mm: string; beYear: number; gYear: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BANGKOK,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const gYear = Number(get('year'));
  return { dd: get('day'), mm: get('month'), beYear: gYear + 543, gYear };
}

/**
 * The 6-digit code the player must enter: today's date in Bangkok as
 * DDMMYY with the Buddhist-era year's last two digits (e.g. 23 Nov 2026 →
 * 23/11/69 → "231169").
 */
export function todayCode(now: Date = new Date()): string {
  const { dd, mm, beYear } = bangkokParts(now);
  return dd + mm + String(beYear % 100).padStart(2, '0');
}

/** A human-readable hint for the code: "23 / 11 / 69". */
export function todayCodeHint(now: Date = new Date()): string {
  const { dd, mm, beYear } = bangkokParts(now);
  return `${dd} / ${mm} / ${String(beYear % 100).padStart(2, '0')}`;
}

export type GiftEffect = 'snow' | 'fireworks';

/**
 * Which celebratory effect the open scene shows, by Bangkok date:
 * snow through 26 Dec, New-Year fireworks 27 Dec – 15 Jan, snow otherwise
 * (the default for the rest of the Christmas/New-Year campaign window).
 */
export function effectForDate(now: Date = new Date()): GiftEffect {
  const { dd, mm } = bangkokParts(now);
  const m = Number(mm);
  const d = Number(dd);
  const afterDec27 = m === 12 && d >= 27;
  const beforeJan16 = m === 1 && d <= 15;
  return afterDec27 || beforeJan16 ? 'fireworks' : 'snow';
}
