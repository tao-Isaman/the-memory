import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserReferral, markReferralDiscountUsed } from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const memoryId = session.metadata?.memory_id;
    const userId = session.metadata?.user_id;
    const hasReferralDiscount = session.metadata?.has_referral_discount === 'true';

    if (!memoryId) {
      return NextResponse.json(
        { error: 'No memory_id in session' },
        { status: 400 }
      );
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        memoryId,
        status: 'pending',
        message: 'Payment is still processing',
      });
    }

    // Payment is complete - update database
    const supabase = getSupabaseServiceClient();
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    const { error } = await supabase
      .from('memories')
      .update({
        status: 'active',
        stripe_payment_intent_id: paymentIntentId || null,
        paid_at: new Date().toISOString(),
      })
      .eq('id', memoryId);

    if (error) {
      console.error('Error updating memory:', error);
      return NextResponse.json(
        { error: 'Failed to update memory status' },
        { status: 500 }
      );
    }

    // If user paid with referral discount, update referrer's stats
    if (userId && hasReferralDiscount) {
      await handleReferralPayment(supabase, userId);
    }

    return NextResponse.json({
      memoryId,
      status: 'active',
      paidAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

async function handleReferralPayment(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string
) {
  try {
    // Get user's referral to find who referred them
    const referral = await getUserReferral(supabase, userId);

    if (!referral || !referral.referredBy || referral.hasUsedReferralDiscount) {
      // No referrer or already used discount
      return;
    }

    // Mark discount as used for this user
    await markReferralDiscountUsed(supabase, userId);

    // Increment referrer's paid_referral_count
    const referrerReferral = await getUserReferral(supabase, referral.referredBy);
    if (referrerReferral) {
      await supabase
        .from('user_referrals')
        .update({
          paid_referral_count: referrerReferral.paidReferralCount + 1,
        })
        .eq('user_id', referral.referredBy);

      console.log(`Referrer ${referral.referredBy} paid_referral_count increased to ${referrerReferral.paidReferralCount + 1}`);
    }
  } catch (error) {
    console.error('Error handling referral payment:', error);
  }
}
