import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { memoryId, memoryTitle, userId } = await request.json();

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

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&memory_id=${memoryId}`,
      cancel_url: `${appUrl}/payment/cancel?memory_id=${memoryId}`,
      metadata: {
        memory_id: memoryId,
        user_id: userId,
        memory_title: memoryTitle || 'Memory',
      },
    });

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
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
