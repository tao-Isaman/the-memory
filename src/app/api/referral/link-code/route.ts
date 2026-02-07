import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import {
  getUserReferral,
  getReferralByCode,
  linkReferralCode,
} from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    const { userId, referralCode } = await request.json();

    if (!userId || !referralCode) {
      return NextResponse.json(
        { error: 'Missing userId or referralCode', success: false },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check user has an existing referral record with no referred_by
    const existingReferral = await getUserReferral(supabase, userId);
    if (!existingReferral) {
      return NextResponse.json(
        { error: 'No referral record found', success: false },
        { status: 400 }
      );
    }

    if (existingReferral.referredBy) {
      return NextResponse.json(
        { error: 'คุณได้ใส่โค้ดแนะนำแล้ว', success: false },
        { status: 400 }
      );
    }

    // Validate the referral code
    const referrerRecord = await getReferralByCode(supabase, referralCode);
    if (!referrerRecord) {
      return NextResponse.json(
        { error: 'โค้ดแนะนำไม่ถูกต้อง', success: false },
        { status: 400 }
      );
    }

    // Prevent self-referral
    if (referrerRecord.userId === userId) {
      return NextResponse.json(
        { error: 'ไม่สามารถใช้โค้ดของตัวเองได้', success: false },
        { status: 400 }
      );
    }

    // Link the referral code
    const success = await linkReferralCode(supabase, userId, referrerRecord.userId);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to link referral code', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      referredBy: referrerRecord.userId,
    });
  } catch (error) {
    console.error('Link referral code error:', error);
    return NextResponse.json(
      { error: 'Failed to link referral code', success: false },
      { status: 500 }
    );
  }
}
