import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import {
  getUserReferral,
  markReferralDiscountUsed,
  recordReferralConversion,
} from '@/lib/referral';

// Safety net for async (PromptPay) payments that paid on Stripe's side but never
// got activated here — e.g. the success page never ran (Safari discarded the tab)
// AND the async_payment_succeeded webhook was missed. Finds pending memories that
// reached checkout, asks Stripe if they actually paid, and activates the ones that did.
// Runnable as a Vercel Cron or on-demand: GET with Bearer CRON_SECRET, optional ?days= & ?limit=.

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Secret-only: this endpoint mutates payment status + triggers referral payouts,
  // so unlike update-stats it must NOT accept the spoofable x-vercel-cron header.
  // Vercel auto-sends `Authorization: Bearer $CRON_SECRET` to cron requests.
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '14', 10) || 14, 365);
  const limit = Math.min(parseInt(searchParams.get('limit') || '300', 10) || 300, 3000);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseServiceClient();

  const { data: stuck, error } = await supabase
    .from('memories')
    .select('id, user_id, stripe_checkout_session_id')
    .eq('status', 'pending')
    .not('stripe_checkout_session_id', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('reconcile-payments query error:', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  let checked = 0;
  let activated = 0;
  const activatedIds: string[] = [];
  const errors: string[] = [];

  for (const m of stuck || []) {
    checked++;
    try {
      const session = await stripe.checkout.sessions.retrieve(
        m.stripe_checkout_session_id as string,
      );
      if (session.payment_status !== 'paid') continue;

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      // Guarded update: only flips a row still pending, so referral side effects run once.
      const { data: updated, error: updErr } = await supabase
        .from('memories')
        .update({
          status: 'active',
          stripe_payment_intent_id: paymentIntentId || null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', m.id)
        .eq('status', 'pending')
        .select('id');

      if (updErr) {
        errors.push(`${m.id}: ${updErr.message}`);
        continue;
      }
      if (!updated || updated.length === 0) continue; // raced — already active

      activated++;
      activatedIds.push(m.id);

      if (session.metadata?.has_referral_discount === 'true' && m.user_id) {
        try {
          const referral = await getUserReferral(supabase, m.user_id);
          if (referral?.referredBy && !referral.hasUsedReferralDiscount) {
            await markReferralDiscountUsed(supabase, m.user_id);
            await recordReferralConversion(supabase, referral.referredBy, m.user_id, m.id);
          }
        } catch (refErr) {
          console.error(`reconcile referral error for ${m.id}:`, refErr);
        }
      }
    } catch (e) {
      errors.push(`${m.id}: ${e instanceof Error ? e.message : 'stripe error'}`);
    }
  }

  console.log(
    `reconcile-payments: checked=${checked} activated=${activated} errors=${errors.length}`,
  );
  return NextResponse.json({
    success: true,
    window_days: days,
    checked,
    activated,
    activatedIds,
    errors: errors.slice(0, 50),
  });
}
