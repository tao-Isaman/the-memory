// Single manifest / contract for every /gift mini-game asset. This is the ONE
// file to edit when real artwork lands: drop the drawn files into
// `public/gift/` and, if a filename or size/frame count differs from below,
// update that entry here — no game code changes. See `public/gift/ASSETS.md`
// for the full drawing brief.
//
// FALLBACK: the game loads each image through `GiftImg`, which falls back to the
// current built-in placeholder (SVG or CSS) when the file is absent or fails to
// load. So an entry may point at a file the artist has not drawn yet — the game
// keeps working and the real art appears the moment the file exists.
//
// `frames` is for sprite-sheet animation: a horizontal strip of N frames at
// `w`×`h` each (1 = a single static image). The demo renders frame 0 until the
// animation is wired to the real sheet.

export interface GiftImageAsset {
  /** Public path, served from `public/`. */
  file: string;
  /** One frame's width in px. */
  w: number;
  /** One frame's height in px. */
  h: number;
  /** Horizontal frames in the file (1 = static). */
  frames: number;
  /** Frames per second for an animated sprite (ignored when `frames` is 1). */
  fps?: number;
  /** What the artist should draw. */
  desc: string;
}

// Box / unwrap / reveal visuals (sprite sheets where `frames` > 1).
export const GIFT_IMAGES = {
  boxClosed: { file: '/gift/box-closed.svg', w: 512, h: 512, frames: 1, fps: 8, desc: 'กล่องของขวัญปิด (intro + ก่อนแกะ) — วาด idle 4–6 เฟรม ~8fps ได้ (ขยับเบาๆ)' },
  boxShake: { file: '/gift/box-shake.png', w: 512, h: 512, frames: 4, fps: 16, desc: 'กล่องสั่น 4 เฟรม — เล่นตอนใส่รหัสผิด' },
  ribbon: { file: '/gift/ribbon.svg', w: 512, h: 512, frames: 1, desc: 'ริบบิ้น/โบว์ — sprite 4–6 เฟรม คลายโบว์ (แตะ 1 ครั้ง = เลื่อน 1 เฟรม)' },
  wrap: { file: '/gift/wrap.svg', w: 512, h: 512, frames: 1, desc: 'กระดาษห่อ (ลายเทศกาล) — ปลิวออกตอนแกะเสร็จ' },
  boxOpen: { file: '/gift/box-open.svg', w: 512, h: 512, frames: 1, fps: 12, desc: 'กล่องเปิด/ฝาเด้ง 4–6 เฟรม — ฉากเซอร์ไพรส์' },
  sparkle: { file: '/gift/sparkle.svg', w: 128, h: 128, frames: 1, fps: 12, desc: 'ประกายดาว 4 เฟรม — เอฟเฟกต์ตอนเปิด' },
} as const satisfies Record<string, GiftImageAsset>;
export type GiftImageKey = keyof typeof GIFT_IMAGES;

// Full-screen portrait backgrounds, switched by date like the snow/fireworks.
export const GIFT_BACKGROUNDS = {
  christmas: { file: '/gift/bg-christmas.webp', w: 1080, h: 1920, frames: 1, desc: 'พื้นหลังคริสต์มาส แนวตั้ง (ใช้คู่กับหิมะ ถึง 26 ธ.ค.)' },
  newyear: { file: '/gift/bg-newyear.webp', w: 1080, h: 1920, frames: 1, desc: 'พื้นหลังปีใหม่ แนวตั้ง (ใช้คู่กับพลุ 27 ธ.ค.–15 ม.ค.)' },
} as const satisfies Record<string, GiftImageAsset>;

// Code scene: draggable digits, slots, hint + message cards.
export const GIFT_CODE = {
  slotEmpty: { file: '/gift/slot-empty.png', w: 112, h: 136, frames: 1, desc: 'ช่องรหัสว่าง' },
  slotFilled: { file: '/gift/slot-filled.png', w: 112, h: 136, frames: 1, desc: 'ช่องรหัสที่ใส่เลขแล้ว (เลขวางทับด้วยโค้ด)' },
  hintCard: { file: '/gift/hint-card.svg', w: 640, h: 200, frames: 1, desc: 'การ์ดคำใบ้ (ข้อความใส่ด้วยโค้ด)' },
  messageFrame: { file: '/gift/message-frame.svg', w: 900, h: 600, frames: 1, desc: 'กรอบข้อความฉากเปิด ("ถึง [ชื่อ]" ใส่ด้วยโค้ด)' },
} as const satisfies Record<string, GiftImageAsset>;
// Digit tiles digit-0..9 (+ optional digit-N-drag while dragging).
export const GIFT_DIGITS = Object.fromEntries(
  Array.from({ length: 10 }, (_, d) => [
    String(d),
    { file: `/gift/digit-${d}.png`, w: 128, h: 128, frames: 1, desc: `เลข ${d} (ตัวลาก) — มี digit-${d}-drag.png ขณะลากได้` },
  ]),
) as Record<string, GiftImageAsset>;

// Particle sprites (optional — the effect falls back to ❄ / drawn dots).
export const GIFT_PARTICLES = {
  snowflake: { file: '/gift/snowflake.png', w: 64, h: 64, frames: 1, desc: 'เกล็ดหิมะ (ไม่มี = ใช้ ❄)' },
  firework: { file: '/gift/firework.png', w: 64, h: 64, frames: 1, desc: 'พลุ/ประกาย (ไม่มี = ใช้จุดวาด)' },
} as const satisfies Record<string, GiftImageAsset>;

// UI chrome. Buttons are 9-slice (keep the art's corners crisp when stretched).
export const GIFT_UI = {
  btnPrimary: { file: '/gift/btn-primary.png', w: 600, h: 112, frames: 3, desc: 'ปุ่มหลัก 9-slice 3 สถานะ (ปกติ/กด/ปิด) สูง 112 — เฟรม=สถานะ' },
  btnSecondary: { file: '/gift/btn-secondary.png', w: 600, h: 112, frames: 3, desc: 'ปุ่มรอง 9-slice 3 สถานะ' },
  inputName: { file: '/gift/input-name.png', w: 900, h: 140, frames: 1, desc: 'ช่องใส่ชื่อ (พื้นหลัง)' },
  progress: { file: '/gift/progress.png', w: 360, h: 48, frames: 3, desc: 'แถบความคืบหน้า 3 ขั้น (เฟรม=ขั้น)' },
  iconSoundOn: { file: '/gift/icon-sound-on.svg', w: 96, h: 96, frames: 1, desc: 'ไอคอนเสียงเปิด (ไม่มี = 🔊)' },
  iconSoundOff: { file: '/gift/icon-sound-off.svg', w: 96, h: 96, frames: 1, desc: 'ไอคอนเสียงปิด (ไม่มี = 🔇)' },
  iconShare: { file: '/gift/icon-share.svg', w: 96, h: 96, frames: 1, desc: 'ไอคอนแชร์ (ไม่มี = 🔗)' },
} as const satisfies Record<string, GiftImageAsset>;

export interface GiftAudioAsset {
  file: string;
  desc: string;
}
export const GIFT_AUDIO = {
  // Placeholder: borrows the (rights-cleared) Loy Krathong track until a
  // Christmas / New-Year piece is supplied. Swap `file` to the new track.
  open: { file: '/audio/loykrathong-bgm.mp3', desc: 'เพลงตอนเปิดกล่อง — placeholder (ยืมเพลงลอยกระทง) เปลี่ยนเป็นเพลงคริสต์มาส/ปีใหม่ภายหลัง' },
} as const satisfies Record<string, GiftAudioAsset>;
export type GiftAudioKey = keyof typeof GIFT_AUDIO;
