-- Server-side record of checkout sessions that did NOT end in a payment.
--
-- GA's old client event `payment_fail` actually fired on the cancel page (user backed out
-- of Stripe Checkout), so it never measured real failures. This table is written by the
-- Stripe webhook only:
--   - checkout.session.async_payment_failed → outcome 'async_payment_failed'
--     (e.g. PromptPay confirmed as failed; failure_code/message from the PaymentIntent)
--   - checkout.session.expired               → outcome 'expired'
--     (session timed out unpaid, e.g. PromptPay QR never scanned / tab abandoned)
--
-- One row per Stripe event (stripe_event_id unique) so webhook retries are idempotent.
-- Insert-only; nothing here touches memories / credits / payment data.
CREATE TABLE IF NOT EXISTS public.checkout_failures (
  id BIGSERIAL PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  checkout_session_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('async_payment_failed', 'expired')),
  purchase_type TEXT NOT NULL DEFAULT 'memory',   -- 'memory' | 'credits'
  memory_id UUID,
  user_id UUID,
  payment_method TEXT,          -- e.g. 'promptpay', 'card' (null if never chosen)
  failure_code TEXT,            -- e.g. 'card_declined', 'payment_intent_payment_attempt_expired'
  failure_message TEXT,
  amount_total INTEGER,         -- smallest currency unit (satang)
  currency TEXT,
  locale TEXT,
  session_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_failures_created_at ON public.checkout_failures(created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_failures_outcome ON public.checkout_failures(outcome, created_at);

-- Service-role only (written by /api/webhook/stripe). No client policies.
ALTER TABLE public.checkout_failures ENABLE ROW LEVEL SECURITY;
