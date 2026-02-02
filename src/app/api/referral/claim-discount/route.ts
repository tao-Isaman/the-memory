import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { claimDiscount, getUserReferral } from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify user has pending discounts
    const referral = await getUserReferral(supabase, userId);

    if (!referral) {
      return NextResponse.json(
        { success: false, error: 'No referral record found', remainingClaims: 0 },
        { status: 400 }
      );
    }

    if (referral.pendingDiscountClaims <= 0) {
      return NextResponse.json(
        { success: false, error: 'No pending discounts available', remainingClaims: 0 },
        { status: 400 }
      );
    }

    // Claim the discount
    const result = await claimDiscount(supabase, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to claim discount', remainingClaims: result.remainingClaims },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งคำขอรับส่วนลด 50% สำเร็จ กรุณารอแอดมินติดต่อกลับ',
      remainingClaims: result.remainingClaims,
    });
  } catch (error) {
    console.error('Claim discount error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim discount' },
      { status: 500 }
    );
  }
}
