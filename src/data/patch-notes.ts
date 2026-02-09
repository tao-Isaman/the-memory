export type PatchItemType = 'feature' | 'improvement' | 'fix' | 'announcement';

export interface PatchItem {
  type: PatchItemType;
  text: string;
}

export interface PatchNote {
  /** Version string, e.g. "1.3.0" — used as localStorage key */
  version: string;
  /** ISO date string, e.g. "2026-02-09" */
  date: string;
  /** Thai title for this release */
  title: string;
  /** Optional short summary */
  summary?: string;
  /** List of changes */
  items: PatchItem[];
}

/**
 * Patch notes — NEWEST FIRST
 *
 * To add a new update, copy the template below and paste it
 * at the TOP of this array:
 *
 * {
 *   version: "X.Y.Z",
 *   date: "YYYY-MM-DD",
 *   title: "ชื่ออัปเดต",
 *   summary: "สรุปสั้นๆ (ไม่บังคับ)",
 *   items: [
 *     { type: "feature", text: "ฟีเจอร์ใหม่ที่เพิ่มเข้ามา" },
 *     { type: "improvement", text: "ปรับปรุงสิ่งที่มีอยู่แล้ว" },
 *     { type: "fix", text: "แก้ไขบั๊ก" },
 *     { type: "announcement", text: "ประกาศทั่วไป" },
 *   ],
 * },
 */
export const patchNotes: PatchNote[] = [
  {
    version: '1.4.0',
    date: '2026-02-09',
    title: 'AppBar, โปรไฟล์ & หน้าอัปเดต',
    summary: 'ปรับโครงสร้างแอปใหม่พร้อม AppBar แจ้งเตือนอัปเดต และหน้าโปรไฟล์',
    items: [
      { type: 'feature', text: 'AppBar — แถบนำทางด้านบนพร้อมโลโก้ กระดิ่งแจ้งเตือน และเมนูผู้ใช้' },
      { type: 'feature', text: 'หน้าโปรไฟล์ — ดูรูปโปรไฟล์ ชื่อ อีเมล และวันที่สมัครสมาชิก' },
      { type: 'feature', text: 'หน้า "มีอะไรใหม่" — ดูประวัติอัปเดตทุกเวอร์ชัน พร้อมแจ้งเตือนเมื่อมีอัปเดตใหม่' },
      { type: 'improvement', text: 'จัดโครงสร้าง Route Group (app) เพื่อใช้ AppBar ร่วมกันทุกหน้า' },
      { type: 'improvement', text: 'ปรับหน้า Dashboard ให้กระชับขึ้น ย้ายเมนูไปที่ AppBar' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-09',
    title: 'เรื่องราวแบบตอบคำถาม & ใส่โค้ดแนะนำย้อนหลัง',
    summary: 'เพิ่มสตอรี่คำถามและเปิดให้ใส่โค้ดแนะนำภายหลังได้',
    items: [
      { type: 'feature', text: 'เรื่องราวแบบตอบคำถาม (Question) — ตั้งคำถาม 4 ตัวเลือกให้คนพิเศษตอบ' },
      { type: 'feature', text: 'ใส่โค้ดแนะนำย้อนหลังได้ สำหรับคนที่ข้ามตอนแรก' },
      { type: 'fix', text: 'แก้ไขปัญหาขูดการ์ดลับ 2 ใบ สถานะทับกัน' },
      { type: 'fix', text: 'แก้ไข Webhook สำหรับการชำระเงินผ่าน PromptPay' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-05',
    title: 'ระบบแนะนำเพื่อน & Admin Dashboard',
    summary: 'แชร์โค้ดให้เพื่อน รับส่วนลด 50 บาท',
    items: [
      { type: 'feature', text: 'ระบบโค้ดแนะนำเพื่อน — แชร์โค้ดให้เพื่อนรับส่วนลด 50 บาท' },
      { type: 'feature', text: 'ขอรับเงินค่าแนะนำผ่าน PromptPay หรือบัญชีธนาคาร' },
      { type: 'feature', text: 'หน้า Admin สำหรับจัดการผู้ใช้และ Memory' },
      { type: 'improvement', text: 'ปรับปรุง Pagination และ Filter ในหน้า Admin' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-02-03',
    title: 'การ์ดลับ & สถิติเว็บไซต์',
    summary: 'เพิ่มสตอรี่ขูดเปิดการ์ดลับและตัวเลขสถิติบนหน้าแรก',
    items: [
      { type: 'feature', text: 'เรื่องราวแบบขูดเปิดการ์ดลับ (Scratch Card)' },
      { type: 'feature', text: 'ตัวเลขสถิติแบบเคลื่อนไหวบนหน้าแรก' },
      { type: 'improvement', text: 'แปลงรูปเป็น WebP อัตโนมัติเพื่อความเร็ว' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-01',
    title: 'เปิดตัว The Memory!',
    summary: 'สร้างความทรงจำสุดพิเศษให้คนที่คุณรัก',
    items: [
      { type: 'announcement', text: 'เปิดให้บริการครั้งแรก!' },
      { type: 'feature', text: 'สร้าง Memory พร้อมเรื่องราว 5 แบบ: ข้อความ, รูปภาพ, รูป+ข้อความ, YouTube, รหัสผ่าน' },
      { type: 'feature', text: 'ระบบล็อค PIN 6 หลักพร้อม Numpad' },
      { type: 'feature', text: 'แชร์ผ่าน QR Code, คัดลอกลิงก์ หรือ Share ผ่านแอป' },
      { type: 'feature', text: 'ชำระเงินผ่าน Stripe (บัตรเครดิต & PromptPay)' },
    ],
  },
];

export function getLatestVersion(): string {
  return patchNotes[0]?.version ?? '0.0.0';
}

export function getLatestPatchNote(): PatchNote | null {
  return patchNotes[0] ?? null;
}
