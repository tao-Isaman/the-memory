-- Migration: Add referral system
-- Description: Create user_referrals table for tracking referral codes and relationships

-- Create user_referrals table
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(8) NOT NULL UNIQUE,
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  free_memory_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_referrals_user_id ON public.user_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_by ON public.user_referrals(referred_by);

-- Enable Row Level Security
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can lookup referral codes (for validation)
CREATE POLICY "Anyone can lookup referral codes"
  ON public.user_referrals
  FOR SELECT
  USING (true);

-- Users can update their own referral record
CREATE POLICY "Users can update own referral"
  ON public.user_referrals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own referral record
CREATE POLICY "Users can insert own referral"
  ON public.user_referrals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_referrals_updated_at
  BEFORE UPDATE ON public.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_referrals_updated_at();
