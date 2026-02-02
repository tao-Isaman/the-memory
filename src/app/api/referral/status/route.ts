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

    // Count actual paid users (users who used this code and have active memories)
    const { data: referredUsers } = await supabase
      .from('user_referrals')
      .select('user_id')
      .eq('referred_by', userId);

    let paidCount = 0;
    let paidUserIds: string[] = [];
    if (referredUsers && referredUsers.length > 0) {
      const userIds = referredUsers.map(u => u.user_id);

      // Count unique users who have paid
      const { data: paidMemories } = await supabase
        .from('memories')
        .select('user_id')
        .in('user_id', userIds)
        .eq('status', 'active');

      if (paidMemories) {
        const uniquePaidUsers = new Set(paidMemories.map(m => m.user_id));
        paidCount = uniquePaidUsers.size;
        paidUserIds = Array.from(uniquePaidUsers);
      }
    }

    // Count claims from referral_claims table
    const { count: claimedCount } = await supabase
      .from('referral_claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const claimedDiscounts = claimedCount || 0;

    // Calculate pending discounts: paid users minus claims submitted
    // This works even if conversion records don't exist yet
    const pendingDiscounts = Math.max(0, paidCount - claimedDiscounts);

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
