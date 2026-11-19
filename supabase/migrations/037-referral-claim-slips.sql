-- 037: transfer slips on referral payouts + tighter RLS on referral_claims.
-- NOT applied yet — needs the owner's approval (production). Rollback at the bottom.
--
-- 1) slip_url: the Vercel Blob URL of the transfer slip (public store, unguessable name). The browser never gets it:
--    customers and admins see the image through /api/referral/claims/<id>/slip, which checks who is asking.
ALTER TABLE public.referral_claims ADD COLUMN IF NOT EXISTS slip_url TEXT;
COMMENT ON COLUMN public.referral_claims.slip_url IS 'Transfer slip (Blob URL); served only via /api/referral/claims/<id>/slip';

-- 2) RLS. Migration 007 created "Service role full access" FOR ALL USING (true) WITH CHECK (true) with no TO clause,
--    so it applies to anon and authenticated too: with the public anon key anyone could read every claim (names,
--    phone and bank account numbers) and update them. The service role bypasses RLS anyway, so the policy only
--    ever widened access. "Users can create own claims" let a signed-in user insert a claim of any amount straight
--    through the REST API, skipping /api/referral/claim-discount; all inserts go through that route (service role).
--    Users keep reading their own claims.
DROP POLICY IF EXISTS "Service role full access" ON public.referral_claims;
DROP POLICY IF EXISTS "Users can create own claims" ON public.referral_claims;

-- Rollback:
--   CREATE POLICY "Users can create own claims" ON public.referral_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
--   CREATE POLICY "Service role full access" ON public.referral_claims FOR ALL USING (true) WITH CHECK (true);
--   ALTER TABLE public.referral_claims DROP COLUMN IF EXISTS slip_url;
