import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getPackageById } from '@/lib/credits';
import { isEligibleForReferralDiscount } from '@/lib/referral';
import Stripe from 'stripe';

const REFERRAL_COUPON_ID = 'REFERRAL_50_THB';
const DISCOUNT_AMOUNT = 5000; // 50 THB in satang

async function ensureReferralCouponExists(): Promise<string | null> {
  try {
    await stripe.coupons.retrieve(REFERRAL_COUPON_ID);
    return REFERRAL_COUPON_ID;
  } catch {
    try {
      await stripe.coupons.create({
        id: REFERRAL_COUPON_ID,
        amount_off: DISCOUNT_AMOUNT,
        currency: 'thb',
        name: 'ส่วนลดจากโค้ดแนะนำ 50 บาท',
        duration: 'once',
      });
      return REFERRAL_COUPON_ID;
    } catch (createError) {
      console.error('Failed to create referral coupon:', createError);
      return null;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { packageId, userId } = await request.json();

    if (!packageId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Validate package
    const pkg = await getPackageById(supabase, packageId);
    if (!pkg || !pkg.isActive) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Check referral discount eligibility
    const { eligible: hasReferralDiscount, discountAmount } =
      await isEligibleForReferralDiscount(supabase, userId);

    // Create Stripe checkout session with inline price_data
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card', 'promptpay'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} เครดิตสำหรับเปิดใช้งานความทรงจำ`,
            },
            unit_amount: pkg.priceSatang,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=credits`,
      cancel_url: `${appUrl}/credits?cancelled=true`,
      metadata: {
        type: 'credits',
        package_id: packageId,
        user_id: userId,
        credits: pkg.credits.toString(),
        has_referral_discount: hasReferralDiscount ? 'true' : 'false',
        discount_amount: hasReferralDiscount ? discountAmount.toString() : '0',
      },
    };

    // Apply referral discount if eligible
    if (hasReferralDiscount) {
      const couponId = await ensureReferralCouponExists();
      if (couponId) {
        sessionOptions.discounts = [{ coupon: couponId }];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      hasDiscount: hasReferralDiscount,
      discountAmount: hasReferralDiscount ? discountAmount : 0,
    });
  } catch (error) {
    console.error('Credit checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
