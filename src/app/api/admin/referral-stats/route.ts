import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

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
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Batch all queries with Promise.all for performance
    const [
      totalCodesResult,
      totalReferredResult,
      totalConversionsResult,
      pendingClaimsResult,
      claimedAmountResult,
      allReferralsResult,
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

      // All referrals for calculating top referrers
      supabase
        .from('user_referrals')
        .select('user_id, referral_code, referred_by')
        .not('referral_code', 'is', null),
    ]);

    // Calculate total claimed amount
    const totalClaimedAmount = claimedAmountResult.data
      ? claimedAmountResult.data.reduce((sum, claim) => sum + claim.amount, 0)
      : 0;

    // Calculate top referrers manually
    let topReferrers: TopReferrer[] = [];

    if (allReferralsResult.data) {
      // Count referrals per user
      const referrerMap = new Map<string, { code: string; count: number }>();
      allReferralsResult.data.forEach((referral) => {
        if (referral.referred_by) {
          const current = referrerMap.get(referral.referred_by);
          if (current) {
            current.count++;
          } else {
            // Find the referrer's code
            const referrer = allReferralsResult.data.find((r) => r.user_id === referral.referred_by);
            if (referrer?.referral_code) {
              referrerMap.set(referral.referred_by, {
                code: referrer.referral_code,
                count: 1,
              });
            }
          }
        }
      });

      // Get user emails
      const topUserIds = Array.from(referrerMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map((entry) => entry[0]);

      if (topUserIds.length > 0) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const userEmailMap = new Map(
          authUsers.users.map((u) => [u.id, u.email || 'Unknown'])
        );

        topReferrers = Array.from(referrerMap.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([userId, data]) => ({
            userId,
            email: userEmailMap.get(userId) || 'Unknown',
            referralCode: data.code,
            referredCount: data.count,
          }));
      }
    }

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
