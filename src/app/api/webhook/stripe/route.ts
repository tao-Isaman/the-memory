import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserReferral, markReferralDiscountUsed, recordReferralConversion } from '@/lib/referral';
import { addCredits } from '@/lib/credits';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          if (session.metadata?.type === 'credits') {
            await handleCreditPurchase(supabase, session);
          } else {
            await activateMemory(supabase, session);
          }
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'credits') {
          await handleCreditPurchase(supabase, session);
        } else {
          await activateMemory(supabase, session);
        }
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await recordCheckoutFailure(supabase, event.id, session, 'async_payment_failed');
        if (session.metadata?.type === 'credits') {
          console.log('Credit purchase async payment failed for session:', session.id);
        } else {
          const memoryId = session.metadata?.memory_id;
          if (memoryId) {
            await supabase
              .from('memories')
              .update({ status: 'failed' })
              .eq('id', memoryId);
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        // Unpaid session timed out (e.g. PromptPay QR never scanned). Record only —
        // the memory stays 'pending' so the user can still pay from the dashboard.
        const session = event.data.object as Stripe.Checkout.Session;
        await recordCheckoutFailure(supabase, event.id, session, 'expired');
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await activateMemoryByPaymentIntent(supabase, paymentIntent.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function activateMemory(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  session: Stripe.Checkout.Session
) {
  const memoryId = session.metadata?.memory_id;
  const userId = session.metadata?.user_id;
  const hasReferralDiscount = session.metadata?.has_referral_discount === 'true';
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  if (!memoryId) {
    console.error('No memory_id in session metadata');
    return;
  }

  const { error } = await supabase
    .from('memories')
    .update({
      status: 'active',
      stripe_payment_intent_id: paymentIntentId || null,
      paid_at: new Date().toISOString(),
    })
    .eq('id', memoryId);

  if (error) {
    console.error('Error activating memory:', error);
    throw error;
  }

  console.log(`Memory ${memoryId} activated via webhook`);

  // Handle referral payment if user used a referral discount
  if (userId && hasReferralDiscount) {
    await handleReferralPayment(supabase, userId, memoryId);
  }
}

async function activateMemoryByPaymentIntent(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  paymentIntentId: string
) {
  // First check if we already have an active memory with this payment intent (already processed)
  const { data: existingMemory } = await supabase
    .from('memories')
    .select('id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (existingMemory?.status === 'active') {
    console.log(`Memory ${existingMemory.id} already active for payment intent ${paymentIntentId}`);
    return;
  }

  // Look up the checkout session from Stripe to get memory_id from metadata
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  const session = sessions.data[0];
  if (!session) {
    console.error(`No checkout session found for payment intent ${paymentIntentId}`);
    return;
  }

  const memoryId = session.metadata?.memory_id;
  if (!memoryId) {
    console.error(`No memory_id in checkout session metadata for payment intent ${paymentIntentId}`);
    return;
  }

  // Check current memory status
  const { data: memory } = await supabase
    .from('memories')
    .select('id, status')
    .eq('id', memoryId)
    .single();

  if (!memory) {
    console.error(`Memory ${memoryId} not found`);
    return;
  }

  if (memory.status === 'active') {
    console.log(`Memory ${memoryId} already active, skipping`);
    return;
  }

  // Activate the memory
  const { error } = await supabase
    .from('memories')
    .update({
      status: 'active',
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', memoryId);

  if (error) {
    console.error('Error activating memory via payment_intent.succeeded:', error);
    throw error;
  }

  console.log(`Memory ${memoryId} activated via payment_intent.succeeded webhook`);

  // Handle referral if applicable
  const userId = session.metadata?.user_id;
  const hasReferralDiscount = session.metadata?.has_referral_discount === 'true';
  if (userId && hasReferralDiscount) {
    await handleReferralPayment(supabase, userId, memoryId);
  }
}

async function handleCreditPurchase(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  session: Stripe.Checkout.Session
) {
  const packageId = session.metadata?.package_id;
  const creditsStr = session.metadata?.credits;
  const userId = session.metadata?.user_id;

  if (!packageId || !creditsStr || !userId) {
    console.error('Missing credits metadata in session');
    return;
  }

  const credits = parseInt(creditsStr, 10);
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  const result = await addCredits(
    supabase, userId, credits, packageId,
    session.id, paymentIntentId || null
  );

  if (!result.success) {
    console.error(`Failed to add credits for session ${session.id}`);
    return;
  }

  console.log(`Credits added via webhook: ${credits} credits for user ${userId}`);

  // Handle referral
  const hasReferralDiscount = session.metadata?.has_referral_discount === 'true';
  if (hasReferralDiscount) {
    await handleReferralPayment(supabase, userId, 'credits_purchase');
  }
}

async function handleReferralPayment(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string,
  memoryId: string
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

    // Record the conversion (this increments referrer's paid_referral_count and pending_discount_claims)
    await recordReferralConversion(supabase, referral.referredBy, userId, memoryId);

    console.log(`Referral conversion recorded via webhook: referrer=${referral.referredBy}, referred=${userId}, memory=${memoryId}`);
  } catch (error) {
    console.error('Error handling referral payment:', error);
  }
}

/**
 * Insert-only analytics record for a checkout that ended without payment.
 * Never throws: a tracking problem (e.g. migration 034 not applied yet) must not make
 * Stripe retry the webhook or block the payment-state handling around it.
 */
async function recordCheckoutFailure(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  eventId: string,
  session: Stripe.Checkout.Session,
  outcome: 'async_payment_failed' | 'expired'
) {
  try {
    let paymentMethod: string | null = null;
    let failureCode: string | null = null;
    let failureMessage: string | null = null;

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    if (paymentIntentId) {
      // Read-only lookup for the decline/failure reason.
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      const err = pi.last_payment_error;
      paymentMethod = err?.payment_method?.type ?? pi.payment_method_types?.[0] ?? null;
      failureCode = err?.decline_code ?? err?.code ?? null;
      failureMessage = err?.message ?? null;
    }

    const { error } = await supabase.from('checkout_failures').upsert(
      {
        stripe_event_id: eventId,
        checkout_session_id: session.id,
        outcome,
        purchase_type: session.metadata?.type === 'credits' ? 'credits' : 'memory',
        memory_id: session.metadata?.memory_id || null,
        user_id: session.metadata?.user_id || null,
        payment_method: paymentMethod,
        failure_code: failureCode,
        failure_message: failureMessage,
        amount_total: session.amount_total,
        currency: session.currency,
        locale: session.locale ?? null,
        session_created_at: new Date(session.created * 1000).toISOString(),
      },
      { onConflict: 'stripe_event_id', ignoreDuplicates: true }
    );
    if (error) console.error('recordCheckoutFailure insert failed:', error.message);
  } catch (err) {
    console.error('recordCheckoutFailure error:', err);
  }
}
