import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getPackageById } from '@/lib/credits';
import { isEligibleForReferralDiscount } from '@/lib/referral';
import {
  normalizeLocale,
  paymentMethodsFor,
  stripeLocaleFor,
  localizedUrl,
  ensureReferralCoupon,
} from '@/lib/checkout-locale';
import type { Locale } from '@/i18n/routing';
import Stripe from 'stripe';

// Shown on Stripe's hosted checkout page, so it can't come from the React tree.
const PACKAGE_DESCRIPTION: Record<Locale, (credits: number) => string> = {
  th: (c) => `${c} เครดิตสำหรับเปิดใช้งานความทรงจำ`,
  en: (c) => `${c} credits to activate your memories`,
  id: (c) => `${c} kredit untuk mengaktifkan kenangan Anda`,
};

export async function POST(request: NextRequest) {
  try {
    const { packageId, userId, locale: rawLocale } = await request.json();
    const locale = normalizeLocale(rawLocale);

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
      // PromptPay is Thailand-only — non-Thai customers get card only.
      payment_method_types: paymentMethodsFor(locale),
      locale: stripeLocaleFor(locale),
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: pkg.name,
              description: PACKAGE_DESCRIPTION[locale](pkg.credits),
            },
            unit_amount: pkg.priceSatang,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: localizedUrl(
        appUrl,
        locale,
        '/payment/success?session_id={CHECKOUT_SESSION_ID}&type=credits',
      ),
      cancel_url: localizedUrl(appUrl, locale, '/credits?cancelled=true'),
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
      // Per-locale coupon: its name is the discount line on Stripe's checkout page.
      const couponId = await ensureReferralCoupon(locale);
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
