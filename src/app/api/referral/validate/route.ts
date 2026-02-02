import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getReferralByCode } from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Missing referral code' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const referral = await getReferralByCode(supabase, code);

    if (!referral) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid referral code',
      });
    }

    // Prevent self-referral
    if (userId && referral.userId === userId) {
      return NextResponse.json({
        valid: false,
        error: 'Cannot use your own referral code',
      });
    }

    return NextResponse.json({
      valid: true,
    });
  } catch (error) {
    console.error('Referral validate error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}
