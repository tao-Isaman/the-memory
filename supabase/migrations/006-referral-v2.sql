-- Migration: Referral System V2
-- Changes: Remove free memory, add conversion tracking and discount claims

-- Update user_referrals table
ALTER TABLE public.user_referrals
  DROP COLUMN IF EXISTS free_memory_used;

ALTER TABLE public.user_referrals
  ADD COLUMN IF NOT EXISTS paid_referral_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_discount_claims INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_discounts_claimed INTEGER DEFAULT 0;

-- Create referral_conversions table to track when referred users pay
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  discount_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  UNIQUE(referred_id) -- Each user can only convert once (first payment)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referred ON public.referral_conversions(referred_id);

-- Enable RLS on referral_conversions
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_conversions (drop first if exists)
DROP POLICY IF EXISTS "Users can view their own conversions as referrer" ON public.referral_conversions;
DROP POLICY IF EXISTS "Service role can manage conversions" ON public.referral_conversions;

CREATE POLICY "Users can view their own conversions as referrer"
  ON public.referral_conversions
  FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Service role can manage conversions"
  ON public.referral_conversions
  FOR ALL
  USING (true)
  WITH CHECK (true);
