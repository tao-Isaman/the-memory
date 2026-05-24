-- One-time credit reward for enabling push notifications.
-- The flag lives on user_credits (always present after ensureUserCreditsRow), so the
-- reward works even for users who never created a user_profiles row.
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS push_credits_claimed BOOLEAN NOT NULL DEFAULT FALSE;
