-- 038: transfer slips on referral payouts. NOT applied yet — needs the owner's approval (production).
-- Apply after 037-security-drop-broad-rls. Rollback: supabase/rollback/038-referral-claim-slips.down.sql
-- slip_url: the Vercel Blob URL of the transfer slip (public store, unguessable name). The browser never gets it:
-- customers and admins see the image through /api/referral/claims/<id>/slip, which checks who is asking.
ALTER TABLE public.referral_claims ADD COLUMN IF NOT EXISTS slip_url TEXT;
COMMENT ON COLUMN public.referral_claims.slip_url IS 'Transfer slip (Blob URL); served only via /api/referral/claims/<id>/slip';
