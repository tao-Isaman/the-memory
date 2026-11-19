-- 039: admin dashboard reads auth users in the database instead of paging the Auth API.
-- /api/admin/stats and /api/admin/users listed auth users through auth.admin.listUsers (one page at a time); with
-- 23,716 users that is either incomplete (one page) or too slow (every page: the route hit the 300 s timeout).
-- Measured on prod 2026-11-19 (EXPLAIN ANALYZE of these bodies): overview 262 ms for all users, growth 30 ms.
-- Both are SECURITY DEFINER (auth.users is not reachable otherwise) and executable by service_role only — new
-- functions in public are granted to anon/authenticated by default, so that grant is revoked explicitly (as in 035).
-- Rollback: supabase/rollback/039-admin-user-functions.down.sql

begin;

-- New sign-ups per day (Asia/Bangkok), the last p_days days including today; days with none are 0.
create or replace function public.admin_user_growth(p_days integer default 30)
returns table (day date, signups bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select (now() at time zone 'Asia/Bangkok')::date as today, least(greatest(coalesce(p_days, 30), 1), 366) as n
  ),
  days as (
    select generate_series(b.today - (b.n - 1), b.today, interval '1 day')::date as day from bounds b
  ),
  signups as (
    select (u.created_at at time zone 'Asia/Bangkok')::date as day, count(*) as n
    from auth.users u, bounds b
    where u.created_at >= ((b.today - (b.n - 1))::timestamp at time zone 'Asia/Bangkok')
    group by 1
  )
  select d.day, coalesce(s.n, 0)::bigint from days d left join signups s using (day) order by d.day;
$$;

-- One row per auth user with what the admin users page shows. The API filters, sorts and pages it through
-- PostgREST (?select&order&limit&offset with an exact count), so only the page on screen leaves the database.
create or replace function public.admin_users_overview()
returns table (
  id uuid,
  user_email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  referral_code text,
  referred_by uuid,
  memory_count bigint,
  paid_memory_count bigint,
  credit_balance integer,
  has_referral_code boolean,
  is_profile_complete boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    coalesce(u.email, 'No email')::text,
    u.created_at,
    u.last_sign_in_at,
    r.referral_code::text,
    r.referred_by,
    coalesce(m.total, 0)::bigint,
    coalesce(m.paid, 0)::bigint,
    coalesce(c.balance, 0)::integer,
    (r.user_id is not null),
    coalesce(p.profile_credits_claimed, false)
  from auth.users u
  left join public.user_referrals r on r.user_id = u.id
  left join (
    select user_id, count(*) as total, count(*) filter (where status = 'active') as paid
    from public.memories group by user_id
  ) m on m.user_id = u.id
  left join public.user_credits c on c.user_id = u.id
  left join public.user_profiles p on p.user_id = u.id;
$$;

revoke execute on function public.admin_user_growth(integer) from public, anon, authenticated;
revoke execute on function public.admin_users_overview()     from public, anon, authenticated;
grant execute on function public.admin_user_growth(integer) to service_role;
grant execute on function public.admin_users_overview()     to service_role;

commit;
