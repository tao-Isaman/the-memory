import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import {
  getUserReferral,
  markFreeMemoryUsed,
  activateMemoryForFree,
} from '@/lib/referral';

export async function POST(request: NextRequest) {
  try {
    const { memoryId, userId } = await request.json();

    if (!memoryId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify user has free memory benefit
    const referral = await getUserReferral(supabase, userId);

    if (!referral) {
      return NextResponse.json(
        { success: false, error: 'No referral record found' },
        { status: 400 }
      );
    }

    if (!referral.referredBy) {
      return NextResponse.json(
        { success: false, error: 'No referral benefit available' },
        { status: 400 }
      );
    }

    if (referral.freeMemoryUsed) {
      return NextResponse.json(
        { success: false, error: 'Free memory benefit already used' },
        { status: 400 }
      );
    }

    // Verify memory exists and belongs to user
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .select('id, user_id, status')
      .eq('id', memoryId)
      .eq('user_id', userId)
      .single();

    if (memoryError || !memory) {
      return NextResponse.json(
        { success: false, error: 'Memory not found' },
        { status: 404 }
      );
    }

    if (memory.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Memory is already active' },
        { status: 400 }
      );
    }

    // Activate memory for free
    const activated = await activateMemoryForFree(supabase, memoryId, userId);

    if (!activated) {
      return NextResponse.json(
        { success: false, error: 'Failed to activate memory' },
        { status: 500 }
      );
    }

    // Mark free memory benefit as used
    const marked = await markFreeMemoryUsed(supabase, userId);

    if (!marked) {
      console.error('Warning: Failed to mark free memory as used for user:', userId);
    }

    return NextResponse.json({
      success: true,
      memoryId,
      status: 'active',
    });
  } catch (error) {
    console.error('Use free memory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to use free memory benefit' },
      { status: 500 }
    );
  }
}
