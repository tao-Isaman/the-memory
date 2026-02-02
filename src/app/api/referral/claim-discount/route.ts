import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserReferral } from '@/lib/referral';
import { ClaimRequest } from '@/types/referral';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, paymentMethod, paymentInfo, bankName, accountName } = body as {
      userId: string;
    } & ClaimRequest;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !paymentInfo) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลการรับเงินให้ครบถ้วน' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'bank_transfer' && (!bankName || !accountName)) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อธนาคารและชื่อบัญชี' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify user has pending discounts
    const referral = await getUserReferral(supabase, userId);

    if (!referral) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ใช้', remainingClaims: 0 },
        { status: 400 }
      );
    }

    if (referral.pendingDiscountClaims <= 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์รับเงินที่รอดำเนินการ', remainingClaims: 0 },
        { status: 400 }
      );
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบอีเมลผู้ใช้' },
        { status: 400 }
      );
    }

    const userEmail = userData.user.email;

    // Create claim record for admin
    const { data: claim, error: claimError } = await supabase
      .from('referral_claims')
      .insert({
        user_id: userId,
        user_email: userEmail,
        amount: 50,
        payment_method: paymentMethod,
        payment_info: paymentInfo,
        bank_name: bankName || null,
        account_name: accountName || null,
        status: 'pending',
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating claim:', claimError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถสร้างคำขอได้' },
        { status: 500 }
      );
    }

    // Update user_referrals counts
    const { error: updateError } = await supabase
      .from('user_referrals')
      .update({
        pending_discount_claims: referral.pendingDiscountClaims - 1,
        total_discounts_claimed: referral.totalDiscountsClaimed + 1,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating referral counts:', updateError);
    }

    // Mark one conversion as claimed
    await supabase
      .from('referral_conversions')
      .update({
        discount_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('referrer_id', userId)
      .eq('discount_claimed', false)
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'ส่งคำขอรับเงิน 50 บาท สำเร็จ กรุณารอแอดมินโอนเงินให้',
      claim: {
        id: claim.id,
        status: claim.status,
        amount: claim.amount,
        paymentMethod: claim.payment_method,
        createdAt: claim.created_at,
      },
      remainingClaims: referral.pendingDiscountClaims - 1,
    });
  } catch (error) {
    console.error('Claim discount error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's claim history
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

    const { data: claims, error } = await supabase
      .from('referral_claims')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching claims:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claims' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      claims: claims.map((c) => ({
        id: c.id,
        amount: c.amount,
        paymentMethod: c.payment_method,
        paymentInfo: c.payment_info,
        bankName: c.bank_name,
        status: c.status,
        adminNote: c.admin_note,
        createdAt: c.created_at,
        processedAt: c.processed_at,
      })),
    });
  } catch (error) {
    console.error('Fetch claims error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}
