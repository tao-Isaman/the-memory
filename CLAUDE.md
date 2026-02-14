# The Memory

## Project Overview
A romantic gift web application (Thai-targeted) where users create memory presentations using a **story-based workflow system** to share with loved ones. Users combine text, images, YouTube videos, and PIN protection to create unique experiences for Valentine's Day, anniversaries, and special occasions.

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
| **YouTube** | Embedded video (supports multiple URL formats) | `{ youtubeUrl: "..." }` |
| **Scratch** | Scratch-to-reveal hidden image (ความลับของเรา) | `{ imageUrl: "...", caption?: "..." }` |
| **Question** | Quiz with 4 choices - wrong answer shows warning with sound (คำถาม) | `{ question: "...", choices: [...], correctIndex: 0 }` |

### YouTube URL Formats Supported
- `youtube.com/watch?v=ID`
- `youtu.be/ID`
- `youtube.com/embed/ID`
- `youtube.com/shorts/ID`

## User Flows

### Creator Flow
1. Sign in with Google → `/login` → OAuth callback
2. Dashboard → View all memories + Create new
3. Create/Edit page:
   - Set memory title
   - Add stories (type selection, content input)
   - Reorder via up/down buttons
   - Edit or delete stories
4. Save memory (status: `pending`)
5. Click "ชำระเงิน" → Stripe Checkout
6. Payment success → status becomes `active`
7. Share via URL, QR code, or native share

### Viewer Flow
1. Open shared URL (`/memory/[id]`)
2. Status check:
   - If pending/failed and non-owner → "not ready" message
   - If active or owner → Show preview banner for pending
3. Experience stories sequentially:
   - Sorted by priority (ascending)
   - Password stories lock next content until unlocked
   - Navigation: Previous/Next buttons, dot indicator
4. Optional: Auto-advance mode (5-second intervals, skips password/youtube)
5. Progress bar and counter display
6. Finish button at end

### Payment Flow
1. User saves memory → status: `pending`
2. Click "ชำระเงิน" → POST to `/api/checkout`
3. Redirect to Stripe Checkout
4. Success → `/payment/success?session_id=...&memory_id=...`
5. Verify endpoint updates status to `active`
6. Cancel → `/payment/cancel` → Allow retry

### Credits Purchase Flow
1. Navigate to `/credits` page
2. Select credit package (100/300/500 credits)
3. Click "ซื้อเลย" → POST to `/api/credits/checkout`
4. Redirect to Stripe Checkout (Card or PromptPay)
5. Success → `/payment/success?session_id=...&type=credits`
6. Verify endpoint adds credits to user balance
7. Referral discount (50 THB) applied automatically if eligible

### Cartoon Generation Flow
1. Navigate to Dashboard → "สร้างรูปการ์ตูน" tab
2. Upload photo (JPG/PNG/WebP, max 10MB)
3. Click "สร้างรูปการ์ตูน" (costs 10 credits)
4. Credits deducted → OpenAI generates cartoon → Result displayed (30-60 sec)
5. If generation fails → credits automatically refunded
6. View/download/delete from gallery (paginated, 9 per page)

## Project Structure

```
src/
├── app/
│   ├── (landing)/              # Marketing landing page
│   │   ├── layout.tsx          # Metadata + FloatingHearts
│   │   └── page.tsx            # Features, testimonials, FAQ, animated stats
│   ├── (app)/                  # Authenticated app pages (shared AppBar layout)
│   │   ├── layout.tsx          # AppBar wrapper layout
│   │   ├── create/page.tsx     # Create/Edit memory page
│   │   ├── credits/page.tsx    # Credit packages, balance, transaction history
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Tabbed: memories list + cartoon creator
│   │   │   └── referral/page.tsx # Referral code management
│   │   ├── profile/page.tsx    # User profile page
│   │   └── updates/page.tsx    # Patch notes / "What's new" page
│   ├── admin/                  # Admin dashboard (email-protected)
│   │   ├── layout.tsx          # Auth guard, admin navigation
│   │   ├── page.tsx            # Admin dashboard with stats
│   │   ├── users/
│   │   │   ├── page.tsx        # Users list with filters & pagination
│   │   │   └── [userId]/
│   │   │       └── memories/
│   │   │           └── page.tsx # User's memories list
│   │   └── memories/
│   │       └── [memoryId]/
│   │           └── page.tsx    # Memory details with all stories
│   ├── api/
│   │   ├── admin/              # Admin API routes
│   │   │   ├── users/          # GET: All users with memory counts
│   │   │   │   └── [userId]/
│   │   │   │       └── memories/ # GET: User's memories
│   │   │   └── memories/
│   │   │       └── [memoryId]/ # GET: Memory with stories
│   │   ├── cartoon/
│   │   │   ├── generate/       # POST: Generate cartoon image (OpenAI)
│   │   │   ├── history/        # GET: User's cartoon gallery (paginated)
│   │   │   └── delete/         # POST: Delete cartoon generation
│   │   ├── checkout/           # POST: Create Stripe session (memories)
│   │   ├── credits/
│   │   │   ├── balance/        # GET: User credit balance
│   │   │   ├── checkout/       # POST: Create Stripe session (credits)
│   │   │   ├── packages/       # GET: Active credit packages
│   │   │   └── transactions/   # GET: Credit transaction history
│   │   ├── cron/
│   │   │   └── update-stats/   # GET: Vercel Cron job (daily)
│   │   ├── payment/
│   │   │   ├── status/         # GET: Check payment status
│   │   │   └── verify/         # POST: Verify and activate (memory or credits)
│   │   ├── stats/              # GET: Cached site statistics
│   │   └── webhook/stripe/     # POST: Handle Stripe events (memory + credits)
│   ├── auth/callback/          # GET: OAuth callback
│   ├── login/                  # Google login page
│   ├── memory/[id]/            # Memory viewer
│   ├── payment/
│   │   ├── cancel/             # Payment cancelled
│   │   └── success/            # Payment verified + share modal
│   ├── layout.tsx              # Root with fonts, GA, JSON-LD
│   └── globals.css             # Tailwind + custom animations
├── components/
│   ├── StoryEditor.tsx         # Multi-type form for adding/editing
│   ├── StoryList.tsx           # Reorderable story list
│   ├── StoryViewer.tsx         # Display story content
│   ├── ScratchCard.tsx         # Canvas-based scratch-to-reveal component
│   ├── QuestionGate.tsx        # Quiz question with 4 choices and sound feedback
│   ├── PasswordGate.tsx        # 6-digit PIN input (mobile numpad)
│   ├── CartoonCreator.tsx      # Cartoon generation: upload, generate, gallery
│   ├── ShareModal.tsx          # URL/QR code sharing
│   ├── PaymentButton.tsx       # Stripe checkout initiator
│   ├── PaymentStatus.tsx       # Status badge component
│   ├── HeartIcon.tsx           # Custom SVG heart
│   ├── HeartLoader.tsx         # Animated loading spinner
│   ├── HeartFirework.tsx       # Click-triggered particle animation
│   ├── FloatingHearts.tsx      # Background decoration (15 hearts)
│   ├── YouTubeEmbed.tsx        # YouTube player (16:9)
│   ├── ImageWithLoader.tsx     # Image with loading/error states
│   ├── AppBar.tsx              # Sticky top bar: logo, credit balance, notification, avatar
│   └── ClientProviders.tsx     # AuthProvider + CreditBalanceProvider + HeartFirework
├── contexts/
│   ├── AuthContext.tsx         # Authentication state management
│   └── CreditBalanceContext.tsx # Global credit balance state
├── data/
│   └── patch-notes.ts          # Patch notes data (types, versions, items)
├── hooks/
│   ├── useAuth.ts              # Auth hook
│   └── useCreditBalance.ts     # Credit balance context hook
├── lib/
│   ├── cartoon.ts              # Cartoon generation CRUD + credit deduction/refund
│   ├── constants.ts            # App constants (CARTOON_CREDIT_COST = 10)
│   ├── credits.ts              # Credit packages, balance, transactions CRUD
│   ├── openai.ts               # OpenAI GPT Image 1.5 integration
│   ├── storage.ts              # Memory/Story CRUD operations
│   ├── supabase.ts             # Browser client
│   ├── supabase-server.ts      # Server client (service role)
│   ├── stripe.ts               # Stripe instance
│   ├── upload.ts               # Image processing & upload
│   └── patch-notes.ts          # localStorage-based "last seen version" tracking
└── types/
    ├── cartoon.ts              # CartoonGeneration interface
    ├── credits.ts              # CreditPackage, UserCredits, CreditTransaction
    ├── memory.ts               # Memory & Story interfaces
    └── database.ts             # Supabase generated types
```

## API Routes

### Authentication
- `GET /auth/callback` - OAuth callback, exchanges code for session

### Payment & Checkout
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/checkout` | POST | Creates Stripe checkout session |
| `/api/payment/verify` | POST | Verifies payment, activates memory |
| `/api/payment/status` | GET | Returns memory status + paid_at |
| `/api/webhook/stripe` | POST | Handles Stripe webhook events |

### Credits & Cartoon API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/credits/packages` | GET | List active credit packages |
| `/api/credits/balance` | GET | User credit balance |
| `/api/credits/checkout` | POST | Create Stripe session for credits |
| `/api/credits/transactions` | GET | Credit transaction history (paginated) |
| `/api/cartoon/generate` | POST | Generate cartoon image (deducts 10 credits) |
| `/api/cartoon/history` | GET | User's cartoon gallery (paginated) |
| `/api/cartoon/delete` | POST | Delete cartoon generation + storage files |

### Webhook Events Handled
- `checkout.session.completed` - Activates memory OR adds credits (checks `metadata.type`)
- `checkout.session.async_payment_succeeded` - Activates memory OR adds credits (PromptPay)
- `checkout.session.async_payment_failed` - Sets status to "failed" / logs credit failure

### Site Stats & Cron
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Returns cached site statistics from Vercel Blob |
| `/api/cron/update-stats` | GET | Updates stats (Vercel Cron, daily at midnight) |

### Admin API (Email-protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | All users with memory counts |
| `/api/admin/users/[userId]/memories` | GET | User's memories with story counts |
| `/api/admin/memories/[memoryId]` | GET | Memory details with all stories |

## Database Schema

### Tables

#### `memories`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (references auth.users) |
| title | text | Memory title |
| status | text | 'pending', 'active', 'failed' |
| stripe_checkout_session_id | text | Stripe session ID |
| stripe_payment_intent_id | text | Stripe payment intent |
| paid_at | timestamptz | Payment timestamp |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### `stories`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| memory_id | uuid | Parent memory (references memories) |
| type | text | 'password', 'image', 'text', 'text-image', 'youtube', 'scratch', 'question' |
| priority | integer | Display order |
| title | text | Optional story title |
| content | jsonb | Story content (varies by type) |
| created_at | timestamptz | Creation timestamp |

#### `credit_packages`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Package name (e.g., "100 เครดิต") |
| credits | integer | Number of credits in package |
| price_thb | integer | Price in Thai Baht |
| price_satang | integer | Price in satang (for Stripe) |
| discount_percent | integer | Discount percentage (0 if none) |
| is_popular | boolean | Flag for "popular" badge |
| is_active | boolean | Whether package is available |
| sort_order | integer | Display order |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**Default Packages:**
- 100 credits: 59 THB (0% discount)
- 300 credits: 129 THB (27% discount, Popular)
- 500 credits: 199 THB (33% discount)

#### `user_credits`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users (UNIQUE) |
| balance | integer | Current credit balance |
| total_purchased | integer | Lifetime purchased credits |
| total_used | integer | Lifetime used credits |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Auto-updated via trigger |

#### `credit_transactions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| type | text | 'purchase', 'use', or 'refund' |
| amount | integer | Credits (+purchase/refund, -use) |
| balance_after | integer | Balance after transaction |
| package_id | uuid | References credit_packages (nullable) |
| stripe_checkout_session_id | text | Stripe session ID (nullable) |
| stripe_payment_intent_id | text | Stripe payment intent (nullable) |
| memory_id | uuid | Associated memory (nullable) |
| description | text | Human-readable description |
| created_at | timestamptz | Transaction timestamp |

#### `cartoon_generations`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| original_image_url | text | URL to original uploaded image |
| cartoon_image_url | text | URL to generated cartoon image |
| credits_used | integer | Credits deducted (default: 10) |
| prompt | text | AI prompt used |
| status | text | 'pending', 'completed', 'failed' |
| created_at | timestamptz | Generation timestamp |

### Database Indexes
- `memories(user_id)` - Fast user lookup
- `stories(memory_id)` - Fast story lookup
- `stories(memory_id, priority)` - Ordered story retrieval
- `credit_transactions(user_id)` - Fast user lookup
- `credit_transactions(user_id, created_at)` - Ordered transaction history
- `credit_transactions(stripe_checkout_session_id)` - Idempotency checks
- `cartoon_generations(user_id)` - Fast user lookup
- `cartoon_generations(user_id, created_at)` - Sorted gallery

### Row Level Security (RLS)
- **Memories**: Viewable by anyone (public sharing). CRUD by owner only.
- **Stories**: Viewable by anyone. CRUD by owner only.
- **Credit packages**: Viewable by anyone (active only).
- **User credits**: Viewable/editable by owner only.
- **Credit transactions**: Viewable/insertable by owner only.
- **Cartoon generations**: Viewable by owner only. Full access via service role.
- Service role key bypasses RLS for payment verification and API operations.

### Supabase Storage Buckets
- **`images`** - Memory story images (WebP)
- **`cartoon-images`** - Cartoon generation files (public)
  - `originals/{userId}/{timestamp}-{random}.webp` - User uploads
  - `results/{userId}/{timestamp}-{random}.png` - Generated cartoons

## TypeScript Interfaces

```typescript
type StoryType = 'password' | 'image' | 'text' | 'text-image' | 'youtube' | 'scratch' | 'question';
type MemoryStatus = 'pending' | 'active' | 'failed';

interface BaseStory {
  id: string;
  type: StoryType;
  priority: number;
  title?: string;
  createdAt: string;
}

interface PasswordStory extends BaseStory {
  type: 'password';
  content: { password: string };
}

interface ImageStory extends BaseStory {
  type: 'image';
  content: { imageUrl: string; caption?: string };
}

interface TextStory extends BaseStory {
  type: 'text';
  content: { text: string };
}

interface TextImageStory extends BaseStory {
  type: 'text-image';
  content: { text: string; imageUrl: string };
}

interface YouTubeStory extends BaseStory {
  type: 'youtube';
  content: { youtubeUrl: string };
}

interface ScratchStory extends BaseStory {
  type: 'scratch';
  content: { imageUrl: string; caption?: string };
}

interface QuestionStory extends BaseStory {
  type: 'question';
  content: { question: string; choices: string[]; correctIndex: number };
}

type MemoryStory = PasswordStory | ImageStory | TextStory | TextImageStory | YouTubeStory | ScratchStory | QuestionStory;

interface Memory {
  id: string;
  userId?: string;
  title: string;
  stories: MemoryStory[];
  createdAt: string;
  updatedAt: string;
  status: MemoryStatus;
  paidAt?: string;
}
```

### Credits & Cartoon Types

```typescript
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceTHB: number;
  priceSatang: number;
  discountPercent: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  createdAt: string;
  updatedAt: string;
}

type CreditTransactionType = 'purchase' | 'use' | 'refund';

interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number; // Positive for purchase/refund, negative for use
  balanceAfter: number;
  packageId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  memoryId: string | null;
  description: string | null;
  createdAt: string;
}

interface CartoonGeneration {
  id: string;
  userId: string;
  originalImageUrl: string | null;
  cartoonImageUrl: string | null;
  creditsUsed: number;
  prompt: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
```

## Key Components

### Story Management
- **StoryEditor** - Dynamic form based on story type, image preview, PIN numpad
- **StoryList** - Reorderable list with up/down, edit/delete buttons
- **StoryViewer** - Type-specific rendering with HeartIcon decorations
- **ScratchCard** - Canvas-based scratch-to-reveal with touch/mouse support, cloud overlay, auto-reveal at 50%

### PIN/Password
- **PasswordGate** - 6-digit input with:
  - Mobile numpad UI
  - Desktop keyboard support
  - Auto-focus navigation
  - Auto-submit on completion
  - Shake animation on error

### Sharing
- **ShareModal** - Features:
  - QR code with rounded eye patterns
  - Copy-to-clipboard with feedback
  - QR code download as PNG
  - Native Web Share API support

### Credits System
- **Credits Page** (`/credits`) - Features:
  - Balance display with large counter
  - Package cards with discount badges and per-credit cost
  - "Popular" badge highlight
  - Collapsible transaction history (color-coded: green=purchase, red=use, blue=refund)
- **CreditBalanceContext** - Global provider for real-time credit balance
- **useCreditBalance** hook - `{ balance, loading, refresh }`

### Cartoon Generation
- **CartoonCreator** - Full-featured component with:
  - Drag-and-drop / click-to-upload (max 10MB, JPG/PNG/WebP)
  - Credit balance display + cost indicator (10 credits)
  - Loading state with HeartLoader (30-60 sec estimate)
  - Result display with download button
  - Paginated gallery (9 per page, 2-3 column grid)
  - Click image → action modal (download/delete)
  - Auto-refund notification on generation failure
- **OpenAI Integration** - Uses `gpt-image-1.5` model with style template (`public/template/example.png`)
  - Style transfer: applies cartoon art style from template to user's photo
  - Pastel pink background
  - Output: 1024x1024 PNG, medium quality, base64

### Navigation
- **AppBar** - Sticky top bar with:
  - Logo linking to dashboard
  - Credit balance pill button (Coins icon, links to `/credits`)
  - Notification bell with unseen-update red dot
  - Avatar dropdown (profile, sign out)
  - Click-outside to close menu

### Patch Notes System
- **`src/data/patch-notes.ts`** - Versioned patch notes data (newest first)
- **`src/lib/patch-notes.ts`** - localStorage tracking of last-seen version
- **Updates page** (`/updates`) - Timeline view with type badges (feature/improvement/fix/announcement)

### Animations
- **HeartFirework** - Click-triggered particle effects (8-12 hearts per click)
- **FloatingHearts** - 15 background hearts with deterministic positioning
- **HeartLoader** - 3-layer orbiting hearts spinner
- **ImageWithLoader** - Shimmer effect during load, error fallback

## Image Upload Pipeline

1. Browser loads image file
2. Resize if needed (max 1200x1200, maintains aspect ratio)
3. Convert to WebP (quality: 0.85)
4. Generate unique filename: `{timestamp}-{random}.webp`
5. Upload to Supabase Storage ("images" bucket)
6. Return public URL

## Custom Animations (globals.css)

| Animation | Description |
|-----------|-------------|
| `float` | Vertical movement with rotation |
| `pulse-heart` | Scale pulsing (1.5s) |
| `fade-in-up` | Entry animation |
| `shimmer` | Loading effect |
| `spin-slow` | Slow rotation variants |
| `shake` | Error feedback |

## SEO & Structured Data

- Open Graph & Twitter Card meta tags
- JSON-LD schemas: WebApplication + FAQPage
- Google Search Console verification
- Thai keyword targeting for romantic occasions

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com

# OpenAI
OPENAI_API_KEY=sk-xxx

# Vercel Cron
CRON_SECRET=xxx
```

## Features Implemented

### Core
- [x] Google OAuth login (Supabase Auth)
- [x] Memory CRUD operations
- [x] Story editor with add/edit/delete
- [x] Story reordering (up/down buttons)
- [x] 7 story types: password, image, text, text+image, youtube, scratch, question
- [x] Image upload with WebP conversion
- [x] Preview mode for unpaid memories (owner only)

### Viewer
- [x] Sequential story display
- [x] PIN protection with auto-submit
- [x] Auto-advance mode (5-second intervals)
- [x] Progress bar and counter
- [x] Multi-format YouTube URL support

### Sharing
- [x] Shareable URL generation
- [x] QR code with download
- [x] Copy-to-clipboard
- [x] Native Web Share API

### Payment
- [x] Stripe Checkout (Card + PromptPay)
- [x] Payment verification on redirect
- [x] Webhook backup for async payments
- [x] Payment status tracking

### Referral System
- [x] 6-character referral codes
- [x] New user discount (50 THB)
- [x] Referrer money claim (50 THB per paid referral)
- [x] Claim via PromptPay or Bank Transfer
- [x] Admin claim processing
- [x] Link referral code for users who skipped initial setup

### Navigation & Profile
- [x] AppBar with logo, notification bell, and avatar dropdown menu
- [x] Profile page (avatar, name, email, member since)
- [x] "What's new" / Patch notes page with version timeline
- [x] Unseen update notification badge (localStorage-based)
- [x] Route group `(app)` for shared AppBar layout

### UI/UX
- [x] Responsive design (mobile-first)
- [x] Valentine/romantic theme
- [x] Click-triggered heart fireworks
- [x] Floating hearts background
- [x] Image loading states with shimmer
- [x] Mobile-optimized PIN numpad

### SEO & Analytics
- [x] Custom favicon (heart icon)
- [x] Open Graph / Twitter Card meta tags
- [x] JSON-LD structured data
- [x] Google Analytics GA4
- [x] Google Search Console

### Site Stats
- [x] Animated counter on landing page hero section
- [x] Vercel Cron job (daily at midnight)
- [x] Vercel Blob caching for zero DB queries on page load (with `allowOverwrite`)
- [x] Stats: users, memories, stories

### Credits System
- [x] Credit packages (100/300/500 credits with bulk discounts)
- [x] Stripe Checkout for credit purchases (Card + PromptPay)
- [x] Credit balance tracking with global context provider
- [x] Transaction history (purchase/use/refund) with audit trail
- [x] Idempotent credit addition (prevents duplicate webhook processing)
- [x] AppBar credit balance display with navigation to credits page
- [x] Referral discount (50 THB) applied to credit purchases

### Cartoon Image Generation
- [x] AI-powered photo-to-cartoon conversion (OpenAI GPT Image 1.5)
- [x] Style template system for consistent cartoon art style
- [x] Credit-based pricing (10 credits per generation)
- [x] Automatic credit refund on generation failure
- [x] Optimistic locking for credit deduction (prevents race conditions)
- [x] Upload to Supabase Storage (originals + results)
- [x] Paginated cartoon gallery with download/delete
- [x] Dashboard tab navigation (memories / cartoon)

### Admin System
- [x] Email-protected access (`NEXT_PUBLIC_ADMIN_EMAIL`)
- [x] Admin dashboard with overview stats
- [x] Users list with search and filters (memories, paid, referral)
- [x] Client-side pagination (20 users per page)
- [x] View user's memories with story counts
- [x] View memory details with all stories (all types supported)
- [x] Uses Supabase Auth admin API for accurate user data

## Vercel Configuration

**`vercel.json`** - Cron job schedule:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-stats",
      "schedule": "0 0 * * *"
    }
  ]
}
```
Note: Vercel Hobby plan allows only once-daily cron execution.

## Migrations

Located in `supabase/migrations/`:
1. `supabase-setup.sql` - Initial schema (memories, nodes tables)
2. `supabase-migration-001-add-node-title.sql` - Add title to nodes
3. `002-add-payment-status.sql` - Add payment columns to memories
4. `003-rename-nodes-to-stories.sql` - Rename nodes table to stories
5. `009-add-scratch-story-type.sql` - Add scratch type to stories constraint
6. `010-add-question-story-type.sql` - Add question type to stories constraint
7. `011-add-credits-system.sql` - Credit packages, user_credits, credit_transactions tables
8. `012-add-cartoon-generations.sql` - Cartoon generations table + cartoon-images storage bucket

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Referral System Architecture

### Overview
- **Referrer (old user)**: Shares 6-char code, earns 50 THB when referred users pay
- **Referred (new user)**: Uses code at signup, gets 50 THB discount on first payment (memory or credits)

### Database Tables
- `user_referrals`: User's referral code and who referred them
- `referral_claims`: Admin records of payout requests (PromptPay/Bank)
- `referral_conversions`: Records when referred users pay (optional, for tracking)

### CRITICAL: Pending Claims Calculation
**ALWAYS calculate `pendingDiscounts` dynamically, NEVER use stored counters!**

```
pendingDiscounts = (paid referred users) - (claims submitted)
```

**Why:** Stored counters (`pending_discount_claims` column) can get out of sync if:
- Payment webhook fails to increment counter
- Manual database changes
- Race conditions

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

// Count claims already submitted
const { count: claimedCount } = await supabase
  .from('referral_claims')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

// Dynamic calculation
const pendingDiscounts = Math.max(0, paidCount - (claimedCount || 0));
```

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/referral/setup` | POST | Create/link referral code |
| `/api/referral/status` | GET | Get code + stats (uses dynamic calculation) |
| `/api/referral/claim-discount` | POST | Submit claim request |
| `/api/referral/claim-discount` | GET | Get claim history |
| `/api/referral/check-discount` | GET | Check new user discount eligibility |
| `/api/referral/referred-users` | GET | List users who used referrer's code |
| `/api/referral/link-code` | POST | Link referral code for users who skipped |

### Components
- `ReferralCodeDisplay.tsx`: Shows code, stats, claim button, referred users list
- `ClaimMoneyModal.tsx`: Form for PromptPay/Bank Transfer claim
- `ClaimHistorySection.tsx`: Shows claim status (pending/completed/rejected)
- `LinkReferralCodeModal.tsx`: Modal for users who skipped to enter a referral code later

### IMPORTANT: Referral "Paid" Check
The `hasUserPaidBefore` function in `src/lib/referral.ts` checks **both** active memories AND credit purchases (`credit_transactions` with `type = 'purchase'`). This ensures referral discount eligibility is checked against all payment types.

## Performance Optimizations

- WebP image conversion (reduces file size)
- Database indexes on frequently queried columns
- useCallback/useMemo for complex components
- Progressive image loading with shimmer
- Suspense boundaries for code splitting
- Optimistic locking for credit deduction (prevents race conditions)
- Idempotent webhook handlers (prevents duplicate credit grants)

---
*Project started: 2026-02-01*
*Last updated: 2026-02-13*
