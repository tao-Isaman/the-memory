import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

/**
 * PATCH /api/admin/referral-claims/[claimId]
 * Update a referral claim's status
 * Body: { status: 'completed' | 'rejected', admin_note?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const { claimId } = await params;
    const body = await request.json();
    const { status, admin_note } = body;

    // Validate status
    if (!status || !['completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "completed" or "rejected"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Update the claim
    const { data, error } = await supabase
      .from('referral_claims')
      .update({
        status,
        admin_note: admin_note || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      console.error('Error updating referral claim:', error);
      return NextResponse.json(
        { error: 'Failed to update referral claim' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Referral claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/admin/referral-claims/[claimId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
