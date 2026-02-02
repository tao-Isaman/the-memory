-- Migration: Change referral system - discount goes to NEW user, not referrer
-- New user who applies a code gets 50 THB discount on first memory payment

-- Add column to track if new user has used their referral discount
ALTER TABLE public.user_referrals
  ADD COLUMN IF NOT EXISTS has_used_referral_discount BOOLEAN DEFAULT FALSE;

-- Add index for quick lookup during checkout
CREATE INDEX IF NOT EXISTS idx_user_referrals_discount_status
  ON public.user_referrals(user_id, has_used_referral_discount)
  WHERE referred_by IS NOT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.user_referrals.has_used_referral_discount IS
  'True if the user has already used their 50 THB referral discount on first payment';
