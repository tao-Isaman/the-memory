import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { routing, locales, type Locale } from '@/i18n/routing';

export function normalizeLocale(input?: string | null): Locale {
  return (locales as readonly string[]).includes(input ?? '')
    ? (input as Locale)
    : routing.defaultLocale;
}

/**
 * PromptPay is a Thailand-only rail — it needs a Thai bank app to scan the QR.
 * Offering it to an English/Indonesian customer shows them a payment method they
 * physically cannot complete, so they get card only. (Pricing stays THB; Stripe
 * handles the FX on the card.)
 */
export function paymentMethodsFor(
  locale: Locale,
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  return locale === 'th' ? ['card', 'promptpay'] : ['card'];
}

/** Stripe renders its own hosted Checkout UI in this language. */
export function stripeLocaleFor(locale: Locale): Stripe.Checkout.SessionCreateParams.Locale {
  if (locale === 'th') return 'th';
  if (locale === 'id') return 'id';
  return 'en';
}

/**
 * Build an app URL that keeps the user in their language after returning from Stripe.
 * Thai is unprefixed (localePrefix: 'as-needed'), everything else gets /<locale>.
 */
export function localizedUrl(appUrl: string, locale: Locale, path: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${appUrl}${prefix}${path}`;
}

const DISCOUNT_AMOUNT_SATANG = 5000; // 50 THB

/**
 * A Stripe coupon's `name` is rendered on the hosted checkout page as the discount line,
 * so it has to exist per language — one shared coupon would show Thai to an English payer.
 * The Thai id is kept as-is so the coupon already live in Stripe is reused, not duplicated.
 */
const REFERRAL_COUPON: Record<Locale, { id: string; name: string }> = {
  th: { id: 'REFERRAL_50_THB', name: 'ส่วนลดจากโค้ดแนะนำ 50 บาท' },
  en: { id: 'REFERRAL_50_THB_EN', name: 'Referral discount ฿50' },
  id: { id: 'REFERRAL_50_THB_ID', name: 'Diskon kode referral ฿50' },
};

/** Returns the coupon id for this locale, creating it in Stripe the first time. */
export async function ensureReferralCoupon(locale: Locale): Promise<string | null> {
  const { id, name } = REFERRAL_COUPON[locale];
  try {
    await stripe.coupons.retrieve(id);
    return id;
  } catch {
    try {
      await stripe.coupons.create({
        id,
        amount_off: DISCOUNT_AMOUNT_SATANG,
        currency: 'thb',
        name,
        duration: 'once',
      });
      return id;
    } catch (createError) {
      console.error(`Failed to create referral coupon ${id}:`, createError);
      return null;
    }
  }
}
