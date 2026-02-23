# The Memory

## Project Overview
A **Digital Memory & Emotion Platform** (Thai-targeted) where users create memory presentations using a **story-based workflow system** to share with loved ones. Users combine text, images, YouTube videos, and PIN protection to create unique experiences for all occasions — surprises, anniversaries, birthdays, apologies, long-distance relationships, and family. Positioned year-round with "ของขวัญเซอร์ไพรส์แฟน" as the primary SEO keyword.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Runtime**: React 19.2.3
- **Styling**: Tailwind CSS 4 (with @tailwindcss/postcss)
- **Fonts**: Kanit (UI), Itim (body), Leckerli One (display) - Google Fonts
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (Google OAuth)
- **Payment**: Stripe (Card & PromptPay) - API v2026-01-28
- **AI Image Generation**: OpenAI GPT Image 1.5 (cartoon style transfer)
- **Image Upload**: Supabase Storage (WebP conversion, 0.85 quality)
- **QR Code**: react-qrcode-logo
- **Icons**: Lucide React 0.563.0
- **Charts**: Recharts 2.15.0
- **Analytics**: Google Analytics GA4 (G-MZKHDF94QX)
- **Hosting**: Vercel
- **Cron Jobs**: Vercel Cron (daily stats update)
- **Blob Storage**: Vercel Blob (stats caching)

## Core Concept
Users build a memory presentation by creating and arranging **stories**. Each story represents a step in the memory experience. The sequence is determined by story priority. Memories require payment to activate and share. Users can also purchase credits to use AI-powered features like cartoon image generation.

## Story Types
| Story Type | Description | Content Structure |
|------------|-------------|-------------------|
| **Password (PIN)** | 6-digit PIN gate with mobile numpad | `{ password: "123456" }` |
| **Image** | Image with optional caption | `{ imageUrl: "...", caption?: "..." }` |
| **Text** | Multi-line text message | `{ text: "..." }` |
| **Text + Image** | Combined text and image | `{ text: "...", imageUrl: "..." }` |
| **YouTube** | Embedded video (supports watch, youtu.be, embed, shorts URLs) | `{ youtubeUrl: "..." }` |
| **Scratch** | Scratch-to-reveal hidden image | `{ imageUrl: "...", caption?: "..." }` |
| **Question** | Quiz with 4 choices - wrong answer shows warning with sound | `{ question: "...", choices: [...], correctIndex: 0 }` |

## User Flows

### Creator Flow
1. Sign in with Google → `/login` → OAuth callback (optionally from `/use-case/[slug]` with `?usecase` param)
2. Dashboard → View all memories + Create new
3. Create/Edit page (theme auto-set if arriving from use case page): Set title, add/reorder/edit/delete stories
4. Save memory (status: `pending`) → Click "ชำระเงิน" → Stripe Checkout
5. Payment success → status becomes `active` → Share via URL, QR code, or native share

### Viewer Flow
1. Open shared URL (`/memory/[id]`)
2. Status check: pending/failed non-owner → "not ready"; active or owner → show stories
3. Sequential stories sorted by priority, password stories lock until unlocked
4. Navigation: Previous/Next buttons, dot indicator, optional auto-advance (5s), progress bar

### Payment Flow
1. Save memory → `pending` → POST `/api/checkout` → Stripe Checkout
2. Success → `/payment/success?session_id=...&memory_id=...` → verify → `active`
3. Cancel → `/payment/cancel` → retry

### Credits Purchase Flow
1. `/credits` → Select package (100/300/500) → POST `/api/credits/checkout` → Stripe
2. Success → `/payment/success?session_id=...&type=credits` → verify → credits added
3. Referral discount (50 THB) applied automatically if eligible

### Cartoon Generation Flow
1. Dashboard → "สร้างรูปการ์ตูน" tab → Upload photo (max 10MB)
2. Generate (costs 10 credits) → OpenAI generates → Result displayed (30-60 sec)
3. If fails → credits auto-refunded. View/download/delete from paginated gallery

## Project Structure

```
src/
├── app/
│   ├── (landing)/              # Marketing landing page
│   │   ├── layout.tsx          # Metadata + FloatingHearts
│   │   ├── page.tsx            # Hero, features, social proof, use case navigator, FAQ, CTA
│   │   └── use-case/[slug]/    # SSG use case pages (6 slugs)
│   ├── (app)/                  # Authenticated app pages (shared AppBar layout)
│   │   ├── layout.tsx          # AppBar wrapper layout
│   │   ├── create/page.tsx     # Create/Edit memory page
│   │   ├── credits/page.tsx    # Credit packages, balance, transaction history
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Tabbed: memories list + cartoon creator
│   │   │   └── referral/page.tsx # Referral code management
│   │   ├── onboarding/page.tsx  # New user onboarding form
│   │   ├── profile/page.tsx    # User profile page (editable with credit reward)
│   │   └── updates/page.tsx    # Patch notes page
│   ├── admin/                  # Admin dashboard (email-protected)
│   │   ├── layout.tsx          # Auth guard + navigation
│   │   ├── page.tsx            # Stats + recent activity
│   │   ├── users/              # Users list + user memories + memory details
│   │   ├── referral-claims/    # Approve/reject referral claims
│   │   ├── credits/            # Credit system overview
│   │   └── cartoons/           # Cartoon generation monitor
│   ├── api/
│   │   ├── admin/              # Admin: stats, users, memories, referral-claims, referral-stats, credits, cartoons
│   │   ├── cartoon/            # generate (POST), history (GET), delete (POST)
│   │   ├── checkout/           # POST: Create Stripe session (memories)
│   │   ├── credits/            # balance (GET), checkout (POST), packages (GET), transactions (GET)
│   │   ├── cron/update-stats/  # GET: Vercel Cron (daily)
│   │   ├── payment/            # status (GET), verify (POST)
│   │   ├── profile/            # GET/POST + claim-credits (POST)
│   │   ├── referral/           # setup, status, claim-discount, check-discount, referred-users, link-code
│   │   ├── stats/              # GET: Cached site statistics
│   │   └── webhook/stripe/     # POST: Handle Stripe events
│   ├── auth/callback/          # OAuth callback
│   ├── login/                  # Google login page
│   ├── memory/[id]/            # Memory viewer
│   └── payment/                # success + cancel pages
├── components/
│   ├── StoryEditor.tsx         # Multi-type form for adding/editing
│   ├── StoryList.tsx           # Reorderable story list
│   ├── StoryViewer.tsx         # Display story content
│   ├── ScratchCard.tsx         # Canvas-based scratch-to-reveal
│   ├── QuestionGate.tsx        # Quiz with 4 choices + sound feedback
│   ├── PasswordGate.tsx        # 6-digit PIN input (mobile numpad)
│   ├── ProfileCompletionBanner.tsx # Profile completion modal (10 credits)
│   ├── Toast.tsx               # Toast notification (success/error/info)
│   ├── CartoonCreator.tsx      # Upload, generate, gallery
│   ├── ShareModal.tsx          # URL/QR code sharing
│   ├── PaymentButton.tsx       # Stripe checkout initiator
│   ├── ThemeSelector.tsx       # 7-theme grid with mood descriptions
│   ├── HeartFirework.tsx       # Click-triggered particle animation
│   ├── FloatingHearts.tsx      # Background decoration (10 hearts, 15% opacity)
│   ├── AppBar.tsx              # Sticky top bar: logo, credit balance, notification, avatar
│   └── ClientProviders.tsx     # AuthProvider + CreditBalanceProvider + HeartFirework
├── contexts/                   # AuthContext, CreditBalanceContext, ToastContext
├── data/                       # patch-notes.ts, use-cases.ts
├── hooks/                      # useAuth, useCreditBalance, useToast
├── lib/
│   ├── analytics.ts            # GA4 trackEvent (12 event types)
│   ├── cartoon.ts              # Cartoon CRUD + credit deduction/refund
│   ├── constants.ts            # CARTOON_CREDIT_COST=10, PROFILE_COMPLETION_CREDITS=10
│   ├── credits.ts              # Credit packages, balance, transactions CRUD
│   ├── openai.ts               # OpenAI GPT Image 1.5 integration
│   ├── storage.ts              # Memory/Story CRUD
│   ├── supabase.ts             # Browser client
│   ├── supabase-server.ts      # Server client (service role)
│   ├── stripe.ts               # Stripe instance
│   ├── themes.ts               # 7 theme color palettes + THEME_INFO
│   ├── upload.ts               # Image processing & upload
│   ├── profile.ts              # User profile CRUD, completion check
│   └── patch-notes.ts          # localStorage "last seen version" tracking
└── types/                      # memory.ts, credits.ts, cartoon.ts, profile.ts, database.ts
```

## Webhook Events Handled
- `checkout.session.completed` - Activates memory OR adds credits (checks `metadata.type`)
- `checkout.session.async_payment_succeeded` - Same (for PromptPay async)
- `checkout.session.async_payment_failed` - Sets status to "failed"

## Database Schema

### `memories`
`id` (uuid PK), `user_id` (uuid FK auth.users), `title` (text), `status` ('pending'|'active'|'failed'), `stripe_checkout_session_id`, `stripe_payment_intent_id`, `paid_at`, `created_at`, `updated_at`

### `stories`
`id` (uuid PK), `memory_id` (uuid FK memories), `type` ('password'|'image'|'text'|'text-image'|'youtube'|'scratch'|'question'), `priority` (int), `title` (text?), `content` (jsonb), `created_at`

### `credit_packages`
`id` (uuid PK), `name`, `credits` (int), `price_thb` (int), `price_satang` (int), `discount_percent` (int), `is_popular` (bool), `is_active` (bool), `sort_order` (int), `created_at`, `updated_at`

**Default Packages:** 100cr/59THB (0%), 300cr/129THB (27%, Popular), 500cr/199THB (33%)

### `user_credits`
`id` (uuid PK), `user_id` (uuid UNIQUE FK), `balance` (int), `total_purchased` (int), `total_used` (int), `created_at`, `updated_at` (auto-trigger)

### `credit_transactions`
`id` (uuid PK), `user_id` (uuid FK), `type` ('purchase'|'use'|'refund'), `amount` (int, +/-), `balance_after` (int), `package_id` (uuid?), `stripe_checkout_session_id`?, `stripe_payment_intent_id`?, `memory_id`?, `description`?, `created_at`

### `user_profiles`
`id` (uuid PK), `user_id` (uuid UNIQUE FK), `phone`?, `birthday` (date?), `gender` ('male'|'female'|'other'?), `job`?, `relationship_status` ('single'|'dating'|'married'|'other'?), `occasion_type` ('valentine'|'anniversary'|'birthday'|'other'?), `profile_credits_claimed` (bool, default false), `created_at`, `updated_at`

### `cartoon_generations`
`id` (uuid PK), `user_id` (uuid FK), `original_image_url`?, `cartoon_image_url`?, `credits_used` (int, default 10), `prompt`?, `status` ('pending'|'completed'|'failed'), `created_at`

### Database Indexes
- `memories(user_id)`, `stories(memory_id)`, `stories(memory_id, priority)`
- `credit_transactions(user_id)`, `credit_transactions(user_id, created_at)`, `credit_transactions(stripe_checkout_session_id)`
- `cartoon_generations(user_id)`, `cartoon_generations(user_id, created_at)`
- `user_profiles(user_id)`

### Row Level Security (RLS)
- **Memories/Stories**: Viewable by anyone (public sharing). CRUD by owner only.
- **Credit packages**: Viewable by anyone (active only).
- **User credits/transactions**: Owner only.
- **Cartoon generations/User profiles**: Owner only. Full access via service role.
- Service role key bypasses RLS for payment verification and API operations.

### Supabase Storage Buckets
- **`images`** - Memory story images (WebP)
- **`cartoon-images`** - `originals/{userId}/{ts}-{rand}.webp` + `results/{userId}/{ts}-{rand}.png`

## Theme System

7 themes in `src/lib/themes.ts`. Type: `MemoryTheme` in `src/types/memory.ts`.

| Theme | Primary | Mood |
|-------|---------|------|
| `love` | #E63946 | โรแมนติก อบอุ่น |
| `friend` | #457B9D | สดใส เฮฮา |
| `family` | #2D6A4F | อบอุ่น ผูกพัน |
| `anniversary` | #C9A96E | หรูหรา คลาสสิก |
| `birthday` | #FF8C42 | สนุกสนาน สดใส |
| `apology` | #9B8EC4 | อ่อนโยน จริงใจ |
| `longdistance` | #5BA4CF | คิดถึง ห่วงใย |

`getThemeColors(theme)` returns theme colors with fallback to `love`.

## Use Case System

6 SSG pages at `/use-case/[slug]` defined in `src/data/use-cases.ts`:

| Slug | Theme | Thai Title |
|------|-------|-----------|
| `surprise-gift` | love | ของขวัญเซอร์ไพรส์แฟน |
| `anniversary` | anniversary | ของขวัญวันครบรอบ |
| `birthday` | birthday | อวยพรวันเกิด |
| `apology` | apology | ขอโทษคนรัก |
| `long-distance` | longdistance | คิดถึง Long Distance |
| `family` | family | ขอบคุณครอบครัว |

### Use Case → Create Flow
1. User visits `/use-case/[slug]` → CTA links to `/login?usecase=[slug]`
2. Login page stores `usecase` in `sessionStorage` (wrapped in `<Suspense>`)
3. After OAuth, create page reads `sessionStorage.getItem('pending_usecase')` → theme auto-set

## Color System (globals.css)

Warm neutral palette: `--background: #FFFBF7`, `--cream: #FFF8F0`, `--warm-beige: #F5EDE4`, `--warm-gray: #6B5E57`, `--muted-pink: #E8A0B5`. Primary button gradient (pink→red) as accent.

## Image Upload Pipeline

1. Resize if needed (max 1200x1200) → Convert to WebP (0.85) → Upload to Supabase Storage ("images") → Return public URL

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_ADMIN_EMAIL
OPENAI_API_KEY, CRON_SECRET
```

## Vercel Configuration

Cron: `/api/cron/update-stats` at `0 0 * * *` (daily midnight). Hobby plan = once-daily only.

## Migrations

Located in `supabase/migrations/`:
1. `supabase-setup.sql` - Initial schema
2. `001-add-node-title.sql` → `002-add-payment-status.sql` → `003-rename-nodes-to-stories.sql`
3. `009-add-scratch-story-type.sql` → `010-add-question-story-type.sql`
4. `011-add-credits-system.sql` → `012-add-cartoon-generations.sql`
5. `013-add-user-profiles.sql` → `014-add-age-function.sql` → `015-expand-theme-types.sql`

## Development

```bash
npm install && npm run dev    # Development
npm run build && npm start    # Production
```

## Referral System Architecture

### Overview
- **Referrer**: Shares 6-char code, earns 50 THB when referred users pay
- **Referred**: Uses code at signup, gets 50 THB discount on first payment (memory or credits)

### Database Tables
- `user_referrals`: User's referral code and who referred them
- `referral_claims`: Admin records of payout requests (PromptPay/Bank)
- `referral_conversions`: Records when referred users pay

### CRITICAL: Pending Claims Calculation
**ALWAYS calculate `pendingDiscounts` dynamically, NEVER use stored counters!**

```
pendingDiscounts = (paid referred users) - (claims submitted)
```

**Why:** Stored counters can get out of sync (webhook failures, manual DB changes, race conditions).

**Correct Implementation (`/api/referral/status` and `/api/referral/claim-discount`):**
```typescript
// Count paid referred users from memories table
const { data: referredUsers } = await supabase
  .from('user_referrals')
  .select('user_id')
  .eq('referred_by', userId);

const userIds = referredUsers.map(u => u.user_id);
const { data: paidMemories } = await supabase
  .from('memories')
  .select('user_id')
  .in('user_id', userIds)
  .eq('status', 'active');

const paidCount = new Set(paidMemories.map(m => m.user_id)).size;

const { count: claimedCount } = await supabase
  .from('referral_claims')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

const pendingDiscounts = Math.max(0, paidCount - (claimedCount || 0));
```

### Referral Components
- `ReferralCodeDisplay.tsx`, `ClaimMoneyModal.tsx`, `ClaimHistorySection.tsx`, `LinkReferralCodeModal.tsx`

### IMPORTANT: Referral "Paid" Check
`hasUserPaidBefore` in `src/lib/referral.ts` checks **both** active memories AND credit purchases (`credit_transactions` with `type = 'purchase'`).

## Key Technical Patterns

- **Optimistic locking** for credit deduction (prevents race conditions)
- **Idempotent webhook handlers** (prevents duplicate credit grants via `stripe_checkout_session_id` check)
- **WebP image conversion** (max 1200x1200, quality 0.85)
- **OpenAI cartoon**: `gpt-image-1.5` with style template (`public/template/example.png`), 1024x1024 PNG output
- **Toast notifications** via `useToast()` hook (replaces all `alert()` calls)
- **Credit balance** via global `CreditBalanceContext` + `useCreditBalance` hook
- **GA4 analytics**: `trackEvent(event, params)` in `src/lib/analytics.ts` (12 event types)
- **Admin access**: email-protected via `NEXT_PUBLIC_ADMIN_EMAIL`, dashboard data localized to Thai Time (UTC+7)

---
*Project started: 2026-02-01*
*Last updated: 2026-02-16*
