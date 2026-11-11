-- Undoes 036, restoring the definitions as they were on prod on 2026-11-11.
-- Re-exposes what 036 fixed; only for when 036 broke something.
begin;

alter function public.handle_updated_at() reset search_path;
alter function public.update_user_credits_updated_at() reset search_path;
alter function public.update_user_profiles_updated_at() reset search_path;
alter function public.update_user_referrals_updated_at() reset search_path;

alter view public.daily_app_engagement reset (security_invoker);

CREATE OR REPLACE FUNCTION public.get_universe_feed(p_seed text, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS TABLE(story_id uuid, story_type text, story_title text, story_content jsonb, story_created_at timestamp with time zone, memory_id uuid, memory_title text, memory_theme text, owner_name text, owner_avatar text, reaction_counts jsonb, my_emoji text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

commit;
