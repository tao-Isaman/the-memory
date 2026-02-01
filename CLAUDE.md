# The Memory

## Project Overview
A web application where users create memory presentations using a **node-based workflow system** to share with their loved ones.

## Tech Stack
- **Frontend**: Next.js
- **Backend/Auth/DB**: Supabase
- **Hosting**: Vercel
- **Auth Method**: Google (Gmail) via Supabase

## Core Concept
Users build a memory presentation by creating and arranging **nodes**. Each node represents a step in the memory experience. The sequence is determined by node priority.

## Node Types
| Node Type | Description |
|-----------|-------------|
| **Password Node** | Requires viewer to enter a password to continue |
| **Image Node** | Displays an image |
| **Text Node** | Displays a message/text |
| **Text + Image Node** | Displays text alongside an image |
| **YouTube Node** | Embeds a YouTube video/song via URL |

## User Flow

### Creator Flow
1. Login with Gmail (Supabase Auth)
2. Create new memory
3. Add nodes (image, text, password, youtube, etc.)
4. Set priority/order for each node
5. Submit/Publish memory
6. Get shareable URL
7. Share URL with partner

### Viewer Flow
1. Open shared URL
2. Experience nodes in sequence (by priority)
3. If password node exists, must enter correct password to proceed
4. View images, text, videos in order

## Database Schema (Draft)

### Tables
- `users` - managed by Supabase Auth
- `memories` - id, user_id, title, created_at, published
- `nodes` - id, memory_id, type, content, priority, created_at

### Node Content Structure (JSON)
```
Password Node: { password: "secret123" }
Image Node: { image_url: "...", caption?: "..." }
Text Node: { text: "..." }
Text+Image Node: { text: "...", image_url: "..." }
YouTube Node: { youtube_url: "..." }
```

## Features
- [ ] Gmail login (Supabase) - *later*
- [ ] Memory CRUD
- [ ] Node-based editor with drag & drop priority
- [ ] Node types: password, image, text, text+image, youtube
- [ ] Shareable URL generation
- [ ] Viewer experience (sequential node display)
- [ ] Password protection via password node
- [ ] Responsive design
- [ ] Valentine theme styling

---

## Phase 1: Prototype (Current)

### Goals
- No authentication (add later)
- Use localStorage for data persistence (migrate to Supabase later)
- Valentine-style UI theme
- Next.js + TypeScript

### Data Interfaces
```typescript
type NodeType = 'password' | 'image' | 'text' | 'text-image' | 'youtube';

interface BaseNode {
  id: string;
  type: NodeType;
  priority: number;
  createdAt: string;
}

interface PasswordNode extends BaseNode {
  type: 'password';
  content: { password: string };
}

interface ImageNode extends BaseNode {
  type: 'image';
  content: { imageUrl: string; caption?: string };
}

interface TextNode extends BaseNode {
  type: 'text';
  content: { text: string };
}

interface TextImageNode extends BaseNode {
  type: 'text-image';
  content: { text: string; imageUrl: string };
}

interface YouTubeNode extends BaseNode {
  type: 'youtube';
  content: { youtubeUrl: string };
}

type MemoryNode = PasswordNode | ImageNode | TextNode | TextImageNode | YouTubeNode;

interface Memory {
  id: string;
  title: string;
  nodes: MemoryNode[];
  createdAt: string;
  updatedAt: string;
}
```

### localStorage Keys
- `memories` - Array of Memory objects
- `currentMemoryId` - ID of memory being edited

---
*Project started: 2026-02-01*
