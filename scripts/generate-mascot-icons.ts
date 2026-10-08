// Generates the PWA / favicon assets from the mascot pixel grid.
//
//   npm run icons        (node --experimental-strip-types scripts/generate-mascot-icons.ts)
//
// Writes: public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png,
//         public/apple-touch-icon.png, public/mascot.svg
// No image libraries: PNGs are encoded by hand (zlib + CRC32 are in Node core).

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MASCOT_PALETTE, MASCOT_PALETTE_MONO, mascotStill, mascotSvg } from '../src/lib/mascot.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');

// Brand gradient (top-left pink -> bottom-right red), same as the primary button.
const G0 = [0xff, 0x8f, 0xb3];
const G1 = [0xe6, 0x39, 0x46];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface RenderOptions {
  size: number;
  /** Fraction of the canvas the 32-cell art should span. */
  fill: number;
  /** 'gradient' paints the brand gradient; 'none' leaves the background transparent. */
  background: 'gradient' | 'none';
  palette: Record<string, string>;
}

function render(rows: string[], opts: RenderOptions): Uint8Array {
  const { size } = opts;
  const px = new Uint8Array(size * size * 4);

  if (opts.background === 'gradient') {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const t = (x + y) / (2 * (size - 1));
        const i = (y * size + x) * 4;
        px[i] = Math.round(G0[0] + (G1[0] - G0[0]) * t);
        px[i + 1] = Math.round(G0[1] + (G1[1] - G0[1]) * t);
        px[i + 2] = Math.round(G0[2] + (G1[2] - G0[2]) * t);
        px[i + 3] = 255;
      }
    }
  }

  const grid = rows.length;
  const cell = Math.max(1, Math.floor((size * opts.fill) / grid));
  const offset = Math.floor((size - cell * grid) / 2);
  const rgb: Record<string, [number, number, number]> = {};
  for (const k of Object.keys(opts.palette)) rgb[k] = hexToRgb(opts.palette[k]);

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const ch = rows[gy][gx];
      if (ch === '.') continue;
      const [r, g, b] = rgb[ch];
      for (let y = 0; y < cell; y++) {
        const yy = offset + gy * cell + y;
        for (let x = 0; x < cell; x++) {
          const xx = offset + gx * cell + x;
          const i = (yy * size + xx) * 4;
          px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
        }
      }
    }
  }
  return px;
}

// --- minimal PNG encoder -----------------------------------------------------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, Buffer.from(data)])));
  return Buffer.concat([len, typeBuf, Buffer.from(data), crc]);
}
function encodePng(px: Uint8Array, size: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    Buffer.from(px.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

// --- outputs -----------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
const still = mascotStill('idle');

const outputs: Array<{ file: string; size: number; fill: number }> = [
  { file: 'icon-192.png', size: 192, fill: 0.78 },
  { file: 'icon-512.png', size: 512, fill: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, fill: 0.78 },
  // maskable: keep the art inside the 80% safe zone
  { file: 'icon-maskable-512.png', size: 512, fill: 0.62 },
];
for (const o of outputs) {
  const px = render(still, { size: o.size, fill: o.fill, background: 'gradient', palette: MASCOT_PALETTE_MONO });
  writeFileSync(join(OUT, o.file), encodePng(px, o.size));
  console.log('wrote', o.file);
}

writeFileSync(join(OUT, 'mascot.svg'), mascotSvg(still, MASCOT_PALETTE));
console.log('wrote mascot.svg');
