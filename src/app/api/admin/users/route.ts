import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Get all users from Supabase Auth (auth.users table)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 10000,
    });

    if (authError) {
      throw authError;
    }

    const authUsers = authData?.users || [];

    // Batch: get referrals, memories, credits, and profiles in parallel
    const [{ data: referrals }, { data: memories }, { data: userCredits }, { data: profiles }] = await Promise.all([
      supabase
        .from('user_referrals')
        .select('user_id, referral_code, referred_by'),
      supabase
        .from('memories')
        .select('user_id, status'),
      supabase
        .from('user_credits')
        .select('user_id, balance'),
      supabase
        .from('user_profiles')
        .select('user_id, profile_credits_claimed'),
    ]);

    const referralMap = new Map(
      (referrals || []).map((r) => [r.user_id, r])
    );

    const creditsMap = new Map(
      (userCredits || []).map((c) => [c.user_id, c.balance])
    );

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.profile_credits_claimed])
    );

    // Aggregate memory counts in JS instead of per-user DB queries
    const memoryCounts = new Map<string, { total: number; paid: number }>();
    for (const memory of memories || []) {
      const entry = memoryCounts.get(memory.user_id) || { total: 0, paid: 0 };
      entry.total++;
      if (memory.status === 'active') entry.paid++;
      memoryCounts.set(memory.user_id, entry);
    }

    const usersWithCounts = authUsers.map((user) => {
      const referral = referralMap.get(user.id);
      const counts = memoryCounts.get(user.id) || { total: 0, paid: 0 };
      const creditBalance = creditsMap.get(user.id) || 0;
      const isProfileComplete = profileMap.get(user.id) || false;

      return {
        id: user.id,
        user_id: user.id,
        user_email: user.email || 'No email',
        referral_code: referral?.referral_code || null,
        referred_by: referral?.referred_by || null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        memoryCount: counts.total,
        paidMemoryCount: counts.paid,
        creditBalance,
        hasReferralCode: !!referral,
        isProfileComplete,
      };
    });

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
