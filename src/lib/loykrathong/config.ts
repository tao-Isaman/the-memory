// Loy Krathong online 2569 — "หมู่บ้านน้องปู" mini-game configuration.
//
// Four scenes in a ring; walking off the left/right edge of a scene moves to the
// neighbour. All coordinates are in MAP pixels (every map is 1024x1536). The
// camera scales the map to cover the viewport, so nothing here depends on screen size.

export const LK_MAP_W = 1024;
export const LK_MAP_H = 1536;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export const LK_SCENES = ['village', 'temple', 'bangkok', 'chiangmai'] as const;
export type SceneId = (typeof LK_SCENES)[number];

export interface SceneExit {
  /** Standing inside this zone triggers the scene change. */
  zone: Rect;
  to: SceneId;
  /** Where the player appears in the destination scene. */
  entry: Point;
}

export interface SceneConfig {
  id: SceneId;
  mapUrl: string;
  /** Union of rectangles the crab's feet may stand in. */
  walkable: Rect[];
  /** Only the village has the krathong shop. */
  shop?: Rect;
  /** Standing here with a krathong shows the float button. */
  pier: Rect;
  spawn: Point;
  /** Where a freshly floated krathong appears. */
  drop: Point;
  /** Water bands krathongs drift in (right to left, wrapping inside their lane). */
  lanes: Rect[];
  /** Lane a fresh krathong belongs to (it starts at `drop`). */
  dropLane: number;
  exits: { left: SceneExit; right: SceneExit };
}

const EDGE = 26; // exit zone depth at the map edge
const ENTRY = 44; // where you land after crossing an edge

export const SCENES: Record<SceneId, SceneConfig> = {
  village: {
    id: 'village',
    mapUrl: '/game/loykrathong/village.webp',
    walkable: [
      { x: 360, y: 430, w: 540, h: 490 }, // plaza + paths, between the houses and the bank
      { x: 880, y: 495, w: 144, h: 80 }, // path to the right edge
      { x: 0, y: 720, w: 400, h: 120 }, // in front of the shop, out to the left edge
      { x: 460, y: 920, w: 110, h: 280 }, // the pier
    ],
    shop: { x: 20, y: 715, w: 360, h: 60 },
    pier: { x: 460, y: 1060, w: 110, h: 140 },
    spawn: { x: 640, y: 700 },
    drop: { x: 512, y: 1250 },
    lanes: [{ x: -90, y: 1240, w: 1200, h: 230 }],
    dropLane: 0,
    exits: {
      left: { zone: { x: 0, y: 730, w: EDGE, h: 100 }, to: 'chiangmai', entry: { x: LK_MAP_W - ENTRY, y: 830 } },
      right: { zone: { x: LK_MAP_W - EDGE, y: 495, w: EDGE, h: 80 }, to: 'temple', entry: { x: ENTRY, y: 800 } },
    },
  },
  temple: {
    id: 'temple',
    mapUrl: '/game/loykrathong/temple.webp',
    walkable: [
      { x: 20, y: 560, w: 980, h: 200 }, // courtyard between the lamp posts
      { x: 0, y: 760, w: 1024, h: 80 }, // the walkway along the pond, edge to edge (exits at both ends)
      { x: 445, y: 830, w: 130, h: 420 }, // the pier, straight down from the walkway
    ],
    pier: { x: 445, y: 1080, w: 130, h: 170 },
    spawn: { x: 512, y: 650 },
    drop: { x: 420, y: 1240 },
    lanes: [
      { x: -90, y: 900, w: 520, h: 560 }, // pond left of the pier
      { x: 590, y: 900, w: 520, h: 560 }, // pond right of the pier
    ],
    dropLane: 0,
    exits: {
      left: { zone: { x: 0, y: 765, w: EDGE, h: 75 }, to: 'village', entry: { x: LK_MAP_W - ENTRY, y: 535 } },
      right: { zone: { x: LK_MAP_W - EDGE, y: 765, w: EDGE, h: 75 }, to: 'bangkok', entry: { x: ENTRY, y: 980 } },
    },
  },
  bangkok: {
    id: 'bangkok',
    mapUrl: '/game/loykrathong/bangkok.webp',
    walkable: [
      { x: 0, y: 925, w: 1024, h: 110 }, // teak landing deck along the Chao Phraya (exits at both ends)
      { x: 445, y: 1035, w: 140, h: 470 }, // the pier
    ],
    pier: { x: 445, y: 1300, w: 140, h: 205 }, // reaches the walkable tip of the pier
    spawn: { x: 512, y: 980 },
    drop: { x: 415, y: 1470 },
    lanes: [
      { x: -90, y: 1080, w: 520, h: 420 }, // water left of the pier
      { x: 600, y: 1080, w: 510, h: 420 }, // water right of the pier
      { x: -90, y: 380, w: 1200, h: 160 }, // the wide river in front of Wat Arun
    ],
    dropLane: 0,
    exits: {
      left: { zone: { x: 0, y: 930, w: EDGE, h: 100 }, to: 'temple', entry: { x: LK_MAP_W - ENTRY, y: 800 } },
      right: { zone: { x: LK_MAP_W - EDGE, y: 930, w: EDGE, h: 100 }, to: 'chiangmai', entry: { x: ENTRY, y: 830 } },
    },
  },
  chiangmai: {
    id: 'chiangmai',
    mapUrl: '/game/loykrathong/chiangmai.webp',
    walkable: [
      { x: 40, y: 600, w: 940, h: 170 }, // brick plaza
      { x: 0, y: 770, w: 1024, h: 130 }, // lower promenade with the exits
      { x: 440, y: 900, w: 140, h: 600 }, // the pier
    ],
    pier: { x: 440, y: 1300, w: 140, h: 200 },
    spawn: { x: 512, y: 700 },
    drop: { x: 412, y: 1470 },
    lanes: [
      { x: -90, y: 1050, w: 510, h: 430 }, // water left of the pier
      { x: 600, y: 1050, w: 510, h: 430 }, // water right of the pier
    ],
    dropLane: 0,
    exits: {
      left: { zone: { x: 0, y: 780, w: EDGE, h: 110 }, to: 'bangkok', entry: { x: LK_MAP_W - ENTRY, y: 980 } },
      right: { zone: { x: LK_MAP_W - EDGE, y: 780, w: EDGE, h: 110 }, to: 'village', entry: { x: ENTRY, y: 775 } },
    },
  },
};

export function isWalkable(scene: SceneConfig, x: number, y: number): boolean {
  for (const r of scene.walkable) if (inRect(r, x, y)) return true;
  return false;
}

export function isSceneId(v: unknown): v is SceneId {
  return typeof v === 'string' && (LK_SCENES as readonly string[]).includes(v);
}

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
 * Event window (Bangkok time). Loy Krathong 2569 is 24 Nov 2026; the village is
 * open early (from 8 Oct 2026) as a marketing run-up. After the window the page
 * shows a thank-you screen. `?preview=1` bypasses the gate for testing.
 */
export const LK_EVENT = {
  year: 2569,
  opensAt: Date.parse('2026-10-08T00:00:00+07:00'),
  closesAt: Date.parse('2026-11-26T00:00:00+07:00'),
  dayAt: Date.parse('2026-11-24T00:00:00+07:00'),
};

export type EventPhase = 'before' | 'open' | 'after';

export function eventPhase(now: number = Date.now()): EventPhase {
  if (now < LK_EVENT.opensAt) return 'before';
  if (now >= LK_EVENT.closesAt) return 'after';
  return 'open';
}
