import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserReferral, recordReferralConversion, hasUserPaidBefore } from '@/lib/referral';
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

        // For card payments, payment is complete immediately
        if (session.payment_status === 'paid') {
          await activateMemory(supabase, session);
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        // For PromptPay and other async payment methods
        const session = event.data.object as Stripe.Checkout.Session;
        await activateMemory(supabase, session);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const memoryId = session.metadata?.memory_id;

        if (memoryId) {
          const { error } = await supabase
            .from('memories')
            .update({
              status: 'failed',
            })
            .eq('id', memoryId);

          if (error) {
            console.error('Error updating memory status to failed:', error);
          }
        }
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

  console.log(`Memory ${memoryId} activated successfully`);

  // Track referral conversion if this is user's first payment
  if (userId) {
    await trackReferralConversion(supabase, userId, memoryId);
  }
}

async function trackReferralConversion(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string,
  memoryId: string
) {
  try {
    // Check if this is the user's first payment
    const hasPaidBefore = await hasUserPaidBefore(supabase, userId, memoryId);

    if (hasPaidBefore) {
      // Not first payment, skip conversion tracking
      return;
    }

    // Get user's referral record to check if they were referred
    const referral = await getUserReferral(supabase, userId);

    if (!referral || !referral.referredBy) {
      // User wasn't referred, skip
      return;
    }

    // Record the conversion - referrer gets credit
    const success = await recordReferralConversion(
      supabase,
      referral.referredBy,
      userId,
      memoryId
    );

    if (success) {
      console.log(`Referral conversion recorded: referrer=${referral.referredBy}, referred=${userId}`);
    }
  } catch (error) {
    // Don't fail the payment if referral tracking fails
    console.error('Error tracking referral conversion:', error);
  }
}
