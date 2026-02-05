import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Get all users from Supabase Auth (auth.users table)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      throw authError;
    }

    const authUsers = authData?.users || [];

    // Get referral data for users who have it
    const { data: referrals } = await supabase
      .from('user_referrals')
      .select('user_id, referral_code, referred_by');

    const referralMap = new Map(
      (referrals || []).map((r) => [r.user_id, r])
    );

    // Get memory counts for each user
    const usersWithCounts = await Promise.all(
      authUsers.map(async (user) => {
        const { count: memoryCount } = await supabase
          .from('memories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: paidCount } = await supabase
          .from('memories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        const referral = referralMap.get(user.id);

        return {
          id: user.id,
          user_id: user.id,
          user_email: user.email || 'No email',
          referral_code: referral?.referral_code || null,
          referred_by: referral?.referred_by || null,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          memoryCount: memoryCount || 0,
          paidMemoryCount: paidCount || 0,
          hasReferralCode: !!referral,
        };
      })
    );

    // Sort by created_at descending
    usersWithCounts.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
