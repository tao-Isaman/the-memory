import { MemoryTheme } from './memory';

/** Story types that appear in the universe feed (kept in sync with get_universe_feed). */
export type UniverseStoryType =
  | 'image'
  | 'text'
  | 'text-image'
  | 'scratch'
  | 'slideshow';

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
