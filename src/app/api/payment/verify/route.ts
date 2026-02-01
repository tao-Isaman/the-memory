import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

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

    if (!memoryId) {
      return NextResponse.json(
        { error: 'No memory_id in session' },
        { status: 400 }
      );
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      // For async payments like PromptPay, might still be pending
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
