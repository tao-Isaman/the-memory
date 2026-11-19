// Returns stable error CODES, not prose — the UI is localised (see messages/<locale>/referral.json "errors").
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireUser } from '@/lib/supabase-server';
import { getUserReferral, getClaimState } from '@/lib/referral';
import { CLAIM_UNIT_THB, overClaimed } from '@/lib/referral-claims';
import { ClaimRequest } from '@/types/referral';

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  try {
    const body = await request.json();
    const { paymentMethod, paymentInfo, bankName, accountName } = body as ClaimRequest;

    // Validate required fields

    if (!paymentMethod || !paymentInfo) {
      return NextResponse.json(
        { success: false, error: 'INCOMPLETE_BANK_INFO' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'bank_transfer' && (!bankName || !accountName)) {
      return NextResponse.json(
        { success: false, error: 'INCOMPLETE_BANK_INFO' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify user has pending discounts (calculate dynamically)
    const referral = await getUserReferral(supabase, userId);

    if (!referral) {
      return NextResponse.json(
        { success: false, error: 'GENERIC', remainingClaims: 0 },
        { status: 400 }
      );
    }

    // Every right left is claimed in this one request (amount = 50 × N). Rights used = sum(amount) / 50.
    const before = await getClaimState(supabase, userId);
    if (before.remaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'NO_PENDING_CLAIMS', remainingClaims: 0 },
        { status: 400 }
      );
    }
    const units = before.remaining;

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { success: false, error: 'GENERIC' },
        { status: 400 }
      );
    }

    // Create claim record for admin
    const { data: claim, error: claimError } = await supabase
      .from('referral_claims')
      .insert({
        user_id: userId,
        user_email: userData.user.email,
        amount: units * CLAIM_UNIT_THB,
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
        { success: false, error: 'CLAIM_FAILED' },
        { status: 500 }
      );
    }

    // Double click / two tabs: both requests may pass the check above. Re-read after inserting; if the rows now
    // claim more than was earned, this request backs out (never both: the later insert always sees the earlier row).
    const after = await getClaimState(supabase, userId);
    if (overClaimed(after.paidCount, after.rows)) {
      await supabase.from('referral_claims').delete().eq('id', claim.id).eq('status', 'pending');
      return NextResponse.json(
        { success: false, error: 'CLAIM_IN_PROGRESS', remainingClaims: 0 },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        status: claim.status,
        amount: claim.amount,
        units,
        paymentMethod: claim.payment_method,
        createdAt: claim.created_at,
      },
      remainingClaims: after.remaining,
    });
  } catch (error) {
    console.error('Claim discount error:', error);
    return NextResponse.json(
      { success: false, error: 'GENERIC' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's claim history
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  try {


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
        hasSlip: c.status === 'completed' && !!c.slip_url, // the image itself only through /api/referral/claims/<id>/slip
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
