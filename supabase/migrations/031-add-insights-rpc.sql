-- Admin "Insights": what drives payment, plus the signup->create->pay funnel,
-- recipient engagement, and a revenue trend. One RPC, aggregated in SQL (never
-- fetch-all-and-reduce-in-JS — PostgREST caps unbounded selects at ~1000 rows).
--
-- Windowing: drivers/funnel/recipient use memory/user created_at; revenue uses paid_at
-- (money is counted when it arrives). Recent signups haven't had time to convert, so a
-- short window understates the funnel — read 90d+ for driver signal.
--
-- Memory revenue is an ESTIMATE (paid_count * 99): the per-memory charged amount isn't
-- stored, so referral-discounted payments (฿49) are counted at ฿99. Credit revenue is exact.
CREATE OR REPLACE FUNCTION public.get_insights(p_days INT DEFAULT 90)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH win AS (
    SELECT m.id, m.user_id, m.theme, (m.status = 'active') AS paid,
           (SELECT count(*) FROM public.stories s WHERE s.memory_id = m.id) AS story_count
    FROM public.memories m
    WHERE m.created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 90), 1))
  )
  SELECT jsonb_build_object(
    -- Signup -> created -> paid, as a signup cohort (monotonic by construction).
    'funnel', (
      SELECT jsonb_build_object(
        'signedUp', count(*),
        'created',  count(*) FILTER (WHERE has_mem),
        'paid',     count(*) FILTER (WHERE has_paid)
      ) FROM (
        SELECT u.id,
          EXISTS(SELECT 1 FROM public.memories m WHERE m.user_id = u.id) AS has_mem,
          EXISTS(SELECT 1 FROM public.memories m WHERE m.user_id = u.id AND m.status = 'active') AS has_paid
        FROM auth.users u
        WHERE u.created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 90), 1))
      ) t
    ),

    'overallPayRate', (
      SELECT COALESCE(round(100.0 * count(*) FILTER (WHERE paid) / NULLIF(count(*), 0), 1), 0) FROM win
    ),

    -- More stories -> dramatically higher pay rate (the strongest lever).
    'byStoryCount', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('bucket', b, 'memories', n, 'paid', p,
               'payRate', round(100.0 * p / NULLIF(n, 0), 1)) ORDER BY ord)
      FROM (
        SELECT CASE WHEN story_count <= 1 THEN '1' WHEN story_count <= 3 THEN '2-3'
                    WHEN story_count <= 6 THEN '4-6' ELSE '7+' END AS b,
               MIN(story_count) AS ord, count(*) AS n, count(*) FILTER (WHERE paid) AS p
        FROM win GROUP BY 1
      ) x
    ), '[]'::jsonb),

    -- Pay rate for memories CONTAINING each story type.
    'byStoryType', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('type', ty, 'memories', n, 'paid', p,
               'payRate', round(100.0 * p / NULLIF(n, 0), 1))
             ORDER BY round(100.0 * p / NULLIF(n, 0), 1) DESC)
      FROM (
        SELECT s.type AS ty, count(DISTINCT w.id) AS n, count(DISTINCT w.id) FILTER (WHERE w.paid) AS p
        FROM win w JOIN public.stories s ON s.memory_id = w.id GROUP BY s.type
      ) x
    ), '[]'::jsonb),

    'byTheme', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('theme', theme, 'memories', n, 'paid', p,
               'payRate', round(100.0 * p / NULLIF(n, 0), 1))
             ORDER BY round(100.0 * p / NULLIF(n, 0), 1) DESC)
      FROM (
        SELECT theme, count(*) AS n, count(*) FILTER (WHERE paid) AS p FROM win GROUP BY theme
      ) x
    ), '[]'::jsonb),

    -- User-attribute drivers: referred users, and profile-complete users, each vs the rest.
    'byReferred', (
      SELECT jsonb_build_object(
        'referred', jsonb_build_object('memories', count(*) FILTER (WHERE ref),
          'paid', count(*) FILTER (WHERE ref AND paid),
          'payRate', COALESCE(round(100.0 * count(*) FILTER (WHERE ref AND paid) / NULLIF(count(*) FILTER (WHERE ref), 0), 1), 0)),
        'organic', jsonb_build_object('memories', count(*) FILTER (WHERE NOT ref),
          'paid', count(*) FILTER (WHERE NOT ref AND paid),
          'payRate', COALESCE(round(100.0 * count(*) FILTER (WHERE NOT ref AND paid) / NULLIF(count(*) FILTER (WHERE NOT ref), 0), 1), 0))
      )
      FROM (
        SELECT w.paid,
          EXISTS(SELECT 1 FROM public.user_referrals r WHERE r.user_id = w.user_id AND r.referred_by IS NOT NULL) AS ref
        FROM win w
      ) t
    ),

    'byProfileComplete', (
      SELECT jsonb_build_object(
        'complete', jsonb_build_object('memories', count(*) FILTER (WHERE done),
          'paid', count(*) FILTER (WHERE done AND paid),
          'payRate', COALESCE(round(100.0 * count(*) FILTER (WHERE done AND paid) / NULLIF(count(*) FILTER (WHERE done), 0), 1), 0)),
        'incomplete', jsonb_build_object('memories', count(*) FILTER (WHERE NOT done),
          'paid', count(*) FILTER (WHERE NOT done AND paid),
          'payRate', COALESCE(round(100.0 * count(*) FILTER (WHERE NOT done AND paid) / NULLIF(count(*) FILTER (WHERE NOT done), 0), 1), 0))
      )
      FROM (
        SELECT w.paid,
          EXISTS(SELECT 1 FROM public.user_profiles p WHERE p.user_id = w.user_id
                 AND p.phone IS NOT NULL AND p.birthday IS NOT NULL AND p.gender IS NOT NULL
                 AND p.job IS NOT NULL AND p.relationship_status IS NOT NULL AND p.occasion_type IS NOT NULL) AS done
        FROM win w
      ) t
    ),

    -- Recipient experience: completion, dwell, and the per-story drop-off curve.
    'recipient', (
      SELECT jsonb_build_object(
        'sessions', count(*),
        'avgDwellSecs', COALESCE(round(avg(duration_seconds)), 0),
        'completionPct', COALESCE(round(100.0 * count(*) FILTER (WHERE completed) / NULLIF(count(*), 0), 1), 0),
        'dropoff', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('story', k,
                   'reached', (SELECT count(*) FROM public.memory_views v
                               WHERE NOT v.is_owner
                                 AND v.created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days,90),1))
                                 AND v.max_story_reached >= k)) ORDER BY k)
          FROM generate_series(0, 9) k
        ), '[]'::jsonb)
      )
      FROM public.memory_views
      WHERE NOT is_owner AND created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 90), 1))
    ),

    -- Revenue (memory estimate + exact credit revenue) and a daily paid-memory trend.
    'revenue', (
      SELECT jsonb_build_object(
        'paidMemories', COALESCE(mem.cnt, 0),
        'memoryRevenueThbEst', COALESCE(mem.cnt, 0) * 99,
        'creditRevenueThb', COALESCE(cr.thb, 0),
        'payingUsers', COALESCE(mem.users, 0),
        'daily', COALESCE(mem.daily, '[]'::jsonb)
      )
      FROM
        (SELECT count(*) AS cnt, count(DISTINCT user_id) AS users,
           (SELECT jsonb_agg(jsonb_build_object('day', d, 'paidMemories', c, 'revenueThbEst', c * 99) ORDER BY d)
            FROM (SELECT (paid_at AT TIME ZONE 'Asia/Bangkok')::date AS d, count(*) AS c
                  FROM public.memories
                  WHERE status = 'active' AND paid_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 90), 1))
                  GROUP BY 1) dd) AS daily
         FROM public.memories
         WHERE status = 'active' AND paid_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 90), 1))) mem,
        (SELECT COALESCE(sum(cp.price_thb), 0) AS thb
         FROM public.credit_transactions ct JOIN public.credit_packages cp ON cp.id = ct.package_id
         WHERE ct.type = 'purchase' AND ct.created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 90), 1))) cr
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_insights(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_insights(INT) TO service_role;
