import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserReferral, getReferralSignupCount } from '@/lib/referral';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const referral = await getUserReferral(supabase, userId);

    if (!referral) {
      return NextResponse.json({
        hasReferral: false,
        referralCode: null,
        referralLink: null,
        stats: {
          totalSignups: 0,
          totalPaidConversions: 0,
          pendingDiscounts: 0,
          claimedDiscounts: 0,
        },
      });
    }

    const totalSignups = await getReferralSignupCount(supabase, userId);

    // Build referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thememory.app';
    const referralLink = `${baseUrl}?ref=${referral.referralCode}`;

    return NextResponse.json({
      hasReferral: true,
      referralCode: referral.referralCode,
      referralLink,
      referredBy: referral.referredBy,
      hasUsedReferralDiscount: referral.hasUsedReferralDiscount,
      stats: {
        totalSignups,
        totalPaidConversions: referral.paidReferralCount,
        pendingDiscounts: referral.pendingDiscountClaims,
        claimedDiscounts: referral.totalDiscountsClaimed,
      },
    });
  } catch (error) {
    console.error('Referral status error:', error);
    return NextResponse.json(
      { error: 'Failed to get referral status' },
      { status: 500 }
    );
  }
}
