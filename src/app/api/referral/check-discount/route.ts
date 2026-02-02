import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { isEligibleForReferralDiscount } from '@/lib/referral';

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

    // Use the same eligibility check as checkout
    const { eligible, discountAmount } = await isEligibleForReferralDiscount(supabase, userId);

    return NextResponse.json({
      eligible,
      discountAmount,
    });
  } catch (error) {
    console.error('Check discount error:', error);
    return NextResponse.json(
      { eligible: false, discountAmount: 0 },
      { status: 500 }
    );
  }
}
