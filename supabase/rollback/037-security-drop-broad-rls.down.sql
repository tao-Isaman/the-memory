-- Undoes 037-security-drop-broad-rls: restores the policies exactly as they were on prod on 2026-11-19.
-- Re-opens everything 037 closed; only for when 037 broke something.
begin;

DROP POLICY IF EXISTS "Users can view own referral" ON public.user_referrals;
CREATE POLICY "Anyone can lookup referral codes" ON public.user_referrals FOR SELECT USING (true);
CREATE POLICY "Users can update own referral" ON public.user_referrals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referral" ON public.user_referrals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create own claims" ON public.referral_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON public.referral_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage cartoon generations" ON public.cartoon_generations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage conversions" ON public.referral_conversions FOR ALL USING (true) WITH CHECK (true);

commit;
