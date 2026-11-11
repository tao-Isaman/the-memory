import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireUser } from '@/lib/supabase-server';
import { isEligibleForReferralDiscount } from '@/lib/referral';

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  try {


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
