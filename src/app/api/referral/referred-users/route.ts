import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

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

    // Get all users who were referred by this user
    const { data: referredUsers, error } = await supabase
      .from('user_referrals')
      .select('user_id, created_at, has_used_referral_discount')
      .eq('referred_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referred users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch referred users' },
        { status: 500 }
      );
    }

    if (!referredUsers || referredUsers.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get user emails from auth.users (we need to check memories for payment status)
    const userIds = referredUsers.map(u => u.user_id);

    // Check which users have paid (have active memories)
    const { data: paidMemories } = await supabase
      .from('memories')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'active');

    const paidUserIds = new Set(paidMemories?.map(m => m.user_id) || []);

    // Format the response
    const users = referredUsers.map(user => ({
      userId: user.user_id,
      appliedAt: user.created_at,
      hasPaid: paidUserIds.has(user.user_id),
      usedDiscount: user.has_used_referral_discount,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Referred users error:', error);
    return NextResponse.json(
      { error: 'Failed to get referred users' },
      { status: 500 }
    );
  }
}
