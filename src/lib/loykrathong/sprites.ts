// Canvas sprite rendering for the mini-game: the brand crab in any shell colour,
// with an optional accessory, cached per (colour, accessory, emotion, frame).

import { mascotFrames, gridToRuns, MASCOT_GRID, MASCOT_PALETTE, type MascotEmotion, type MascotPalette } from '@/lib/mascot';
import { LK_COLORS, LK_SPRITE_SCALE, type Accessory, type ShellColor } from './config';

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => {
    const t = amount < 0 ? 0 : 255;
    const p = Math.abs(amount);
    return Math.round(v + (t - v) * p);
  };
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function shellPalette(color: ShellColor): MascotPalette {
  const base = LK_COLORS[color];
  return {
    ...MASCOT_PALETTE,
    P: base,
    D: shade(base, -0.32),
    L: shade(base, 0.42),
    B: shade(base, -0.14),
  };
}

const ACC_PALETTE: MascotPalette = {
  Y: '#FFD166', // flower centre / lantern glow
  M: '#FFF0F5', // petals
  G: '#3FA66B', // leaf
  T: '#E0B45A', // straw
  K: '#3B2E2A', // hat band, string
  O: '#FF7B2E', // lantern paper
};

interface Layer {
  row: number;
  col: number;
  rows: string[];
}

/** Overlays drawn on top of the 32x32 crab grid (row/col = top-left on the grid). */
const ACCESSORY_LAYERS: Record<Exclude<Accessory, 'none'>, Layer> = {
  flower: {
    row: 8,
    col: 2,
    rows: [
      '..M..',
      '.MMM.',
      'MMYMM',
      '.MMM.',
      '..MG.',
    ],
  },
  hat: {
    row: 8,
    col: 4,
    rows: [
      '........TTTTTTTT........',
      '......TTTTTTTTTTTT......',
      '......TTTTTTTTTTTT......',
      '......KKKKKKKKKKKK......',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
  },
  lantern: {
    row: 4,
    col: 27,
    rows: [
      '..K..',
      '..K..',
      '.OOO.',
      'OOYOO',
      'OOYOO',
      '.OOO.',
      '..K..',
    ],
  },
};

const cache = new Map<string, HTMLCanvasElement>();

export const SPRITE_PX = MASCOT_GRID * LK_SPRITE_SCALE; // 64

/**
 * A crab sprite as an offscreen canvas (64x64 map px). `frame` is 0/1: for walking
 * it alternates the legs, for standing frame 1 is the blink.
 */
export function crabSprite(
  color: ShellColor,
  accessory: Accessory,
  emotion: MascotEmotion,
  walking: boolean,
  frame: 0 | 1,
): HTMLCanvasElement {
  const key = `${color}|${accessory}|${emotion}|${walking ? 'w' : 's'}|${frame}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const set = mascotFrames(emotion, walking ? 'walk' : 'idle');
  const rows = set.frames[Math.min(frame, set.frames.length - 1)];
  const palette = shellPalette(color);
  const s = LK_SPRITE_SCALE;

  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_PX;
  canvas.height = SPRITE_PX;
  const ctx = canvas.getContext('2d')!;
  for (const run of gridToRuns(rows)) {
    ctx.fillStyle = palette[run.key] ?? '#000';
    ctx.fillRect(run.x * s, run.y * s, run.w * s, s);
  }
  if (accessory !== 'none') {
    const layer = ACCESSORY_LAYERS[accessory];
    for (const run of gridToRuns(layer.rows)) {
      ctx.fillStyle = ACC_PALETTE[run.key] ?? '#000';
      ctx.fillRect((layer.col + run.x) * s, (layer.row + run.y) * s, run.w * s, s);
    }
  }
  cache.set(key, canvas);
  return canvas;
}

const images = new Map<string, HTMLImageElement>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  const hit = images.get(url);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function getImage(url: string): HTMLImageElement | undefined {
  return images.get(url);
}
