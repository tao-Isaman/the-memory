import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireAdmin } from '@/lib/supabase-server';
import { emailsByIds } from '@/lib/auth-users';

interface TopReferrer {
  userId: string;
  email: string;
  referralCode: string;
  referredCount: number;
}

interface ReferralStats {
  totalReferralCodes: number;
  totalReferredUsers: number;
  totalConversions: number;
  pendingClaims: number;
  totalClaimedAmount: number;
  topReferrers: TopReferrer[];
}

/**
 * GET /api/admin/referral-stats
 * Fetch referral system analytics
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const supabase = getSupabaseServiceClient();

    // Batch all queries with Promise.all for performance
    const [
      totalCodesResult,
      totalReferredResult,
      totalConversionsResult,
      pendingClaimsResult,
      claimedAmountResult,
    ] = await Promise.all([
      // Total referral codes created
      supabase
        .from('user_referrals')
        .select('*', { count: 'exact', head: true }),

      // Total referred users (users who used someone's code)
      supabase
        .from('user_referrals')
        .select('*', { count: 'exact', head: true })
        .not('referred_by', 'is', null),

      // Total conversions (referred users who paid)
      supabase
        .from('referral_conversions')
        .select('*', { count: 'exact', head: true }),

      // Pending claims count
      supabase
        .from('referral_claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Total claimed amount (completed claims)
      supabase
        .from('referral_claims')
        .select('amount')
        .eq('status', 'completed'),

    ]);

    // Calculate total claimed amount
    const totalClaimedAmount = claimedAmountResult.data
      ? claimedAmountResult.data.reduce((sum, claim) => sum + claim.amount, 0)
      : 0;

    // Top referrers: count referred_by over EVERY user_referrals row. The old query read one capped page
    // (PostgREST max rows) and only rows that have their own code, so most referred users were never counted.
    const referralRows = await fetchReferralRows(supabase);
    const codeOf = new Map(referralRows.filter((r) => r.referral_code).map((r) => [r.user_id, r.referral_code as string]));
    const countOf = new Map<string, number>();
    for (const r of referralRows) {
      if (r.referred_by) countOf.set(r.referred_by, (countOf.get(r.referred_by) || 0) + 1);
    }
    const top = [...countOf.entries()]
      .filter(([userId]) => codeOf.has(userId))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    // Emails for these ten only (listUsers returns one page: everyone past it showed "Unknown").
    const emailOf = await emailsByIds(supabase, top.map(([userId]) => userId));
    const topReferrers: TopReferrer[] = top.map(([userId, count]) => ({
      userId,
      email: emailOf.get(userId) || 'Unknown',
      referralCode: codeOf.get(userId) as string,
      referredCount: count,
    }));

    const stats: ReferralStats = {
      totalReferralCodes: totalCodesResult.count || 0,
      totalReferredUsers: totalReferredResult.count || 0,
      totalConversions: totalConversionsResult.count || 0,
      pendingClaims: pendingClaimsResult.count || 0,
      totalClaimedAmount,
      topReferrers,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/admin/referral-stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const REFERRAL_PAGE = 1000;

/** Every user_referrals row that has a code or a referrer, page by page. */
async function fetchReferralRows(supabase: ReturnType<typeof getSupabaseServiceClient>) {
  const rows: { user_id: string; referral_code: string | null; referred_by: string | null }[] = [];
  for (let from = 0; ; from += REFERRAL_PAGE) {
    const { data, error } = await supabase
      .from('user_referrals')
      .select('user_id, referral_code, referred_by')
      .or('referral_code.not.is.null,referred_by.not.is.null')
      .order('user_id')
      .range(from, from + REFERRAL_PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < REFERRAL_PAGE) return rows;
  }
}
