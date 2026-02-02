import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserReferral, getReferralCount } from '@/lib/referral';

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
        hasFreeMemory: false,
        freeMemoryUsed: false,
        referralCount: 0,
      });
    }

    const referralCount = await getReferralCount(supabase, userId);

    return NextResponse.json({
      hasReferral: true,
      referralCode: referral.referralCode,
      hasFreeMemory: !!referral.referredBy && !referral.freeMemoryUsed,
      freeMemoryUsed: referral.freeMemoryUsed,
      referralCount,
    });
  } catch (error) {
    console.error('Referral status error:', error);
    return NextResponse.json(
      { error: 'Failed to get referral status' },
      { status: 500 }
    );
  }
}
