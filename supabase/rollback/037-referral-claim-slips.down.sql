-- Undoes 037: puts back the two referral_claims policies from 007 and drops slip_url.
-- Re-opens what 037 closed (every claim readable/writable with the anon key; users inserting claims of any amount);
-- only for when 037 broke something. Slip images stay in Blob; their URLs are lost with the column.
begin;

CREATE POLICY "Users can create own claims" ON public.referral_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON public.referral_claims
  FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.referral_claims DROP COLUMN IF EXISTS slip_url;

commit;
