-- Create referral_claims table for admin to process money transfers
CREATE TABLE IF NOT EXISTS public.referral_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 50, -- Amount in THB
  payment_method TEXT NOT NULL, -- 'promptpay' or 'bank_transfer'
  payment_info TEXT NOT NULL, -- Phone number for PromptPay or account number for bank
  bank_name TEXT, -- Bank name if bank_transfer
  account_name TEXT, -- Account holder name
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'rejected'
  admin_note TEXT, -- Note from admin after processing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'rejected')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('promptpay', 'bank_transfer'))
);

-- Index for admin to easily find pending claims
CREATE INDEX IF NOT EXISTS idx_referral_claims_status ON public.referral_claims(status);
CREATE INDEX IF NOT EXISTS idx_referral_claims_user_id ON public.referral_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_claims_created_at ON public.referral_claims(created_at DESC);

-- RLS policies
ALTER TABLE public.referral_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view own claims"
  ON public.referral_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own claims
CREATE POLICY "Users can create own claims"
  ON public.referral_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role full access"
  ON public.referral_claims FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for admin reference
COMMENT ON TABLE public.referral_claims IS 'Referral money claims - Admin should check this table for pending transfers';
COMMENT ON COLUMN public.referral_claims.status IS 'pending = waiting for admin, completed = money transferred, rejected = claim rejected';
COMMENT ON COLUMN public.referral_claims.payment_method IS 'promptpay = use phone number, bank_transfer = use bank account';
