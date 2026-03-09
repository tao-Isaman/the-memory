import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { SupabaseClient } from '@supabase/supabase-js';

const PAGE_SIZE = 1000;

/**
 * Paginate through ALL rows of a table to bypass Supabase's
 * server-side max-rows limit (default 1000).
 */
async function fetchAllRows(
  supabase: SupabaseClient,
  table: string,
  select: string,
): Promise<Record<string, unknown>[]> {
  const allData: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
}

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

    // Fetch all rows from each table in parallel (paginated to bypass 1000-row limit)
    const [referrals, memories, userCredits, profiles] = await Promise.all([
      fetchAllRows(supabase, 'user_referrals', 'user_id, referral_code, referred_by'),
      fetchAllRows(supabase, 'memories', 'user_id, status'),
      fetchAllRows(supabase, 'user_credits', 'user_id, balance'),
      fetchAllRows(supabase, 'user_profiles', 'user_id, profile_credits_claimed'),
    ]);

    const referralMap = new Map(
      referrals.map((r) => [r.user_id as string, r])
    );

    const creditsMap = new Map(
      userCredits.map((c) => [c.user_id as string, c.balance as number])
    );

    const profileMap = new Map(
      profiles.map((p) => [p.user_id as string, p.profile_credits_claimed as boolean])
    );

    // Aggregate memory counts in JS instead of per-user DB queries
    const memoryCounts = new Map<string, { total: number; paid: number }>();
    for (const memory of memories) {
      const userId = memory.user_id as string;
      const entry = memoryCounts.get(userId) || { total: 0, paid: 0 };
      entry.total++;
      if (memory.status === 'active') entry.paid++;
      memoryCounts.set(userId, entry);
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
        referral_code: (referral?.referral_code as string) || null,
        referred_by: (referral?.referred_by as string) || null,
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
