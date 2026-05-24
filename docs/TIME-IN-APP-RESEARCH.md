# รายงานวิจัยฟีเจอร์: เพิ่มเวลาที่ผู้ใช้อยู่ในแอป (Time-in-App)

> **เป้าหมาย:** หาฟีเจอร์ที่ทำให้ผู้ใช้ใช้เวลาในแอปนานขึ้น
> **วิธีการ:** สแกนโค้ดจริงทั้งโปรเจกต์ — หน้า viewer, ระบบ story type, โครงสร้าง notification และระบบ data/analytics
> **วันที่:** 24 พฤษภาคม 2026
> **หมายเหตุ:** เอกสารนี้ต่อยอดจาก [`ENGAGEMENT-FEATURES.md`](./ENGAGEMENT-FEATURES.md) แต่ลงลึกถึงระดับโค้ดจริง (อ้างอิง `file:line`) เพื่อให้ประเมิน effort ได้แม่นยำ และยืนยันว่าอะไร "มีอยู่แล้ว" กับอะไร "ต้องสร้างใหม่"

---

## บทสรุปผู้บริหาร (TL;DR)

จากการสแกนโค้ดทั้งหมด พบ 5 ข้อสรุปหลัก เรียงตามความสำคัญ:

1. **จุดเสียโอกาสมากที่สุดคือ "ตอนจบ" ของ viewer** — หลังเรื่องสุดท้าย ผู้รับ (recipient) ถูกเด้งกลับไปหน้าแรกทันที ไม่มีหน้าสรุป ไม่มีปุ่มดูซ้ำ ไม่มี CTA ชวนสร้างของตัวเอง ไม่มี animation เฉลิมฉลอง ทั้งที่ตรงนี้คือจุดที่ **อารมณ์ผู้รับพีคที่สุด** → ควรทำก่อนเป็นอันดับ 1 (impact สูงมาก, effort ต่ำ)

2. **เราวัด "เวลาในแอป" ไม่ได้เลยในตอนนี้** — การเปิดดู memory ของผู้รับ **ไม่ถูกบันทึกลง DB เลย** และแม้แต่ใน Google Analytics ก็ไม่มี → ต้องวาง instrumentation ก่อนหรือพร้อมกับการทำฟีเจอร์ ไม่งั้นจะพิสูจน์ไม่ได้ว่าฟีเจอร์ได้ผลจริง

3. **การเพิ่ม story type ใหม่ "ถูกมาก"** — สถาปัตยกรรมยืดหยุ่นจริง (`content` เป็น `jsonb` แบบ opaque ไม่ต้องแก้ DB/API) story type แบบง่ายใช้เวลาแค่ ~1–2 ชม. และ type ใหม่ที่ดึงเวลา (countdown, voice, slideshow) เพิ่มเวลาบนจอโดยตรง

4. **การดึงผู้ใช้กลับมา = ต้องสร้างใหม่ทั้งหมด** — ระบบ notification, ตัวตนผู้รับ, reaction/reply, email/push ยังไม่มีสักอย่าง (effort สูง แต่ผลด้าน retention สูงมาก)

5. **ระบบรางวัลมีฐานพร้อมแล้ว** — credit system + pattern การแจกเครดิตครั้งเดียว (profile completion) สามารถ clone มาทำ engagement reward / daily check-in ได้เลย

> **มุมมองเชิงกลยุทธ์:** "เวลาในแอป" แยกเป็น 2 แบบ — (ก) *ยืดเวลาต่อ 1 session* (หน้าจบ, story type ใหม่, เสียง/animation) และ (ข) *ทำให้กลับมาบ่อยขึ้น* (notification, reaction loop, reminder, daily reward) แบบ (ก) ทำได้เร็วและถูก ควรเริ่มก่อน; แบบ (ข) ลงทุนสูงกว่าแต่สร้าง retention ระยะยาว

---

## ส่วนที่ 1: หน้า Viewer — จุดที่ผู้ใช้ใช้เวลาจริง

ไฟล์หลัก: `src/app/memory/[id]/page.tsx`, `src/components/StoryViewer.tsx`

### Flow ปัจจุบัน (ตามโค้ดจริง)
1. ผู้รับเปิดลิงก์ → โหลด memory + stories ครั้งเดียว (`getMemoryById`, `storage.ts:61-80`) เรียงตาม `priority`
2. รูปแบบการนำทางเป็นแบบ **Instagram Stories** ไม่ใช่ปุ่ม prev/next + dot ตามที่ CLAUDE.md เขียนไว้:
   - แตะซ้าย 30% = ย้อน, แตะขวา 70% = ถัดไป (`page.tsx:152-172`)
   - แถบ progress แบบแบ่งช่องด้านบน + auto-advance อัตโนมัติทุก 5 วินาที (`page.tsx:134-149`)
   - auto-advance จะ **หยุด** เมื่อเป็น story สุดท้าย / password / question / youtube / scratch ที่ยังไม่เปิด (`page.tsx:134-138`)
3. แต่ละ story render ผ่าน `switch (story.type)` ใน `StoryViewer.tsx:36-129`
4. **ตอนจบ:** story สุดท้ายมีแค่ปุ่มลอย "เสร็จสิ้น" → กดแล้ว `router.push('/')` (`page.tsx:387-401`)

### สิ่งที่ "ดึงความสนใจได้ดี" อยู่แล้ว
- **Scratch card** ขูดเปิดภาพ (canvas จริง, เปิดที่ 50% — `ScratchCard.tsx:160`)
- **Question quiz** ตอบผิดสั่น animate-shake, ตอบถูกขึ้นเครื่องหมายถูกแล้วไปต่อ (`QuestionGate.tsx`)
- **PIN gate** numpad 6 หลัก + สั่นเมื่อผิด
- **YouTube** เล่นอัตโนมัติพร้อมเสียง ค้างผู้ชมไว้ตลอดความยาวคลิป
- Ambient motion: หัวใจลอย, gradient orbs ตามธีม, slide transition ระหว่าง story

### ปัญหา/ช่องว่างที่พบ (สำคัญที่สุด)
- 🔴 **ตอนจบเป็นทางตัน** — ไม่มีหน้าสรุป, ไม่มี "ดูอีกครั้ง", ไม่มี CTA "สร้างของคุณเอง", ไม่มี animation ฉลอง (มี component `HeartFirework` อยู่แล้วแต่ไม่ถูกใช้ในหน้านี้) → **เด้งออกไปหน้าแรกตอนอารมณ์กำลังพีค**
- 🔴 **ไม่มี tracking ผู้รับเลย** — `view_preview` ยิงเฉพาะตอนเจ้าของดู draft ตัวเอง (`page.tsx:74-76`) ผู้รับจริงไม่ยิง event ใด ๆ, ไม่มี view counter, ไม่มี time-on-page
- 🟡 **ไม่มีเสียงและ haptics เลยทั้งแอป** — ค้นแล้วไม่เจอ `new Audio` / `navigator.vibrate` / ไฟล์เสียงใน `public/` (หมายเหตุ: CLAUDE.md เขียนว่า question story มี "เสียงเตือน" แต่จริง ๆ โค้ดมีแค่การสั่นภาพ ไม่มีเสียง)
- 🟡 **auto-advance 5 วินาทีอาจเร็วเกินไป** สำหรับข้อความยาว — พลิกผ่านก่อนอ่านจบ ทำให้เวลาในแอป "ลดลง" แทนที่จะเพิ่ม

### ข้อมูลสำคัญ: viewer เป็น "anonymous เต็มตัว"
หน้า `/memory/[id]` เป็น route ระดับบนสุด ไม่อยู่ใน group `(app)` ที่ต้อง login และไม่มี AppBar → ผู้รับไม่ต้อง login, ระบุตัวตนฝั่ง server ไม่ได้ ดังนั้นฟีเจอร์อย่าง "ดูต่อจากเดิม" หรือ "เคยดูไปแล้ว N ครั้ง" ต้องใช้ localStorage หรือสร้าง endpoint รับ event แบบ anonymous (ใช้ `api/pwa/track` เป็นต้นแบบได้)

---

## ส่วนที่ 2: ระบบ Story Type — ขยายง่ายมาก

ไฟล์หลัก: `src/types/memory.ts`, `src/components/StoryEditor.tsx`, `src/components/StoryViewer.tsx`

### จุดแข็ง: เพิ่ม type ใหม่แทบไม่ต้องแตะ backend
`content` ถูกเก็บเป็น `jsonb` แบบ opaque ตั้งแต่ DB → type → storage → ไม่มีชั้นไหนตรวจ shape ของ content เลย แปลว่า **persistence layer ไม่ต้องแก้อะไรเลย** logic เฉพาะ type อยู่แค่ 4 จุด: TS union, editor switch, viewer switch, และหน้า admin (แค่เพื่อความสวยงาม)

### Checklist เพิ่ม story type ใหม่ (สรุปจากโค้ดจริง)
1. **DB migration** — เพิ่มไฟล์ใหม่ (ล่าสุดคือ `016`) แก้ `stories_type_check` constraint ตาม pattern ใน `migrations/010-add-question-story-type.sql:7-11`
2. **TS union** — เพิ่มค่าใน `StoryType` + สร้าง interface ของ content (`memory.ts:1`, `:36-39`, `:50`)
3. **Editor metadata** — เพิ่ม label/description/icon (เป็น `Record<StoryType,...>` → TS บังคับให้ใส่ครบ)
4. **Editor form + validation** — เพิ่ม `case` ใน `handleSubmit` + JSX ของฟอร์ม (`StoryEditor.tsx`)
5. **Viewer render** — เพิ่ม `case` ใน `StoryViewer.tsx:36-129`
6. **(เฉพาะ gate / reveal type)** — แก้ orchestration ใน `page.tsx` (~8 จุด) ⚠️ จุดนี้ **ไม่ถูก type-check** = footgun ถ้าลืมจะโดน auto-advance ข้าม

### ประเมิน effort
- type ธรรมดา (เล่นในตัว, auto-advance ปกติ): **~1–2 ชม.**
- type ที่เป็น gate หรือต้อง interact ก่อนไปต่อ: **~ครึ่งวัน**

### ไอเดีย story type ใหม่ (เรียงตามความง่ายที่จะทำ)
| Type | content shape | viewer ทำอะไร | ผลต่อเวลาในแอป |
|------|---------------|----------------|------------------|
| **Countdown** นับถอยหลัง | `{ targetAt, eventLabel, backgroundImageUrl? }` | ตัวเลขนับถอยหลังสด ๆ บนภาพ | ค้างดูตัวเลขเดิน เหมาะกับครบรอบ/วันเกิด |
| **Slideshow / Carousel** | `{ images: [{url, caption?}], autoplayMs? }` | ปัด/กดเลื่อนหลายรูป + dot indicator | กดดูทีละรูป → เวลาบนจอสูง |
| **Voice / เสียงพูด** | `{ audioUrl, durationSec?, caption? }` | player เล่นเสียง (ต้องเพิ่ม bucket เสียง) | ได้ยินเสียงจริง → คนกดฟังซ้ำ |
| **Open when… จดหมายปลดล็อกตามเวลา** | `{ unlockAt, label, text, imageUrl? }` | ถ้ายังไม่ถึงเวลา → นับถอยหลัง+ล็อก | ดึงให้ "กลับมา" ตอนครบเวลา (retention) |
| **Fill-in-the-blank เติมคำ** | `{ prompt, blanks: [{before, answer, after}], successText? }` | พิมพ์เติมคำให้ถูก (gate) | ใช้ความคิด → อยู่นานขึ้น |
| **Spin-the-wheel หมุนวงล้อ** | `{ segments: [{label, isWin?}], resultText? }` | วงล้อหมุน (canvas) แล้วโชว์ผล | สนุก แปลกใหม่ ตรงคอนเซ็ปต์เซอร์ไพรส์ |
| **Timeline ไทม์ไลน์ความทรงจำ** | `{ events: [{date, title, description?, imageUrl?}] }` | เลื่อนดูเหตุการณ์ทีละจุด (reveal on scroll) | เล่าเรื่องยาว → เวลาบนจอสูงสุด |
| **Swipe gallery การ์ดพลิกเปิดรูป** | `{ images: [{url, caption?}], revealStyle? }` | กดพลิกการ์ดทีละใบ | ต่อยอดกลไก scratch ที่พิสูจน์แล้ว |

**แนะนำเริ่มจาก:** Countdown + Slideshow (ง่ายสุด, impact ชัด) → ตามด้วย Voice (impact อารมณ์สูง แต่ต้องเพิ่ม storage bucket เสียง)

---

## ส่วนที่ 3: การดึงผู้ใช้กลับมา (Notification / Social) — ยังไม่มีโครงสร้างเลย

ไฟล์ที่เกี่ยวข้อง: `src/components/AppBar.tsx`, `src/contexts/AuthContext.tsx`, `public/sw.js`, `src/app/api/cron/`

### สถานะปัจจุบัน (ยืนยันจากโค้ด)
| ความสามารถที่ต้องใช้ | มีแล้ว? | หลักฐาน |
|---|---|---|
| Notification inbox / unread | ❌ ไม่มี | กระดิ่งใน AppBar เป็นแค่ badge "มี patch note ใหม่" จาก localStorage (`AppBar.tsx:84-94`) |
| ตัวตนของผู้รับ (recipient identity) | ❌ ไม่มี | ผู้รับ anonymous เต็มตัว, รู้แค่ว่าใช่เจ้าของไหม |
| View tracking (ใครเปิด/กี่ครั้ง) | ❌ ไม่มี | ไม่มีตาราง views, ไม่เขียน DB ตอนเปิด |
| Reaction / reply / comment | ❌ ไม่มี | ไม่มีตารางใน schema |
| Email (transactional) | ❌ ไม่มี | ไม่มี lib อีเมลใน `package.json` |
| Web push | ❌ ไม่มี | `sw.js` มีแค่ install/activate/fetch ไม่มี `push` handler |
| Cron สำหรับเตือน | ❌ ไม่มี | มีแค่ `update-stats` (Hobby plan = วันละ 1 cron) |
| ตาราง "คนสำคัญ + วันสำคัญ" | ❌ ไม่มี | `user_profiles` เก็บแค่วันเกิดของเจ้าของเอง |
| endpoint รับ event จาก anonymous | 🟡 มีต้นแบบ | `api/pwa/track` ใช้ service-role + device-id ใช้ลอกแบบได้ |

### สรุปช่องว่าง
- **Reaction/reply loop** (ผู้รับส่ง ❤️/ข้อความ → เจ้าของได้ noti → กลับมาดู) ต้องสร้าง: ตาราง reactions/replies, public POST endpoint, ตัวตนผู้รับแบบเบา (device id / ชื่อเล่น), ตาราง notification + rewire กระดิ่ง AppBar, และช่องทางส่ง noti นอกแอป (ถ้าต้องการ)
- **Occasion reminders** (เตือนวันสำคัญ) ต้องสร้าง: ตาราง saved people + dates, ผู้ให้บริการ email/push, และ cron ใหม่ (ติดข้อจำกัด Hobby วันละ 1 cron)

> ระบบ referral คือ social infra ที่ใกล้เคียงที่สุดที่มีอยู่ แต่เป็นแบบ **pull-only** (ผู้ใช้ต้องเข้าไปหน้า referral เอง ไม่มี noti เด้ง) จึงนำกลไกส่ง noti มาใช้ซ้ำไม่ได้

---

## ส่วนที่ 4: Data & Analytics — เรา "วัด" อะไรได้บ้าง

ไฟล์: `src/lib/analytics.ts`, `supabase/migrations/*`

- **GA4 events:** มี 18 ตัว (CLAUDE.md เขียน 12 — ล้าสมัย, PWA เพิ่มมา 6) **ทุกตัวเป็น client-side ยิงเข้า GA เท่านั้น ไม่ถูกเก็บลง DB ของเรา** → query/join ไม่ได้
- **ตารางใน DB:** 11 ตาราง (migration ล่าสุด = `016` = `pwa_installs`)
- **ข้อมูล engagement ที่ "ไม่ได้เก็บเลย":**
  - ❌ การเปิดดู memory (recipient views) — สำคัญที่สุด
  - ❌ เวลาที่ใช้ / session duration / dwell ต่อ story
  - ❌ ความคืบหน้า/การดูจบ (story completion)
  - ❌ share เป็นข้อมูล (เป็น GA event เฉย ๆ)
  - ❌ DAU/WAU, streak, last_login
- **กลไกรางวัลที่มีอยู่แล้ว (ต่อยอดได้):**
  - โบนัสกรอกโปรไฟล์ +10 เครดิต ครั้งเดียว (`profile.ts:107`, มี flag กันเคลมซ้ำ + optimistic lock) → **เป็น template ที่ดีที่สุดสำหรับทำ engagement reward**
  - credit ledger (`credit_transactions`) + `user_credits.balance` พร้อม optimistic locking ใช้แจกรางวัลจากการกระทำใหม่ ๆ ได้ทันที (แค่เพิ่ม type/description + guard ต่อรอบ)

> 🔴 **ช่องว่างการวัดผลที่ใหญ่ที่สุด:** ไม่มีข้อมูล view/session/engagement ที่ถูกเก็บถาวรเลย โดยเฉพาะ "การเปิดดูของผู้รับ" ก่อนทำฟีเจอร์ time-in-app ใด ๆ ควรวาง instrumentation ฝั่ง server ก่อน (เช่นตาราง `memory_views` / `story_progress` + heartbeat) ไม่งั้นจะไม่มี baseline ไว้พิสูจน์ผล

---

## ส่วนที่ 5: ตารางจัดอันดับฟีเจอร์ (ตาม impact / effort)

| # | ฟีเจอร์ | ประเภทเวลาในแอป | Impact | Effort | ทำไมถึงคุ้ม |
|---|---------|------------------|--------|--------|-------------|
| 1 | **หน้าจบ + ดูซ้ำ + CTA "สร้างของคุณเอง" + animation ฉลอง** | ยืด session + viral | ⭐⭐⭐⭐⭐ | 🟢 ต่ำ | แก้ทางตันที่จุดอารมณ์พีค + สร้าง loop ผู้รับ→ผู้สร้าง (จุดแทรก `page.tsx:387-401`, มี `HeartFirework` อยู่แล้ว) |
| 2 | **Instrumentation การดูของผู้รับ** (DB + GA events) | วัดผล (รากฐาน) | ⭐⭐⭐⭐ | 🟢-🟡 ต่ำ-กลาง | ต้องมีก่อน ไม่งั้นพิสูจน์ฟีเจอร์อื่นไม่ได้ |
| 3 | **เสียง + haptics + animation ฉลอง บน interaction เดิม** | ยืด session | ⭐⭐⭐ | 🟢 ต่ำ | ทำให้ scratch/quiz/PIN ลึกขึ้น (ตอนนี้เงียบสนิท) |
| 4 | **Story type ใหม่** (เริ่ม Countdown, Slideshow) | ยืด session | ⭐⭐⭐ | 🟢 ต่ำ/type | เพิ่มเวลาบนจอตรง ๆ, สถาปัตยกรรมรองรับดี |
| 5 | **จำความคืบหน้า (resume) + ปรับ pacing auto-advance** | ยืด session | ⭐⭐ | 🟢 ต่ำ | กันพลิกผ่านข้อความยาวก่อนอ่านจบ |
| 6 | **Daily check-in / engagement reward** (ใช้ credit system) | กลับมาบ่อย | ⭐⭐⭐ | 🟡 กลาง | clone จาก profile-credit pattern |
| 7 | **Reaction/reply loop** (❤️/ตอบกลับ + noti) | กลับมาบ่อย | ⭐⭐⭐⭐ | 🟠 กลาง-สูง | retention สูง แต่ต้องสร้าง noti infra ใหม่ |
| 8 | **เตือนวันสำคัญ (occasion reminders)** | กลับมาบ่อย | ⭐⭐⭐⭐ | 🔴 สูง | ต้องมี email/push + cron + ตาราง saved people |

---

## ส่วนที่ 6: ลำดับการลงมือที่แนะนำ (Roadmap)

### Phase 0 — วางรากฐานการวัดผล (สัปดาห์แรก)
- [ ] เพิ่มตาราง `memory_views` (+ `story_progress` ถ้าทำได้) เขียนจาก viewer ตอนเปิด/จบ
- [ ] เพิ่ม GA events: `view_memory`, `complete_memory`, per-story-reached (เพิ่มใน `EventName` union ที่ `analytics.ts:1-18`)
- 🎯 ได้ baseline ไว้วัดผลฟีเจอร์ถัด ๆ ไป

### Phase 1 — Quick wins บนหน้า viewer (1–2 สัปดาห์)
- [ ] **หน้าจบ/recap** + ปุ่ม "ดูอีกครั้ง" (reset index = 0) + CTA "สร้างความทรงจำของคุณเอง" + `HeartFirework`
- [ ] เพิ่มเสียง + haptics + animation ฉลอง บน scratch/quiz/PIN/ตอนจบ
- [ ] จำความคืบหน้าใน localStorage + ปรับ auto-advance ให้พอเหมาะ
- [ ] เพิ่ม story type ง่าย ๆ 1 อัน (Countdown หรือ Slideshow)

### Phase 2 — เพิ่ม story types + gamification (ต่อเนื่อง)
- [ ] ทยอยเพิ่ม story type (Voice, Spin-wheel, Timeline)
- [ ] Daily check-in / engagement reward ผ่าน credit system

### Phase 3 — Retention loop ใหญ่ (เมื่อพร้อมลงทุน)
- [ ] Reaction/reply loop (สร้าง notification infra)
- [ ] เตือนวันสำคัญ (email/push + cron + ตาราง saved people)

---

## ภาคผนวก: จุดที่ `CLAUDE.md` ล้าสมัย (เจอระหว่างสแกน)

แนะนำให้แก้เพื่อกันเข้าใจผิดในอนาคต:
- การนำทางใน viewer เป็นแบบ **tap-zone Instagram Stories** (แตะซ้าย/ขวา + แถบ progress แบ่งช่อง) ไม่ใช่ "dot indicator + prev/next buttons"
- Question story **ไม่มีเสียง** จริง (มีแค่ animate-shake) — CLAUDE.md เขียนว่า "warning with sound"
- `analytics.ts` มี **18 events** ไม่ใช่ 12
- ไฟล์ `ClaimMoneyModal.tsx` และ `ClaimHistorySection.tsx` **ไม่มีอยู่จริง** ใน `src/components/` (มี `ReferralCodeDisplay.tsx`, `ReferralSetupModal.tsx`, `LinkReferralCodeModal.tsx`)
- migration `014-add-age-function` มีแต่ SQL function ไม่มีไฟล์/ตารางตามที่อ้าง

---

*สร้างโดยการสแกนโค้ดจริงทั้งโปรเจกต์ — 24 พฤษภาคม 2026*
