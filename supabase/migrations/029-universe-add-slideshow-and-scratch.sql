-- Universe: also surface อัลบั้ม (slideshow) and secret-image (scratch) stories.
-- Replaces get_universe_feed from migration 025 — the ONLY change is the story-type
-- filter, which previously allowed image/text-image/text.
--
-- Both carry images in `content` (scratch: {imageUrl}, slideshow: {imageUrls[]}), so the
-- feed can render them; the client scratches to reveal, keeping the surprise intact.
-- Consent is unchanged: the memory's share_to_universe checkbox still gates everything.
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
    AND s.type IN ('image', 'text-image', 'text', 'scratch', 'slideshow')
    AND m.user_id IS DISTINCT FROM auth.uid()
  ORDER BY md5(s.id::text || p_seed)
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 30)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0)
$$;

REVOKE ALL ON FUNCTION public.get_universe_feed(TEXT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_universe_feed(TEXT, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_universe_feed(TEXT, INT, INT) TO authenticated;
