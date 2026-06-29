-- Exact user count for stats. supabase.auth.admin.listUsers({ perPage }) only
-- returns one capped page, so the home-page user count froze at 10000 once the
-- real user count passed it. This SECURITY DEFINER function counts auth.users
-- directly (O(1)) and is locked to the service role used by the stats routes.
create or replace function public.get_user_count()
returns bigint
language sql
security definer
set search_path = ''
as $$
  select count(*) from auth.users;
$$;

revoke execute on function public.get_user_count() from public;
grant execute on function public.get_user_count() to service_role;
