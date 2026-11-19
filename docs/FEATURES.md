# The Memory — feature map

Every page and endpoint under `src/app`, grouped by what a person does with it. A test (`src/guardrails`, rule R6) fails when a `page.tsx` or `route.ts` under `src/app` is missing here, or when a row points at a route that no longer exists. The "Check" column names the driver scenario or test that proves the feature works ("—" means nothing covers it yet). Every API row is also swept by `src/lib/api-auth.test.mjs`, which checks that each handler guards its caller.

**Who:** anyone = not signed in · creator = signed in · viewer = has a shared link · admin = the admin email · Stripe = Stripe webhook · cron = Vercel cron

## Landing & use cases

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Home page: hero phone demo, occasions, features, pricing, FAQ, sample memory | anyone | `/[locale]` | Open the site; tap "ดูตัวอย่างความทรงจำ" for the demo, "เริ่มสร้างฟรี" to start | `src/app/[locale]/(landing)/page.tsx`, `src/app/[locale]/(landing)/LandingPageClient.tsx`, `src/components/DemoMemoryModal.tsx` | drive `landing` |
| Live site counters on the home page | anyone | `/api/stats` | Loaded by the home page | `src/app/api/stats/route.ts` | `src/lib/api-auth.test.mjs` |
| Use-case pages (6 slugs, theme preset into create) | anyone | `/[locale]/use-case/[slug]` | Home page section "สร้างความทรงจำสำหรับโอกาสไหน?" or footer links | `src/app/[locale]/(landing)/use-case/[slug]/page.tsx`, `src/data/use-cases.ts` | — |
| SEO landing: anniversary | anyone | `/[locale]/anniversary` | Search engines (no in-app link) | `src/app/[locale]/(landing)/anniversary/page.tsx`, `src/data/seo-landings.ts` | drive `occasions` |
| SEO landing: ask out | anyone | `/[locale]/ask-out` | Search engines | `src/app/[locale]/(landing)/ask-out/page.tsx`, `src/data/seo-landings.ts` | — |
| SEO landing: birthday | anyone | `/[locale]/birthday` | Search engines | `src/app/[locale]/(landing)/birthday/page.tsx`, `src/data/seo-landings.ts` | drive `occasions` |
| SEO landing: confess | anyone | `/[locale]/confess` | Search engines | `src/app/[locale]/(landing)/confess/page.tsx`, `src/data/seo-landings.ts` | — |
| SEO landing: family | anyone | `/[locale]/family` | Search engines | `src/app/[locale]/(landing)/family/page.tsx`, `src/data/seo-landings.ts` | — |
| SEO landing: miss you | anyone | `/[locale]/missyou` | Search engines | `src/app/[locale]/(landing)/missyou/page.tsx`, `src/data/seo-landings.ts` | — |
| SEO landing: reconcile | anyone | `/[locale]/reconcile` | Search engines | `src/app/[locale]/(landing)/reconcile/page.tsx`, `src/data/seo-landings.ts` | — |
| SEO landing: valentine | anyone | `/[locale]/valentine` | Search engines | `src/app/[locale]/(landing)/valentine/page.tsx`, `src/data/seo-landings.ts` | — |
| Privacy policy | anyone | `/[locale]/privacy` | Footer "นโยบายความเป็นส่วนตัว", login checkbox link | `src/app/[locale]/(landing)/privacy/page.tsx`, `src/data/legal.ts` | drive `legal` |
| Terms of use | anyone | `/[locale]/terms` | Footer "ข้อกำหนดการใช้งาน", login checkbox link | `src/app/[locale]/(landing)/terms/page.tsx`, `src/data/legal.ts` | drive `legal` |

## Sign in & onboarding

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Google sign-in with PDPA consent checkbox | anyone | `/[locale]/login` | "เริ่มสร้างเลย" / "เข้าสู่ระบบ", tick consent, tap "เข้าสู่ระบบด้วย Google" | `src/app/[locale]/login/page.tsx`, `src/lib/consent.ts` | drive `login` |
| OAuth callback: new users go to onboarding, else dashboard or the `next` param | anyone | `/auth/callback` | Automatic after Google sign-in | `src/app/auth/callback/route.ts` | — |
| Onboarding profile form (6 fields, credit reward) | creator | `/[locale]/onboarding` | First sign-in (no profile yet); "ข้ามไปก่อน" to skip | `src/app/[locale]/(app)/onboarding/page.tsx`, `src/lib/profile.ts` | — |

## Creating memories

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Dashboard: memory list, Universe feed, cartoon tab, share-to-Universe toggle | creator | `/[locale]/dashboard` | After sign-in, or AppBar "หน้าหลัก"; tabs "ความทรงจำ" / "จักรวาล" / "สร้างรูปการ์ตูน" | `src/app/[locale]/(app)/dashboard/page.tsx`, `src/components/UniverseFeed.tsx`, `src/components/ShareModal.tsx` | `src/lib/loykrathong/popup.test.mjs` (season popup on app pages) |
| Create / edit a memory: title, theme, stories, templates, save | creator | `/[locale]/create` | Dashboard "สร้างความทรงจำใหม่" or a card's "แก้ไข"; "บันทึกความทรงจำ" | `src/app/[locale]/(app)/create/page.tsx`, `src/components/StoryEditor.tsx`, `src/lib/create-steps.ts`, `src/lib/memory-templates.ts` | `src/lib/create-steps.test.mjs`, `src/lib/memory-templates.test.mjs` |
| React to a Universe story (emoji toggle, notifies owner) | creator | `/api/universe/reaction` | Dashboard "จักรวาล" tab, tap an emoji under a story | `src/app/api/universe/reaction/route.ts`, `src/lib/universe.ts` | `src/lib/api-auth.test.mjs` |

## Viewing a shared memory

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Memory viewer: PIN gate, stories in order, ending screen | viewer | `/[locale]/memory/[id]` | Open the shared link or QR from "แชร์ความทรงจำ" | `src/app/[locale]/memory/[id]/page.tsx`, `src/components/StoryViewer.tsx`, `src/components/PasswordGate.tsx` | — |
| Recipient reaction and short reply to the creator | viewer | `/api/memory/reaction` | Ending screen "ส่งความรู้สึกถึงผู้สร้าง", "+ เขียนข้อความถึงผู้สร้าง" | `src/app/api/memory/reaction/route.ts`, `src/lib/reactions.ts` | `src/lib/api-auth.test.mjs` |
| View-session tracking (start / progress / end) | viewer | `/api/memory/view` | Automatic while the viewer is open | `src/app/api/memory/view/route.ts`, `src/lib/view-tracking.ts` | `src/lib/api-auth.test.mjs` |

## Payment & credits

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Pay to activate a memory (Stripe card / PromptPay) | creator | `/api/checkout` | Tap "ชำระเงิน" (or "ชำระเงิน (ลด … บาท)") on a pending memory | `src/app/api/checkout/route.ts`, `src/components/PaymentButton.tsx` | `src/lib/api-auth.test.mjs` |
| Payment success page (memory or credits) | creator | `/[locale]/payment/success` | Stripe redirects back after paying | `src/app/[locale]/payment/success/page.tsx` | — |
| Verify a Stripe session and activate / add credits | creator | `/api/payment/verify` | Called by the success page | `src/app/api/payment/verify/route.ts` | `src/lib/api-auth.test.mjs` |
| Read a memory's payment status | creator | `/api/payment/status` | No UI caller found; direct API only | `src/app/api/payment/status/route.ts` | `src/lib/api-auth.test.mjs` |
| Payment cancelled page | creator | `/[locale]/payment/cancel` | Cancel on Stripe Checkout | `src/app/[locale]/payment/cancel/page.tsx` | drive `payment-cancel` |
| Credits page: packages, balance, history | creator | `/[locale]/credits` | AppBar credit balance | `src/app/[locale]/(app)/credits/page.tsx`, `src/lib/credits.ts` | — |
| List credit packages | creator | `/api/credits/packages` | Loaded by the credits page | `src/app/api/credits/packages/route.ts` | `src/lib/api-auth.test.mjs` |
| Buy a credit package | creator | `/api/credits/checkout` | Credits page "ซื้อเลย" | `src/app/api/credits/checkout/route.ts` | `src/lib/api-auth.test.mjs` |
| Credit balance | creator | `/api/credits/balance` | AppBar balance (global context) | `src/app/api/credits/balance/route.ts`, `src/contexts/CreditBalanceContext.tsx` | `src/lib/api-auth.test.mjs` |
| Credit transaction history | creator | `/api/credits/transactions` | Credits page "ประวัติการใช้เครดิต" | `src/app/api/credits/transactions/route.ts` | `src/lib/api-auth.test.mjs` |

## Cartoon generation

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Generate a cartoon from a photo (10 credits, refund on failure) | creator | `/api/cartoon/generate` | Dashboard "สร้างรูปการ์ตูน" tab, upload, tap "สร้างรูปการ์ตูน (ใช้ 10 เครดิต)" | `src/app/api/cartoon/generate/route.ts`, `src/components/CartoonCreator.tsx`, `src/lib/cartoon.ts`, `src/lib/openai.ts` | `src/lib/api-auth.test.mjs` |
| Cartoon gallery (paginated) | creator | `/api/cartoon/history` | Same tab, "รูปการ์ตูนของคุณ" | `src/app/api/cartoon/history/route.ts` | `src/lib/api-auth.test.mjs` |
| Delete a cartoon | creator | `/api/cartoon/delete` | Gallery, "ลบ" on a cartoon | `src/app/api/cartoon/delete/route.ts` | `src/lib/api-auth.test.mjs` |

## Referral

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Referral page: code, referred users, claim history | creator | `/[locale]/dashboard/referral` | Dashboard "ลิงก์แนะนำ & รับเงิน 50 บาท" | `src/app/[locale]/(app)/dashboard/referral/page.tsx`, `src/components/ReferralCodeDisplay.tsx` | — |
| Create my referral code | creator | `/api/referral/setup` | Referral page "สร้างโค้ดแนะนำ" | `src/app/api/referral/setup/route.ts`, `src/lib/referral.ts` | `src/lib/api-auth.test.mjs` |
| Referral status (pending payouts computed live) | creator | `/api/referral/status` | Loaded by the referral page | `src/app/api/referral/status/route.ts` | `src/lib/api-auth.test.mjs` |
| List users who used my code | creator | `/api/referral/referred-users` | Referral page "รายชื่อผู้ใช้โค้ด" | `src/app/api/referral/referred-users/route.ts` | `src/lib/api-auth.test.mjs` |
| Claim every payout left in one request (50 THB × rights; PromptPay / bank) and claim history | creator | `/api/referral/claim-discount` | Referral page "ขอรับเงิน", then "ยืนยันขอรับเงิน … บาท" | `src/app/api/referral/claim-discount/route.ts`, `src/lib/referral-claims.ts`, `src/components/ClaimMoneyModal.tsx`, `src/components/ClaimHistorySection.tsx` | `src/lib/api-auth.test.mjs`, `src/lib/referral-claims.test.mjs` |
| See the transfer slip of my completed payout (owner or admin; image passed through, Blob URL never sent) | creator | `/api/referral/claims/[claimId]/slip` | Claim history "ดูสลิปการโอน"; admin claims "ดูสลิป" | `src/app/api/referral/claims/[claimId]/slip/route.ts`, `src/components/SlipButton.tsx` | `src/lib/api-auth.test.mjs` |
| Enter a friend's code for a first-payment discount | creator | `/api/referral/link-code` | "ใส่โค้ดแนะนำ" modal, "ยืนยันโค้ด" | `src/app/api/referral/link-code/route.ts`, `src/components/LinkReferralCodeModal.tsx` | `src/lib/api-auth.test.mjs` |
| Check if the 50 THB discount applies | creator | `/api/referral/check-discount` | Loaded by the pay button | `src/app/api/referral/check-discount/route.ts` | `src/lib/api-auth.test.mjs` |
| Validate a referral code (blocks self-referral) | creator | `/api/referral/validate` | No UI caller found; direct API only | `src/app/api/referral/validate/route.ts` | `src/lib/api-auth.test.mjs` |

## Profile, updates & push

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Profile page (edit, claim profile credits) | creator | `/[locale]/profile` | AppBar avatar, or banner "กรอกโปรไฟล์ รับเครดิตฟรี!" | `src/app/[locale]/(app)/profile/page.tsx`, `src/components/ProfileCompletionBanner.tsx` | — |
| Read / save profile | creator | `/api/profile` | Profile and onboarding pages | `src/app/api/profile/route.ts`, `src/lib/profile.ts` | `src/lib/api-auth.test.mjs` |
| Claim profile-completion credits | creator | `/api/profile/claim-credits` | "รับเครดิต" after the profile is complete | `src/app/api/profile/claim-credits/route.ts` | `src/lib/api-auth.test.mjs` |
| Patch notes | creator | `/[locale]/updates` | Bell "การแจ้งเตือน", "อัปเดต" tab, "ดูอัปเดตทั้งหมด →" | `src/app/[locale]/(app)/updates/page.tsx`, `src/data/patch-notes.ts` | — |
| Turn on Web Push (subscribe / unsubscribe) | creator | `/api/push/subscribe` | Prompt "เปิดการแจ้งเตือน รับเครดิตฟรี!" → "เปิดเลย", or bell "เปิดการแจ้งเตือนบนอุปกรณ์นี้" | `src/app/api/push/subscribe/route.ts`, `src/lib/push.ts` | `src/lib/api-auth.test.mjs` |

## Loy Krathong

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Loy Krathong village mini-game (walk, shop, float, chat) | anyone | `/[locale]/loykrathong` | Dashboard tab "ลอยกระทง", or the Loy strip / popup; chat needs "เข้าสู่ระบบเพื่อแชท" | `src/app/[locale]/(landing)/loykrathong/page.tsx`, `src/components/loykrathong/LoyKrathongGame.tsx`, `src/lib/loykrathong/config.ts` | drive `occasions` |
| Loy Krathong content pages (3 slugs) with template CTA | anyone | `/[locale]/loykrathong/[slug]` | Search engines; CTA opens create with the Loy template | `src/app/[locale]/(landing)/loykrathong/[slug]/page.tsx`, `src/data/loy-pages.ts`, `src/components/loykrathong/LoyTemplateCta.tsx` | — |
| Float a krathong (wish, optional name, cooldown) | anyone | `/api/loykrathong/float` | In game at the pier, "ลอยกระทง" | `src/app/api/loykrathong/float/route.ts`, `src/lib/profanity.ts` | `src/lib/api-auth.test.mjs` |
| River contents (count + latest floats) | anyone | `/api/loykrathong/floats` | Loaded by the game | `src/app/api/loykrathong/floats/route.ts`, `src/components/loykrathong/useRoom.ts` | `src/lib/api-auth.test.mjs` |

The once-a-day season popup ("ชวนแฟนเลย") on app pages is covered by `src/lib/loykrathong/popup.test.mjs`.

## Admin

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Admin dashboard: stats + recent activity | admin | `/[locale]/admin` | Admin nav "Dashboard" | `src/app/[locale]/admin/page.tsx`, `src/app/[locale]/admin/layout.tsx` | — |
| Admin stats data | admin | `/api/admin/stats` | Loaded by the admin dashboard | `src/app/api/admin/stats/route.ts` | `src/lib/api-auth.test.mjs` |
| Insights: funnel, payment drivers, revenue | admin | `/[locale]/admin/insights` | Admin nav "Insights" | `src/app/[locale]/admin/insights/page.tsx` | — |
| Insights data | admin | `/api/admin/insights` | Loaded by the insights page | `src/app/api/admin/insights/route.ts` | `src/lib/api-auth.test.mjs` |
| Time in app | admin | `/[locale]/admin/engagement` | Admin nav "Time in App" | `src/app/[locale]/admin/engagement/page.tsx` | — |
| Time-in-app data | admin | `/api/admin/engagement` | Loaded by the engagement page | `src/app/api/admin/engagement/route.ts` | `src/lib/api-auth.test.mjs` |
| Users list | admin | `/[locale]/admin/users` | Admin nav "Users" | `src/app/[locale]/admin/users/page.tsx` | — |
| Users data | admin | `/api/admin/users` | Loaded by the users page | `src/app/api/admin/users/route.ts` | `src/lib/api-auth.test.mjs` |
| One user's memories | admin | `/[locale]/admin/users/[userId]/memories` | Users list, open a user's memories | `src/app/[locale]/admin/users/[userId]/memories/page.tsx` | — |
| One user's memories data | admin | `/api/admin/users/[userId]/memories` | Loaded by that page | `src/app/api/admin/users/[userId]/memories/route.ts` | `src/lib/api-auth.test.mjs` |
| Memory detail | admin | `/[locale]/admin/memories/[memoryId]` | A user's memories list, open a memory | `src/app/[locale]/admin/memories/[memoryId]/page.tsx` | — |
| Memory detail data | admin | `/api/admin/memories/[memoryId]` | Loaded by that page | `src/app/api/admin/memories/[memoryId]/route.ts` | `src/lib/api-auth.test.mjs` |
| Referral claims: pay one person's pending requests at once (grouped by account), reject one by one, attach slips | admin | `/[locale]/admin/referral-claims` | Admin nav "Referral Claims" → "รอโอน" box, "โอนแล้ว" | `src/app/[locale]/admin/referral-claims/page.tsx`, `src/components/admin/PayoutGroups.tsx` | `src/lib/referral-claims.test.mjs` |
| Mark a payout transferred (+ optional slip, jpg/png/webp ≤ 5 MB, to Vercel Blob) or attach a slip later | admin | `/api/admin/referral-claims/transfer` | Claims page "โอนแล้ว" / "แนบสลิป" | `src/app/api/admin/referral-claims/transfer/route.ts` | `src/lib/api-auth.test.mjs`, `src/lib/referral-claims.test.mjs` |
| Referral claims list | admin | `/api/admin/referral-claims` | Loaded by the claims page | `src/app/api/admin/referral-claims/route.ts` | `src/lib/api-auth.test.mjs` |
| Update one claim's status | admin | `/api/admin/referral-claims/[claimId]` | Approve / reject on a claim | `src/app/api/admin/referral-claims/[claimId]/route.ts` | `src/lib/api-auth.test.mjs` |
| Referral stats | admin | `/api/admin/referral-stats` | Loaded by the claims page | `src/app/api/admin/referral-stats/route.ts` | `src/lib/api-auth.test.mjs` |
| Credit system overview | admin | `/[locale]/admin/credits` | Admin nav "Credits" | `src/app/[locale]/admin/credits/page.tsx` | — |
| Credits data | admin | `/api/admin/credits` | Loaded by the credits page | `src/app/api/admin/credits/route.ts` | `src/lib/api-auth.test.mjs` |
| Cartoon generation monitor | admin | `/[locale]/admin/cartoons` | Admin nav "Cartoons" | `src/app/[locale]/admin/cartoons/page.tsx` | — |
| Cartoons data | admin | `/api/admin/cartoons` | Loaded by the cartoons page | `src/app/api/admin/cartoons/route.ts` | `src/lib/api-auth.test.mjs` |
| Notifications: broadcast or send to one user, optional push | admin | `/[locale]/admin/notifications` | Admin nav "Notifications" | `src/app/[locale]/admin/notifications/page.tsx` | — |
| Send a notification | admin | `/api/admin/notifications/send` | Send button on the notifications page | `src/app/api/admin/notifications/send/route.ts` | `src/lib/api-auth.test.mjs` |
| Push subscribers list | admin | `/api/admin/notifications/subscribers` | Loaded by the notifications page | `src/app/api/admin/notifications/subscribers/route.ts` | `src/lib/api-auth.test.mjs` |

## System endpoints (cron, webhook, tracking)

| Feature | Who | Route | How to reach it | Code | Check |
|---|---|---|---|---|---|
| Stripe webhook: activate memory / add credits / mark failed | Stripe | `/api/webhook/stripe` | Stripe checkout events | `src/app/api/webhook/stripe/route.ts` | `src/lib/api-auth.test.mjs` |
| Daily stats refresh + prune old notifications | cron | `/api/cron/update-stats` | Vercel cron, daily 00:00 | `src/app/api/cron/update-stats/route.ts`, `vercel.json` | `src/lib/api-auth.test.mjs` |
| Reconcile missed PromptPay payments | cron | `/api/cron/reconcile-payments` | Vercel cron, daily 01:00 (or on demand with the cron secret) | `src/app/api/cron/reconcile-payments/route.ts`, `vercel.json` | `src/lib/api-auth.test.mjs` |
| Time-in-app sessions (start / heartbeat / end) | creator | `/api/app/session` | Automatic while the app is open | `src/app/api/app/session/route.ts`, `src/lib/app-session.ts` | `src/lib/api-auth.test.mjs` |
| PWA install / launch tracking | anyone | `/api/pwa/track` | Automatic; prompt "ติดตั้งแอป The Memory" → "ติดตั้ง" | `src/app/api/pwa/track/route.ts`, `src/lib/pwa.ts` | `src/lib/api-auth.test.mjs` |
