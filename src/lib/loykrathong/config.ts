// Loy Krathong online 2569 — "หมู่บ้านน้องปู" mini-game configuration.
//
// All coordinates are in MAP pixels (the generated map is 1024x1536). The camera
// scales the map to the viewport, so nothing here depends on screen size.

export const LK_MAP = {
  url: '/game/loykrathong/map.webp',
  w: 1024,
  h: 1536,
} as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/**
 * Where the crab's feet may stand. Union of rectangles traced over the map art:
 * the plaza + stone path, the strip in front of the shop, the gaps beside the
 * palm clusters, and the pier.
 */
export const LK_WALKABLE: Rect[] = [
  { x: 420, y: 370, w: 410, h: 680 }, // plaza + path (between the houses and the river bank)
  { x: 300, y: 690, w: 130, h: 320 }, // west strip between the palms and the plaza
  { x: 50, y: 660, w: 390, h: 55 }, // in front of the shop counter
  { x: 830, y: 630, w: 180, h: 120 }, // east strip below the big tree
  { x: 462, y: 1040, w: 142, h: 250 }, // the pier
];

export function isWalkable(x: number, y: number): boolean {
  for (const r of LK_WALKABLE) if (inRect(r, x, y)) return true;
  return false;
}

/** Standing inside one of these shows the context action button. */
export const LK_HOTSPOTS = {
  shop: { x: 50, y: 655, w: 390, h: 65 } as Rect,
  pier: { x: 448, y: 1140, w: 170, h: 150 } as Rect,
};

export const LK_SPAWN = { x: 620, y: 820 };

/** Where a freshly floated krathong appears (just past the pier tip). */
export const LK_DROP = { x: 533, y: 1330 };

/** Water band the krathongs drift in. */
export const LK_RIVER = { top: 1300, bottom: 1480, left: -90, right: 1110 };

export const LK_WALK_SPEED = 170; // map px per second
export const LK_SPRITE_SCALE = 2; // 32px grid -> 64px on the map

export const LK_DESIGNS = ['banana', 'lotus', 'donut', 'coconut', 'icecream', 'heart'] as const;
export type KrathongDesign = (typeof LK_DESIGNS)[number];

export function krathongSpriteUrl(design: KrathongDesign): string {
  return `/game/loykrathong/krathong-${design}.png`;
}

/** Shell colours a player can pick (keys are stored in localStorage + DB). */
export const LK_COLORS = {
  pink: '#FF6B9D',
  red: '#E63946',
  orange: '#FF8C42',
  gold: '#D4A84B',
  green: '#3FA66B',
  blue: '#457B9D',
  sky: '#5BA4CF',
  purple: '#9B8EC4',
} as const;
export type ShellColor = keyof typeof LK_COLORS;

export const LK_ACCESSORIES = ['none', 'flower', 'hat', 'lantern'] as const;
export type Accessory = (typeof LK_ACCESSORIES)[number];

export const LK_ROOM_MAX = 40;
export const LK_ROOM_COUNT = 20;

export const LK_NAME_MIN = 2;
export const LK_NAME_MAX = 12;
export const LK_WISH_MAX = 140;
export const LK_TO_MAX = 30;
export const LK_CHAT_MAX = 120;

/** Seconds a guest must wait between two krathongs (server-enforced). */
export const LK_FLOAT_COOLDOWN_S = 20;

/**
 * Event window (Bangkok time). Loy Krathong 2569 is 24 Nov 2026.
 * Outside the window the page shows a countdown / thank-you screen.
 * `?preview=1` bypasses the gate for testing.
 */
export const LK_EVENT = {
  year: 2569,
  opensAt: Date.parse('2026-11-10T00:00:00+07:00'),
  closesAt: Date.parse('2026-11-26T00:00:00+07:00'),
  dayAt: Date.parse('2026-11-24T00:00:00+07:00'),
};

export type EventPhase = 'before' | 'open' | 'after';

export function eventPhase(now: number = Date.now()): EventPhase {
  if (now < LK_EVENT.opensAt) return 'before';
  if (now >= LK_EVENT.closesAt) return 'after';
  return 'open';
}
