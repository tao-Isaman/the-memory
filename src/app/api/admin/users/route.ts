import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Get all users from user_referrals
    const { data: users, error: usersError } = await supabase
      .from('user_referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      throw usersError;
    }

    // Get memory counts for each user
    const usersWithCounts = await Promise.all(
      (users || []).map(async (user) => {
        const { count: memoryCount } = await supabase
          .from('memories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id);

        const { count: paidCount } = await supabase
          .from('memories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id)
          .eq('status', 'active');

        return {
          ...user,
          memoryCount: memoryCount || 0,
          paidMemoryCount: paidCount || 0,
        };
      })
    );

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
