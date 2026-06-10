// Universe (จักรวาล) — client helpers for the public story feed + emoji reactions.
// The feed is read through the get_universe_feed RPC with the user's own JWT
// (SECURITY DEFINER server-side); reactions go through the service-role API so the
// story owner can be notified (in-app + Web Push).
import { getSupabaseBrowserClient } from './supabase';
import { MemoryTheme } from '@/types/memory';
import { UniverseStory, UniverseStoryType } from '@/types/universe';

/** Page size for the lazy-loaded feed (matches the spec: 10 per scroll). */
export const UNIVERSE_PAGE_SIZE = 10;

/**
 * One shuffle seed per feed visit. The RPC orders by md5(story_id || seed), a stable
 * per-seed shuffle, so OFFSET paging with a constant seed never repeats or skips.
 */
export function newFeedSeed(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type FeedRow = {
  story_id: string;
  story_type: string;
  story_title: string | null;
  story_content: unknown;
  story_created_at: string;
  memory_id: string;
  memory_title: string;
  memory_theme: string;
  owner_name: string;
  owner_avatar: string | null;
  reaction_counts: unknown;
  my_emoji: string | null;
};

/** Fetch one page of the universe feed. Returns [] on any error (feed is best-effort). */
export async function getUniverseFeed(
  seed: string,
  offset: number,
  limit: number = UNIVERSE_PAGE_SIZE
): Promise<UniverseStory[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_universe_feed', {
    p_seed: seed,
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !data) {
    console.error('Error fetching universe feed:', error);
    return [];
  }

  return (data as FeedRow[]).map((row) => ({
    storyId: row.story_id,
    type: row.story_type as UniverseStoryType,
    title: row.story_title || undefined,
    content: (row.story_content || {}) as UniverseStory['content'],
    createdAt: row.story_created_at,
    memoryId: row.memory_id,
    memoryTitle: row.memory_title,
    theme: (row.memory_theme || 'love') as MemoryTheme,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar,
    reactionCounts: (row.reaction_counts || {}) as Record<string, number>,
    myEmoji: row.my_emoji,
  }));
}

/**
 * Toggle the current user's emoji reaction on a feed story.
 * Same emoji again → removed; different emoji → switched. Never throws.
 */
export async function toggleUniverseReaction(
  storyId: string,
  emoji: string
): Promise<{ ok: boolean; action?: 'added' | 'removed'; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const sess = await supabase?.auth.getSession();
    const token = sess?.data.session?.access_token;
    if (!token) return { ok: false, error: 'กรุณาเข้าสู่ระบบ' };

    const res = await fetch('/api/universe/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ storyId, emoji }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.error || 'ส่งไม่สำเร็จ' };
    return { ok: true, action: data?.action };
  } catch {
    return { ok: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}
