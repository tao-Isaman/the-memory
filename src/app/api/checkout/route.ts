import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { isEligibleForReferralDiscount } from '@/lib/referral';
import {
  normalizeLocale,
  paymentMethodsFor,
  stripeLocaleFor,
  localizedUrl,
  ensureReferralCoupon,
} from '@/lib/checkout-locale';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const { memoryId, memoryTitle, userId, locale: rawLocale } = await request.json();
    const locale = normalizeLocale(rawLocale);

    if (!memoryId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify memory exists and belongs to user
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .select('id, user_id, status')
      .eq('id', memoryId)
      .eq('user_id', userId)
      .single();

    if (memoryError || !memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    if (memory.status === 'active') {
      return NextResponse.json(
        { error: 'Memory is already paid' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price not configured' },
        { status: 500 }
      );
    }

    // Check if user is eligible for referral discount
    const { eligible: hasReferralDiscount, discountAmount } =
      await isEligibleForReferralDiscount(supabase, userId);

    // Prepare checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      // PromptPay is Thailand-only — non-Thai customers get card only.
      payment_method_types: paymentMethodsFor(locale),
      locale: stripeLocaleFor(locale),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: localizedUrl(
        appUrl,
        locale,
        `/payment/success?session_id={CHECKOUT_SESSION_ID}&memory_id=${memoryId}`,
      ),
      cancel_url: localizedUrl(appUrl, locale, `/payment/cancel?memory_id=${memoryId}`),
      metadata: {
        memory_id: memoryId,
        user_id: userId,
        memory_title: memoryTitle || 'Memory',
        has_referral_discount: hasReferralDiscount ? 'true' : 'false',
        discount_amount: hasReferralDiscount ? discountAmount.toString() : '0',
      },
    };

    // Apply referral discount if eligible
    if (hasReferralDiscount) {
      // Per-locale coupon: its name is the discount line on Stripe's checkout page.
      const couponId = await ensureReferralCoupon(locale);
      if (couponId) {
        sessionOptions.discounts = [{ coupon: couponId }];
      }
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

    // Store checkout session ID in memory record
    const { error: updateError } = await supabase
      .from('memories')
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq('id', memoryId);

    if (updateError) {
      console.error('Error updating memory with session ID:', updateError);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      hasDiscount: hasReferralDiscount,
      discountAmount: hasReferralDiscount ? discountAmount : 0,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
