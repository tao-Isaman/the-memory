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
- **Image Upload**: Supabase Storage (WebP conversion, 0.85 quality)
- **QR Code**: react-qrcode-logo
- **Icons**: Lucide React 0.563.0
- **Analytics**: Google Analytics GA4 (G-MZKHDF94QX)
- **Hosting**: Vercel

## Core Concept
Users build a memory presentation by creating and arranging **stories**. Each story represents a step in the memory experience. The sequence is determined by story priority. Memories require payment to activate and share.

## Story Types
| Story Type | Description | Content Structure |
|------------|-------------|-------------------|
| **Password (PIN)** | 6-digit PIN gate with mobile numpad | `{ password: "123456" }` |
| **Image** | Image with optional caption | `{ imageUrl: "...", caption?: "..." }` |
| **Text** | Multi-line text message | `{ text: "..." }` |
| **Text + Image** | Combined text and image | `{ text: "...", imageUrl: "..." }` |
| **YouTube** | Embedded video (supports multiple URL formats) | `{ youtubeUrl: "..." }` |

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

## Project Structure

```
src/
├── app/
│   ├── (landing)/              # Marketing landing page
│   │   ├── layout.tsx          # Metadata + FloatingHearts
│   │   └── page.tsx            # Features, testimonials, FAQ
│   ├── api/
│   │   ├── checkout/           # POST: Create Stripe session
│   │   ├── payment/
│   │   │   ├── status/         # GET: Check payment status
│   │   │   └── verify/         # POST: Verify and activate
│   │   └── webhook/stripe/     # POST: Handle Stripe events
│   ├── auth/callback/          # GET: OAuth callback
│   ├── create/                 # Create/Edit memory page
│   ├── dashboard/              # User's memories list
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
│   ├── PasswordGate.tsx        # 6-digit PIN input (mobile numpad)
│   ├── ShareModal.tsx          # URL/QR code sharing
│   ├── PaymentButton.tsx       # Stripe checkout initiator
│   ├── PaymentStatus.tsx       # Status badge component
│   ├── HeartIcon.tsx           # Custom SVG heart
│   ├── HeartLoader.tsx         # Animated loading spinner
│   ├── HeartFirework.tsx       # Click-triggered particle animation
│   ├── FloatingHearts.tsx      # Background decoration (15 hearts)
│   ├── YouTubeEmbed.tsx        # YouTube player (16:9)
│   ├── ImageWithLoader.tsx     # Image with loading/error states
│   └── ClientProviders.tsx     # AuthProvider + HeartFirework
├── contexts/
│   └── AuthContext.tsx         # Authentication state management
├── hooks/
│   └── useAuth.ts              # Auth hook
├── lib/
│   ├── storage.ts              # Memory/Story CRUD operations
│   ├── supabase.ts             # Browser client
│   ├── supabase-server.ts      # Server client (service role)
│   ├── stripe.ts               # Stripe instance
│   └── upload.ts               # Image processing & upload
└── types/
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

### Webhook Events Handled
- `checkout.session.completed` - Activates memory (Card payments)
- `checkout.session.async_payment_succeeded` - Activates memory (PromptPay)
- `checkout.session.async_payment_failed` - Sets status to "failed"

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
| type | text | 'password', 'image', 'text', 'text-image', 'youtube' |
| priority | integer | Display order |
| title | text | Optional story title |
| content | jsonb | Story content (varies by type) |
| created_at | timestamptz | Creation timestamp |

### Database Indexes
- `memories(user_id)` - Fast user lookup
- `stories(memory_id)` - Fast story lookup
- `stories(memory_id, priority)` - Ordered story retrieval

### Row Level Security (RLS)
- **Memories**: Viewable by anyone (public sharing). CRUD by owner only.
- **Stories**: Viewable by anyone. CRUD by owner only.
- Service role key bypasses RLS for payment verification.

## TypeScript Interfaces

```typescript
type StoryType = 'password' | 'image' | 'text' | 'text-image' | 'youtube';
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

type MemoryStory = PasswordStory | ImageStory | TextStory | TextImageStory | YouTubeStory;

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

## Key Components

### Story Management
- **StoryEditor** - Dynamic form based on story type, image preview, PIN numpad
- **StoryList** - Reorderable list with up/down, edit/delete buttons
- **StoryViewer** - Type-specific rendering with HeartIcon decorations

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
```

## Features Implemented

### Core
- [x] Google OAuth login (Supabase Auth)
- [x] Memory CRUD operations
- [x] Story editor with add/edit/delete
- [x] Story reordering (up/down buttons)
- [x] 5 story types: password, image, text, text+image, youtube
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

## Migrations

Located in `supabase/migrations/`:
1. `supabase-setup.sql` - Initial schema (memories, nodes tables)
2. `supabase-migration-001-add-node-title.sql` - Add title to nodes
3. `002-add-payment-status.sql` - Add payment columns to memories
4. `003-rename-nodes-to-stories.sql` - Rename nodes table to stories

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

## Performance Optimizations

- WebP image conversion (reduces file size)
- Database indexes on frequently queried columns
- useCallback/useMemo for complex components
- Progressive image loading with shimmer
- Suspense boundaries for code splitting

---
*Project started: 2026-02-01*
*Last updated: 2026-02-02*
