# The Memory

## Project Overview
A web application where users create memory presentations using a **story-based workflow system** to share with their loved ones. Users can combine text, images, YouTube videos, and PIN protection to create a unique memory experience.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Payment**: Stripe (Checkout with Card & PromptPay)
- **Image Upload**: Supabase Storage
- **Hosting**: Vercel
- **Icons**: Lucide React

## Core Concept
Users build a memory presentation by creating and arranging **stories**. Each story represents a step in the memory experience. The sequence is determined by story priority. Memories require payment to activate and share.

## Story Types
| Story Type | Description |
|------------|-------------|
| **Password (PIN)** | Requires viewer to enter a 6-digit PIN to continue |
| **Image** | Displays an image with optional caption |
| **Text** | Displays a message/text |
| **Text + Image** | Displays text alongside an image |
| **YouTube** | Embeds a YouTube video/song via URL |

## User Flow

### Creator Flow
1. Login with Google (Supabase Auth)
2. Create new memory from dashboard
3. Add stories (image, text, password, youtube, etc.)
4. Reorder stories using up/down buttons
5. Edit or delete stories as needed
6. Save memory (status: `pending`)
7. Pay via Stripe Checkout (Card or PromptPay)
8. After payment, memory becomes `active`
9. Share URL or QR code with loved one

### Viewer Flow
1. Open shared URL (`/memory/[id]`)
2. Experience stories in sequence (by priority)
3. If PIN story exists, must enter correct 6-digit PIN to proceed
4. View images, text, videos in order
5. Auto-advance option available

### Payment Flow
1. User saves memory → status: `pending`
2. Click "ชำระเงิน" → redirects to Stripe Checkout
3. Complete payment → redirects to `/payment/success`
4. Success page verifies payment and updates status to `active`
5. User can now share the memory

## Project Structure

```
src/
├── app/
│   ├── (landing)/          # Landing page with separate layout
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── checkout/       # Create Stripe Checkout session
│   │   ├── payment/
│   │   │   ├── status/     # Check payment status
│   │   │   └── verify/     # Verify and activate memory
│   │   └── webhook/stripe/ # Stripe webhook (backup)
│   ├── auth/callback/      # Supabase OAuth callback
│   ├── create/             # Create/Edit memory page
│   ├── dashboard/          # User's memories list
│   ├── login/              # Login page
│   ├── memory/[id]/        # Memory viewer
│   ├── payment/
│   │   ├── cancel/         # Payment cancelled
│   │   └── success/        # Payment success
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── StoryEditor.tsx     # Add/Edit story form
│   ├── StoryList.tsx       # List stories with reorder/edit/delete
│   ├── StoryViewer.tsx     # Display story content
│   ├── PasswordGate.tsx    # PIN entry UI (6-digit)
│   ├── ShareModal.tsx      # Share URL/QR code modal
│   ├── PaymentButton.tsx   # Stripe checkout button
│   ├── PaymentStatus.tsx   # Status badge (pending/active)
│   ├── HeartIcon.tsx       # Custom heart SVG
│   ├── HeartLoader.tsx     # Loading spinner
│   ├── HeartFirework.tsx   # Success animation
│   ├── FloatingHearts.tsx  # Background animation
│   ├── YouTubeEmbed.tsx    # YouTube player embed
│   └── ClientProviders.tsx # Client-side providers
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── hooks/
│   └── useAuth.ts          # Auth hook
├── lib/
│   ├── storage.ts          # Supabase data operations
│   ├── supabase.ts         # Supabase browser client
│   ├── supabase-server.ts  # Supabase server client
│   ├── stripe.ts           # Stripe client
│   └── upload.ts           # Image upload to Supabase Storage
└── types/
    ├── memory.ts           # Memory & Story types
    └── database.ts         # Supabase database types
```

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

### Story Content Structure (JSONB)
```json
Password: { "password": "123456" }
Image: { "imageUrl": "...", "caption": "..." }
Text: { "text": "..." }
Text+Image: { "text": "...", "imageUrl": "..." }
YouTube: { "youtubeUrl": "https://youtube.com/watch?v=..." }
```

### Row Level Security (RLS)
- **Memories**: Users can CRUD their own memories. Active memories are viewable by anyone.
- **Stories**: Users can CRUD stories of their own memories. Stories of active memories are viewable by anyone.

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

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Features Implemented

- [x] Google OAuth login (Supabase Auth)
- [x] Memory CRUD operations
- [x] Story editor with add/edit/delete
- [x] Story reordering (up/down buttons)
- [x] Story types: password (6-digit PIN), image, text, text+image, youtube
- [x] Image upload to Supabase Storage
- [x] Shareable URL generation
- [x] QR code generation
- [x] Memory viewer with sequential story display
- [x] PIN protection with auto-submit
- [x] Auto-advance mode for viewer
- [x] Preview mode for unpaid memories (owner only)
- [x] Stripe payment integration (Card + PromptPay)
- [x] Payment verification on success redirect
- [x] Responsive design
- [x] Valentine/romantic theme styling
- [x] Custom favicon (heart icon)
- [x] Open Graph / Twitter Card meta tags
- [x] Google Analytics integration

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

---
*Project started: 2026-02-01*
*Last updated: 2026-02-01*
