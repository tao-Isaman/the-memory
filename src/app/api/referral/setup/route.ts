import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import {
  getUserReferral,
  getReferralByCode,
  createUserReferral,
} from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    const { userId, referralCode } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check if user already has a referral record
    const existingReferral = await getUserReferral(supabase, userId);
    if (existingReferral) {
      return NextResponse.json({
        success: true,
        userReferralCode: existingReferral.referralCode,
        referredBy: existingReferral.referredBy,
        isExisting: true,
      });
    }

    let referredByUserId: string | undefined;

    // If referral code provided, validate it
    if (referralCode) {
      const referrerRecord = await getReferralByCode(supabase, referralCode);

      if (!referrerRecord) {
        return NextResponse.json(
          { error: 'Invalid referral code', success: false },
          { status: 400 }
        );
      }

      // Prevent self-referral
      if (referrerRecord.userId === userId) {
        return NextResponse.json(
          { error: 'Cannot use your own referral code', success: false },
          { status: 400 }
        );
      }

      referredByUserId = referrerRecord.userId;
    }

    // Create new referral record
    const newReferral = await createUserReferral(supabase, userId, referredByUserId);

    if (!newReferral) {
      return NextResponse.json(
        { error: 'Failed to create referral record', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userReferralCode: newReferral.referralCode,
      referredBy: referredByUserId || null,
      isExisting: false,
    });
  } catch (error) {
    console.error('Referral setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup referral', success: false },
      { status: 500 }
    );
  }
}
