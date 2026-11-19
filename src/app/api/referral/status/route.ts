import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireUser } from '@/lib/supabase-server';
import { getUserReferral, getReferralSignupCount, getClaimState } from '@/lib/referral';

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  try {


    const supabase = getSupabaseServiceClient();

    const referral = await getUserReferral(supabase, userId);

    if (!referral) {
      return NextResponse.json({
        hasReferral: false,
        referralCode: null,
        referralLink: null,
        referredBy: null,
        hasUsedReferralDiscount: false,
        stats: {
          totalSignups: 0,
          totalPaidConversions: 0,
          pendingDiscounts: 0,
          claimedDiscounts: 0,
        },
      });
    }

    const totalSignups = await getReferralSignupCount(supabase, userId);

    // Rights earned (paid referred users), used (sum of claim amounts / 50) and left — same count as claim-discount.
    const { paidCount, claimed: claimedDiscounts, remaining: pendingDiscounts } = await getClaimState(supabase, userId);

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
        totalPaidConversions: paidCount,
        pendingDiscounts,
        claimedDiscounts,
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
