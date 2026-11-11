-- 035: stats RPCs and the engagement view are for the admin API only.
--
-- get_credit_stats, get_engagement_stats, get_insights and get_user_count are
-- SECURITY DEFINER and were executable by anon and authenticated through
-- /rest/v1/rpc/*, so anyone holding the public anon key could read revenue,
-- sales and the e-mail addresses of the most active users. Every caller in
-- the app uses the service-role client (api/admin/*, api/stats,
-- api/cron/update-stats), which keeps EXECUTE.
--
-- daily_app_engagement (aggregate time-in-app per day) was likewise readable
-- and writable-by-grant for anon/authenticated; only get_engagement_stats
-- reads it, as its owner.
--
-- Rollback: supabase/rollback/035-revoke-public-stats-rpcs.down.sql

begin;

revoke execute on function public.get_credit_stats()            from public, anon, authenticated;
revoke execute on function public.get_engagement_stats(integer) from public, anon, authenticated;
revoke execute on function public.get_insights(integer)         from public, anon, authenticated;
revoke execute on function public.get_user_count()              from public, anon, authenticated;

grant execute on function public.get_credit_stats()            to service_role;
grant execute on function public.get_engagement_stats(integer) to service_role;
grant execute on function public.get_insights(integer)         to service_role;
grant execute on function public.get_user_count()              to service_role;

revoke all on public.daily_app_engagement from anon, authenticated;

commit;
