// Single manifest for every /gift mini-game asset. This is the ONE file to edit
// when the real artwork lands: drop the drawn files into `public/gift/` (keep
// the filename, or change `file` here) and update `w`/`h`/`frames` if needed —
// no game code changes. See `public/gift/ASSETS.md` for the drawing brief.
//
// `frames` is for future sprite-sheet animation (a horizontal strip of N frames
// at `w`×`h` each); 1 means a single static image. The demo renders frame 0.

export interface GiftImageAsset {
  /** Public path, served from `public/`. */
  file: string;
  /** One frame's width in px. */
  w: number;
  /** One frame's height in px. */
  h: number;
  /** Number of horizontal frames in the file (1 = static). */
  frames: number;
  /** What the artist should draw. */
  desc: string;
}

export const GIFT_IMAGES = {
  boxClosed: { file: '/gift/box-closed.svg', w: 512, h: 512, frames: 1, desc: 'กล่องของขวัญปิด (หน้า intro + ก่อนแกะ) สี่เหลี่ยม มีโบว์ด้านบน' },
  ribbon: { file: '/gift/ribbon.svg', w: 512, h: 512, frames: 1, desc: 'ริบบิ้น/โบว์ผูกกล่อง (ฉากแกะ — ปัด/แตะให้คลายทีละเส้น เปลี่ยนเป็น sprite หลายเฟรมได้)' },
  wrap: { file: '/gift/wrap.svg', w: 512, h: 512, frames: 1, desc: 'กระดาษห่อของขวัญ (ปลิวออกตอนแกะเสร็จ)' },
  boxOpen: { file: '/gift/box-open.svg', w: 512, h: 512, frames: 1, desc: 'กล่องเปิดฝา/ของขวัญเรืองแสงข้างใน (ฉากเซอร์ไพรส์)' },
  sparkle: { file: '/gift/sparkle.svg', w: 128, h: 128, frames: 1, desc: 'ประกายดาว/แสงแวว (เอฟเฟกต์ตอนเปิดกล่อง)' },
} as const satisfies Record<string, GiftImageAsset>;

export type GiftImageKey = keyof typeof GIFT_IMAGES;

export interface GiftAudioAsset {
  file: string;
  desc: string;
}

export const GIFT_AUDIO = {
  // Placeholder: borrows the (rights-cleared) Loy Krathong track until a
  // Christmas / New-Year piece is supplied. Swap `file` to the new track.
  open: { file: '/audio/loykrathong-bgm.mp3', desc: 'เพลงตอนเปิดกล่อง — ตอนนี้ยืมเพลงลอยกระทงเป็น placeholder เปลี่ยนเป็นเพลงคริสต์มาส/ปีใหม่ภายหลัง' },
} as const satisfies Record<string, GiftAudioAsset>;

export type GiftAudioKey = keyof typeof GIFT_AUDIO;
