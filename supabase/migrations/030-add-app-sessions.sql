-- Time-in-app tracking for signed-in users.
--
-- Mirrors the proven memory_views pattern (migration 017): ONE row per session, updated
-- by heartbeats, flushed with sendBeacon on unload. Not one row per event — that would
-- grow without bound and make every admin query a scan.
--
-- duration_seconds counts VISIBLE time only (Page Visibility API). Counting wall-clock
-- would turn a single forgotten background tab into "this user spent 9 hours in our app",
-- which is the classic way these metrics become useless.
--
-- Recipients are already measured by memory_views.duration_seconds; anonymous landing
-- traffic by GA4. This table is specifically the signed-in app (dashboard, create,
-- credits, profile, universe, updates).
CREATE TABLE IF NOT EXISTS public.app_sessions (
  id UUID PRIMARY KEY,                       -- client-generated, so heartbeats can upsert
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,  -- accumulated foreground time
  page_views INTEGER NOT NULL DEFAULT 1,
  locale TEXT,
  is_pwa BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes chosen for the four cuts the admin dashboard asks for:
-- totals/averages + daily trend (started_at), per-user leaderboard (user_id),
-- stickiness DAU/MAU (user_id, started_at).
CREATE INDEX IF NOT EXISTS idx_app_sessions_started_at ON public.app_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON public.app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_started ON public.app_sessions(user_id, started_at);

-- Service-role only (written by /api/app/session, read by the admin API). No client policies.
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Pre-aggregated daily rollup. Anything that wants "how much time, by day" reads
-- this instead of scanning raw sessions — that's what makes this easy to analyse.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.daily_app_engagement AS
SELECT
  (started_at AT TIME ZONE 'Asia/Bangkok')::date AS day,   -- reported in Thai time, like the rest of admin
  count(*)                                        AS sessions,
  count(DISTINCT user_id)                         AS active_users,
  sum(duration_seconds)                           AS total_seconds,
  round(avg(duration_seconds))                    AS avg_session_seconds,
  round(sum(duration_seconds)::numeric / NULLIF(count(DISTINCT user_id), 0)) AS seconds_per_user
FROM public.app_sessions
GROUP BY 1;

-- ---------------------------------------------------------------------------
-- Everything the admin dashboard needs, in ONE round trip.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_engagement_stats(p_days INT DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH win AS (
    SELECT * FROM public.app_sessions
    WHERE started_at >= NOW() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
  )
  SELECT jsonb_build_object(
    'totals', (
      SELECT jsonb_build_object(
        'sessions',           COALESCE(count(*), 0),
        'activeUsers',        COALESCE(count(DISTINCT user_id), 0),
        'totalSeconds',       COALESCE(sum(duration_seconds), 0),
        'avgSessionSeconds',  COALESCE(round(avg(duration_seconds)), 0),
        'secondsPerUser',     COALESCE(round(sum(duration_seconds)::numeric
                                / NULLIF(count(DISTINCT user_id), 0)), 0)
      ) FROM win
    ),
    -- Daily trend (oldest -> newest) for the chart.
    'daily', COALESCE((
      SELECT jsonb_agg(d ORDER BY d->>'day')
      FROM (
        SELECT jsonb_build_object(
          'day',            day,
          'sessions',       sessions,
          'activeUsers',    active_users,
          'totalSeconds',   total_seconds,
          'avgSessionSeconds', avg_session_seconds
        ) AS d
        FROM public.daily_app_engagement
        WHERE day >= ((NOW() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1)))
                      AT TIME ZONE 'Asia/Bangkok')::date
      ) t
    ), '[]'::jsonb),
    -- Per-user leaderboard.
    'topUsers', COALESCE((
      SELECT jsonb_agg(u ORDER BY (u->>'totalSeconds')::bigint DESC)
      FROM (
        SELECT jsonb_build_object(
          'userId',       w.user_id,
          'email',        COALESCE(au.email, 'unknown'),
          'sessions',     count(*),
          'totalSeconds', sum(w.duration_seconds),
          'lastSeenAt',   max(w.last_event_at)
        ) AS u
        FROM win w
        LEFT JOIN auth.users au ON au.id = w.user_id
        GROUP BY w.user_id, au.email
        ORDER BY sum(w.duration_seconds) DESC
        LIMIT 20
      ) t
    ), '[]'::jsonb),
    -- Stickiness: DAU/MAU. The industry definition of "do they come back".
    'stickiness', (
      SELECT jsonb_build_object(
        'dau', COALESCE((SELECT count(DISTINCT user_id) FROM public.app_sessions
                         WHERE started_at >= NOW() - INTERVAL '1 day'), 0),
        'mau', COALESCE((SELECT count(DISTINCT user_id) FROM public.app_sessions
                         WHERE started_at >= NOW() - INTERVAL '30 days'), 0)
      )
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_engagement_stats(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_engagement_stats(INT) TO service_role;
