-- Universe (จักรวาล) — an Instagram-like public feed of stories from shared memories.
-- 1) memories.share_to_universe: opt-OUT flag (default ON; owners untick to hide a memory).
-- 2) universe_reactions: logged-in users react to a feed story with an emoji.
-- 3) get_universe_feed(): seeded-random feed RPC (stable shuffle per seed → safe OFFSET paging).

-- ── 1. Share flag ─────────────────────────────────────────────────
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS share_to_universe BOOLEAN NOT NULL DEFAULT TRUE;

-- Feed candidates: only active + shared memories.
CREATE INDEX IF NOT EXISTS idx_memories_universe
  ON public.memories(id) WHERE status = 'active' AND share_to_universe;

-- ── 2. Reactions ──────────────────────────────────────────────────
-- ONE row per (story, user), forever:
--   * toggle off            → removed_at set (soft delete; the row is kept)
--   * re-react/switch emoji → row updated, removed_at cleared
--   * notified_at           → the owner is notified at most ONCE per (story, user);
--                             re-toggling never re-notifies (anti notification spam).
-- story_id intentionally has NO foreign key: saveMemory() rewrites stories as
-- delete + re-insert with the SAME ids on every edit, so an FK CASCADE would wipe
-- all reactions each time a memory is saved. Rows whose story is truly gone never
-- surface (the feed joins stories) and are removed when the memory is deleted
-- via the memory_id cascade.
CREATE TABLE IF NOT EXISTS public.universe_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  removed_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_universe_reactions_story ON public.universe_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_universe_reactions_memory ON public.universe_reactions(memory_id);

-- Written via the service-role API and read via the feed RPC only — no client policies.
ALTER TABLE public.universe_reactions ENABLE ROW LEVEL SECURITY;

-- ── 3. Feed RPC ───────────────────────────────────────────────────
-- Seeded random: ORDER BY md5(story_id || seed) is a stable per-seed shuffle, so the
-- client keeps one seed per visit and pages with OFFSET (10 at a time) without
-- duplicates or gaps. SECURITY DEFINER because it needs auth.users (display
-- name/avatar) and cross-user reaction rows.
-- Privacy rules baked in:
--   * only active + share_to_universe memories
--   * only image / text-image / text stories
--   * stories at/after a PIN (password) story are NEVER exposed
--   * the caller's own stories are excluded
--   * the owner's user id is NOT returned to the client
CREATE OR REPLACE FUNCTION public.get_universe_feed(
  p_seed TEXT,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  story_id UUID,
  story_type TEXT,
  story_title TEXT,
  story_content JSONB,
  story_created_at TIMESTAMPTZ,
  memory_id UUID,
  memory_title TEXT,
  memory_theme TEXT,
  owner_name TEXT,
  owner_avatar TEXT,
  reaction_counts JSONB,
  my_emoji TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    s.id,
    s.type,
    s.title,
    s.content,
    s.created_at,
    m.id,
    m.title,
    COALESCE(m.theme, 'love'),
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1),
      'เพื่อนในจักรวาล'
    ),
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
    COALESCE(rc.counts, '{}'::jsonb),
    mine.emoji
  FROM public.stories s
  JOIN public.memories m ON m.id = s.memory_id
  JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN LATERAL (
    SELECT jsonb_object_agg(g.emoji, g.cnt) AS counts
    FROM (
      SELECT r.emoji, COUNT(*) AS cnt
      FROM public.universe_reactions r
      WHERE r.story_id = s.id AND r.removed_at IS NULL
      GROUP BY r.emoji
    ) g
  ) rc ON TRUE
  LEFT JOIN public.universe_reactions mine
    ON mine.story_id = s.id AND mine.user_id = auth.uid() AND mine.removed_at IS NULL
  WHERE m.status = 'active'
    AND m.share_to_universe = TRUE
    AND s.type IN ('image', 'text-image', 'text')
    AND m.user_id IS DISTINCT FROM auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.stories pin
      WHERE pin.memory_id = s.memory_id
        AND pin.type = 'password'
        AND pin.priority <= s.priority
    )
  ORDER BY md5(s.id::text || p_seed)
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 30)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0)
$$;

-- Logged-in users only (the feed lives behind the dashboard).
REVOKE ALL ON FUNCTION public.get_universe_feed(TEXT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_universe_feed(TEXT, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_universe_feed(TEXT, INT, INT) TO authenticated;
