-- Undoes 038: drops slip_url. Slip images stay in Blob; their URLs are lost with the column.
ALTER TABLE public.referral_claims DROP COLUMN IF EXISTS slip_url;
