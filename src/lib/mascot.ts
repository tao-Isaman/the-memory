// The Memory mascot: a pink pixel-art crab ("น้องปู") drawn on a 32x32 grid.
//
// Everything here is pure data + pure functions so it can be used by the React
// component (src/components/Mascot.tsx) AND by the icon generator script
// (scripts/generate-mascot-icons.ts) which runs under plain Node.
// Keep this file free of imports and of non-erasable TS syntax (enums etc.).

export const MASCOT_GRID = 32;

export type MascotPalette = Record<string, string>;

/** Brand palette. Keys are the characters used in the grid strings. */
export const MASCOT_PALETTE: MascotPalette = {
  P: '#FF6B9D', // body
  D: '#E63946', // shade / outline-less edge
  L: '#FFB3C6', // highlight
  W: '#FFFFFF', // eye glint, sweat drop
  K: '#3B2E2A', // eyes, mouth
  B: '#FF4F7A', // blush
  R: '#C81D3C', // heart prop
};

/** White-on-colour palette for app icons and dark/brand backgrounds. */
export const MASCOT_PALETTE_MONO: MascotPalette = {
  P: '#FFFFFF',
  D: '#FFD6E0',
  L: '#FFFFFF',
  W: '#FFFFFF',
  K: '#3B2E2A',
  B: '#FFB3C6',
  R: '#E63946',
};

export type MascotEmotion = 'idle' | 'happy' | 'wink' | 'love' | 'sad' | 'surprised' | 'sleepy';
export type MascotAnimation = 'none' | 'idle' | 'walk' | 'wave' | 'bounce';

type Edit = [row: number, col: number, ch: string];

// ---------------------------------------------------------------------------
// Base body: LEFT half (16 columns) of the 32x32 grid, mirrored to the right.
// Rows 0-3 are free for props (floating heart), rows 24-27 hold the legs.
// ---------------------------------------------------------------------------
const CLAWS_UP: string[] = [
  '................',
  '................',
  '................',
  '................',
  '......DD...DD...',
  '......DPD.DPD...',
  '......DPPDPPD...',
  '......DPPLPPD...',
  '.......DPPPD....',
  '........DPD.....',
  '........DPD.....',
  '........DPDDDDDD',
];

// Same claw, tilted one step outward and down: alternated with CLAWS_UP for a wave,
// and used on its own for the "sad" pose.
const CLAWS_TILT: string[] = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....DD...DD....',
  '.....DPD.DPD....',
  '.....DPPDPPD....',
  '.....DPPLPPD....',
  '......DPPPD.....',
  '.......DPD......',
  '........DPDDDDDD',
];

const BODY: string[] = [
  '......DDDPPPPPPP', // 12
  '......DPLLPPPPPP', // 13
  '.....DPPPPPPPPPP', // 14
  '.....DPPPPPPPPPP', // 15
  '....DPPPPPPPPPPP', // 16
  '....DPPPPPPPPPPP', // 17
  '....DPBBPPPPPPPP', // 18
  '....DPBBPPPPPPPP', // 19
  '....DPPPPPPPPPPP', // 20
  '.....DPPPPPPPPPP', // 21
  '.....DPPPPPPPPPP', // 22
  '.....DDDDDDDDDDD', // 23
];

// Legs, two walk frames. Outer leg is an inverted V hanging from the body corner.
const LEGS_A: string[] = [
  '....D.D.....D.D.', // 24
  '...D...D...D.D..', // 25
  '..D.....D.D.D...', // 26
  '.D..............', // 27
  '................',
  '................',
  '................',
  '................',
];
const LEGS_B: string[] = [
  '....D.D..D..D...', // 24
  '...D...D..D..D..', // 25
  '..D.....D..D..D.', // 26
  '.........D......', // 27
  '................',
  '................',
  '................',
  '................',
];

function mirror(rows: string[]): string[] {
  return rows.map((r) => r + r.split('').reverse().join(''));
}

function patch(rows: string[], edits: Edit[]): string[] {
  const out = rows.map((r) => r.split(''));
  for (const [r, c, ch] of edits) {
    if (out[r] && c >= 0 && c < out[r].length) out[r][c] = ch;
  }
  return out.map((r) => r.join(''));
}

// ---------------------------------------------------------------------------
// Face parts (applied after mirroring so both eye glints sit on the same side)
// ---------------------------------------------------------------------------
const EYE_ROW = 14;
const LEFT_EYE = 11;
const RIGHT_EYE = 17;

/** Big dark eye, 4 wide x 5 tall, rounded corners, white glint top-right. */
function eyeOpen(r: number, c: number): Edit[] {
  return [
    [r, c + 1, 'K'], [r, c + 2, 'W'],
    [r + 1, c, 'K'], [r + 1, c + 1, 'K'], [r + 1, c + 2, 'W'], [r + 1, c + 3, 'W'],
    [r + 2, c, 'K'], [r + 2, c + 1, 'K'], [r + 2, c + 2, 'K'], [r + 2, c + 3, 'K'],
    [r + 3, c, 'K'], [r + 3, c + 1, 'K'], [r + 3, c + 2, 'K'], [r + 3, c + 3, 'K'],
    [r + 4, c + 1, 'K'], [r + 4, c + 2, 'K'],
  ];
}

/** Closed happy eye: a small arch. */
function eyeClosed(r: number, c: number): Edit[] {
  return [[r + 1, c + 1, 'K'], [r + 1, c + 2, 'K'], [r + 2, c, 'K'], [r + 2, c + 3, 'K']];
}

/** Blink frame: a flat line where the eye is. */
function eyeBlink(r: number, c: number): Edit[] {
  return [[r + 2, c, 'K'], [r + 2, c + 1, 'K'], [r + 2, c + 2, 'K'], [r + 2, c + 3, 'K']];
}

/** Sleepy: lower half of the open eye only (lids half down). */
function eyeSleepy(r: number, c: number): Edit[] {
  return [
    [r + 2, c, 'K'], [r + 2, c + 1, 'K'], [r + 2, c + 2, 'K'], [r + 2, c + 3, 'K'],
    [r + 3, c, 'K'], [r + 3, c + 1, 'K'], [r + 3, c + 2, 'W'], [r + 3, c + 3, 'K'],
    [r + 4, c + 1, 'K'], [r + 4, c + 2, 'K'],
  ];
}

const MOUTH_SMILE: Edit[] = [[20, 14, 'K'], [20, 17, 'K'], [21, 15, 'K'], [21, 16, 'K']];
const MOUTH_GRIN: Edit[] = [[20, 13, 'K'], [20, 18, 'K'], [21, 14, 'K'], [21, 15, 'K'], [21, 16, 'K'], [21, 17, 'K']];
const MOUTH_FROWN: Edit[] = [[20, 15, 'K'], [20, 16, 'K'], [21, 14, 'K'], [21, 17, 'K']];
const MOUTH_O: Edit[] = [[20, 15, 'K'], [20, 16, 'K'], [21, 15, 'K'], [21, 16, 'K']];
const MOUTH_SMALL: Edit[] = [[21, 15, 'K'], [21, 16, 'K']];

/** 5x4 heart whose top-left corner is (r, c). */
function heart(r: number, c: number): Edit[] {
  return [
    [r, c + 1, 'R'], [r, c + 3, 'R'],
    [r + 1, c, 'R'], [r + 1, c + 1, 'R'], [r + 1, c + 2, 'R'], [r + 1, c + 3, 'R'], [r + 1, c + 4, 'R'],
    [r + 2, c + 1, 'R'], [r + 2, c + 2, 'R'], [r + 2, c + 3, 'R'],
    [r + 3, c + 2, 'R'],
  ];
}

const SWEAT: Edit[] = [[13, 24, 'W'], [14, 24, 'W'], [15, 24, 'L']];
const BIG_BLUSH: Edit[] = [[18, 4, 'B'], [19, 4, 'B'], [18, 27, 'B'], [19, 27, 'B']];

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------
interface Pose {
  claws: 'up' | 'tilt';
  legs: 'a' | 'b';
}

function body(pose: Pose): string[] {
  const claws = pose.claws === 'up' ? CLAWS_UP : CLAWS_TILT;
  const legs = pose.legs === 'a' ? LEGS_A : LEGS_B;
  return mirror([...claws, ...BODY, ...legs]);
}

type EyeState = 'open' | 'closed' | 'blink' | 'sleepy';

function eyes(left: EyeState, right: EyeState): Edit[] {
  const pick = (s: EyeState, c: number): Edit[] => {
    if (s === 'closed') return eyeClosed(EYE_ROW, c);
    if (s === 'blink') return eyeBlink(EYE_ROW, c);
    if (s === 'sleepy') return eyeSleepy(EYE_ROW, c);
    return eyeOpen(EYE_ROW, c);
  };
  return [...pick(left, LEFT_EYE), ...pick(right, RIGHT_EYE)];
}

interface FaceSpec {
  eyes: [EyeState, EyeState];
  mouth: Edit[];
  extra?: Edit[];
  claws: 'up' | 'tilt';
}

function faceFor(emotion: MascotEmotion): FaceSpec {
  switch (emotion) {
    case 'happy':
      return { eyes: ['closed', 'closed'], mouth: MOUTH_GRIN, claws: 'up' };
    case 'wink':
      return { eyes: ['closed', 'open'], mouth: MOUTH_SMILE, claws: 'up' };
    case 'love':
      return { eyes: ['open', 'open'], mouth: MOUTH_SMILE, extra: BIG_BLUSH, claws: 'up' };
    case 'sad':
      return { eyes: ['open', 'open'], mouth: MOUTH_FROWN, extra: SWEAT, claws: 'tilt' };
    case 'surprised':
      return { eyes: ['open', 'open'], mouth: MOUTH_O, claws: 'up' };
    case 'sleepy':
      return { eyes: ['sleepy', 'sleepy'], mouth: MOUTH_SMALL, claws: 'tilt' };
    case 'idle':
    default:
      return { eyes: ['open', 'open'], mouth: MOUTH_SMILE, claws: 'up' };
  }
}

function compose(spec: FaceSpec, pose: Pose, blink = false, heartRow: number | null = null): string[] {
  const eyeState: [EyeState, EyeState] = blink
    ? [spec.eyes[0] === 'open' ? 'blink' : spec.eyes[0], spec.eyes[1] === 'open' ? 'blink' : spec.eyes[1]]
    : spec.eyes;
  let edits: Edit[] = [...eyes(eyeState[0], eyeState[1]), ...spec.mouth, ...(spec.extra ?? [])];
  if (heartRow !== null) edits = edits.concat(heart(heartRow, 23));
  return patch(body(pose), edits);
}

/** A still image of the mascot in the given emotion. */
export function mascotStill(emotion: MascotEmotion = 'idle'): string[] {
  const spec = faceFor(emotion);
  return compose(spec, { claws: spec.claws, legs: 'a' }, false, emotion === 'love' ? 0 : null);
}

export interface MascotFrameSet {
  frames: string[][];
  /** CSS keyframes family in globals.css: 'blink' shows frame 1 briefly, 'cycle' shows frames evenly. */
  mode: 'static' | 'blink' | 'cycle';
  /** Suggested loop duration in ms. */
  duration: number;
}

/**
 * Frames for an animation. The component shows them with CSS keyframes, so
 * the number of frames is kept small (1, 2 or 4).
 */
export function mascotFrames(emotion: MascotEmotion = 'idle', animation: MascotAnimation = 'idle'): MascotFrameSet {
  const spec = faceFor(emotion);
  const up: Pose = { claws: spec.claws, legs: 'a' };
  const heartRow = emotion === 'love' ? 0 : null;

  switch (animation) {
    case 'walk':
      return {
        mode: 'cycle',
        duration: 500,
        frames: [
          compose(spec, { claws: spec.claws, legs: 'a' }, false, heartRow),
          compose(spec, { claws: spec.claws, legs: 'b' }, false, heartRow),
        ],
      };
    case 'wave':
      return {
        mode: 'cycle',
        duration: 700,
        frames: [
          compose(spec, { claws: 'up', legs: 'a' }, false, heartRow),
          compose(spec, { claws: 'tilt', legs: 'a' }, false, heartRow),
        ],
      };
    case 'bounce':
      // Body bounce is done in CSS; alternate the floating heart height for "love".
      return {
        mode: 'cycle',
        duration: 800,
        frames: [
          compose(spec, up, false, heartRow),
          compose(spec, up, false, heartRow === null ? null : 1),
        ],
      };
    case 'idle': {
      const canBlink = spec.eyes[0] === 'open' || spec.eyes[1] === 'open';
      return {
        mode: canBlink ? 'blink' : 'static',
        duration: 4000,
        frames: canBlink
          ? [compose(spec, up, false, heartRow), compose(spec, up, true, heartRow)]
          : [compose(spec, up, false, heartRow)],
      };
    }
    case 'none':
    default:
      return { mode: 'static', duration: 0, frames: [compose(spec, up, false, heartRow)] };
  }
}

export interface PixelRun {
  x: number;
  y: number;
  w: number;
  key: string;
}

/** Collapse a grid into horizontal runs of the same colour (fewer SVG rects). */
export function gridToRuns(rows: string[]): PixelRun[] {
  const runs: PixelRun[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      runs.push({ x, y, w, key: ch });
      x += w - 1;
    }
  }
  return runs;
}

/** Standalone SVG markup (used for public/mascot.svg and the icon script). */
export function mascotSvg(rows: string[], palette: MascotPalette = MASCOT_PALETTE): string {
  const n = rows.length;
  const rects = gridToRuns(rows)
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="1" fill="${palette[r.key]}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">${rects}</svg>`;
}
