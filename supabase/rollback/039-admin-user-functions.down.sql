-- Undoes 039: drops the two admin functions. Deploy the app version from before 039 first (it pages the Auth API
-- instead), or /admin and /admin/users will fail.
begin;
drop function if exists public.admin_users_overview();
drop function if exists public.admin_user_growth(integer);
commit;
