-- 037: security — drop RLS policies that opened four tables to anon/authenticated (checked on prod 2026-11-19).
-- Every read/write of these tables in the app goes through API routes with the service role, which bypasses RLS;
-- no browser code queries them. Rollback: supabase/rollback/037-security-drop-broad-rls.down.sql
begin;

-- "… FOR ALL USING (true) WITH CHECK (true)" with no TO clause = every role, anon included. Named "service role",
-- but the service role never needed them. With the public anon key anyone could read and change:
--   referral_claims       names, phone and bank account numbers of payouts; amounts/status
--   cartoon_generations   every user's photo and cartoon URLs
--   referral_conversions  who referred whom and the discount flags
DROP POLICY IF EXISTS "Service role full access" ON public.referral_claims;
DROP POLICY IF EXISTS "Service role can manage cartoon generations" ON public.cartoon_generations;
DROP POLICY IF EXISTS "Service role can manage conversions" ON public.referral_conversions;

-- A signed-in user could insert a payout claim of any amount straight through the REST API, skipping
-- /api/referral/claim-discount and its checks.
DROP POLICY IF EXISTS "Users can create own claims" ON public.referral_claims;

-- user_referrals:
--   SELECT USING (true): every row to anyone — user ids, codes, who referred whom, counts, discount flags.
--     Codes are checked server-side (/api/referral/validate, link-code), so nobody needs it; users keep their own row.
--   UPDATE own row with no column limit: set has_used_referral_discount = false to get the first-payment discount
--     again, or rewrite referred_by / counts. INSERT own row: create it with any referred_by / counts.
--     Rows are created and changed only by the API (service role).
DROP POLICY IF EXISTS "Anyone can lookup referral codes" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can update own referral" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can insert own referral" ON public.user_referrals;
CREATE POLICY "Users can view own referral" ON public.user_referrals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Kept (own rows only, read-only): "Users can view own claims", "Users can view own cartoon generations",
-- "Users can view their own conversions as referrer".

commit;
