import { MemoryTheme } from './memory';

/**
 * Story types that may appear in the universe (จักรวาล) feed — the single source of truth
 * for the client and the reaction API, kept in sync with get_universe_feed (migration 029).
 *
 * Product rule (boss, 2026-11-07): stories that sit AFTER a PIN in a memory may be shown in
 * the universe, but the PIN itself and its content never are. So 'password' (the PIN story)
 * must never be added here; 'question', 'voice' and 'youtube' stay out as well.
 */
export const UNIVERSE_STORY_TYPES = ['image', 'text', 'text-image', 'scratch', 'slideshow'] as const;

export type UniverseStoryType = (typeof UNIVERSE_STORY_TYPES)[number];

export function isUniverseStoryType(type: unknown): type is UniverseStoryType {
  return typeof type === 'string' && (UNIVERSE_STORY_TYPES as readonly string[]).includes(type);
}

/** One story card in the universe (จักรวาล) feed, as returned by the get_universe_feed RPC. */
export interface UniverseStory {
  storyId: string;
  type: UniverseStoryType;
  title?: string;
  /** image/scratch use imageUrl; slideshow uses imageUrls (2..5, array order = display order). */
  content: {
    imageUrl?: string;
    imageUrls?: string[];
    caption?: string;
    text?: string;
  };
  createdAt: string;
  memoryId: string;
  memoryTitle: string;
  theme: MemoryTheme;
  ownerName: string;
  ownerAvatar: string | null;
  /** Aggregated emoji → count (toggled-off reactions excluded). */
  reactionCounts: Record<string, number>;
  /** The viewer's own active reaction on this story, if any. */
  myEmoji: string | null;
}
