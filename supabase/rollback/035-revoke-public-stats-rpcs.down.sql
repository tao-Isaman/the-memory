-- Undoes 035: restores the grants exactly as they were before it (2026-11-11),
-- i.e. anon and authenticated may execute the stats RPCs and have full
-- privileges on daily_app_engagement again. Only run this if 035 broke
-- something; it re-opens the exposure 035 closed.
begin;

grant execute on function public.get_credit_stats()            to anon, authenticated;
grant execute on function public.get_engagement_stats(integer) to anon, authenticated;
grant execute on function public.get_insights(integer)         to anon, authenticated;
grant execute on function public.get_user_count()              to anon, authenticated;

grant all on public.daily_app_engagement to anon, authenticated;

commit;
