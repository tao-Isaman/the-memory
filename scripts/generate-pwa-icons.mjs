// Generates PWA app icons from the brand heart logo using sharp.
// Run: node scripts/generate-pwa-icons.mjs
import sharp from 'sharp';

const heartPath =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

// Build a 512x512 SVG with the brand gradient and a centered white heart.
// `rounded` adds a rounded-square (for normal icons); maskable stays full-bleed.
// `k` scales the 24x24 heart path (smaller for maskable safe zone).
function buildSvg({ rounded, k }) {
  const r = rounded ? 112 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FF6B9D"/>
        <stop offset="1" stop-color="#E63946"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="${r}" ry="${r}" fill="url(#g)"/>
    <g transform="translate(256,266) scale(${k}) translate(-12,-12)">
      <path d="${heartPath}" fill="#ffffff"/>
    </g>
  </svg>`;
}

const regular = Buffer.from(buildSvg({ rounded: true, k: 14 }));
const maskable = Buffer.from(buildSvg({ rounded: false, k: 10.5 }));

await sharp(regular).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(regular).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(maskable).resize(512, 512).png().toFile('public/icon-maskable-512.png');
await sharp(regular).resize(180, 180).png().toFile('public/apple-touch-icon.png');

console.log('PWA icons generated in public/: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png');
