-- Free credit grants (profile-completion bonus, push-notification bonus) were being
-- written as type='purchase' with no package_id/session. 2,512 of 2,550 "purchase"
-- rows were actually free grants. Two consequences:
--   1. referral.hasUserPaidBefore counts any type='purchase' row, so every user who
--      claimed free credits was treated as "already paid" and silently lost their
--      50 THB first-payment referral discount.
--   2. The admin credits dashboard drowned real sales in bonus rows.
-- Give free grants their own type so 'purchase' means "actually paid us money".

-- 1. Allow the new type.
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS valid_transaction_type;
ALTER TABLE public.credit_transactions
  ADD CONSTRAINT valid_transaction_type
  CHECK (type = ANY (ARRAY['purchase'::text, 'use'::text, 'refund'::text, 'bonus'::text]));

-- 2. Backfill: a real purchase always carries a package_id AND a Stripe session.
--    Anything labelled 'purchase' without both is a free grant.
UPDATE public.credit_transactions
SET type = 'bonus'
WHERE type = 'purchase'
  AND package_id IS NULL
  AND stripe_checkout_session_id IS NULL;

-- 3. Exact credit stats for the admin dashboard.
--    The route used to fetch every transaction with an unbounded .select() and reduce
--    in JS — PostgREST silently truncates that (default 1000 rows of 2830, unordered),
--    so package sales and revenue were wrong. Aggregate in SQL instead.
CREATE OR REPLACE FUNCTION public.get_credit_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'packageSales', COALESCE((
      SELECT jsonb_object_agg(p.package_id::text, p.cnt)
      FROM (
        SELECT package_id, count(*) AS cnt
        FROM public.credit_transactions
        WHERE type = 'purchase' AND package_id IS NOT NULL
        GROUP BY package_id
      ) p
    ), '{}'::jsonb),
    'totalCreditsSold', COALESCE((
      SELECT sum(amount) FROM public.credit_transactions WHERE type = 'purchase'
    ), 0),
    'totalCreditsUsed', COALESCE((
      SELECT sum(abs(amount)) FROM public.credit_transactions WHERE type = 'use'
    ), 0),
    'totalCreditsRefunded', COALESCE((
      SELECT sum(abs(amount)) FROM public.credit_transactions WHERE type = 'refund'
    ), 0),
    'totalCreditsBonus', COALESCE((
      SELECT sum(amount) FROM public.credit_transactions WHERE type = 'bonus'
    ), 0)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_credit_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_credit_stats() TO service_role;
