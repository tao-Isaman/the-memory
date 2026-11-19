import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireAdmin } from '@/lib/supabase-server';
import { parseUsersQuery } from '@/lib/admin-users-query';

/**
 * GET /api/admin/users?page=&pageSize=&q=&memories=&paid=&referral=&sort=field:order,...
 * One page of users with their counts, searched, filtered and sorted in the database (admin_users_overview, 039).
 * Returns { users, total } — total is the count after filters, for the pager.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const supabase = getSupabaseServiceClient();
    const q = parseUsersQuery(request.nextUrl.searchParams);

    let query = supabase.rpc('admin_users_overview', undefined, { count: 'exact' }).select('*');
    if (q.search) query = query.or(`user_email.ilike.*${q.search}*,referral_code.ilike.*${q.search}*`);
    if (q.memories === 'with') query = query.gt('memory_count', 0);
    if (q.memories === 'without') query = query.eq('memory_count', 0);
    if (q.paid === 'paid') query = query.gt('paid_memory_count', 0);
    if (q.paid === 'unpaid') query = query.eq('paid_memory_count', 0);
    if (q.referral === 'with') query = query.eq('has_referral_code', true);
    if (q.referral === 'without') query = query.eq('has_referral_code', false);
    for (const s of q.sort) query = query.order(s.column, { ascending: s.ascending });
    query = query.order('id', { ascending: true }); // stable pages when the sort has ties

    const from = (q.page - 1) * q.pageSize;
    const { data, count, error } = await query.range(from, from + q.pageSize - 1);
    if (error) throw error;

    const users = (data || []).map((u) => ({
      id: u.id,
      user_id: u.id,
      user_email: u.user_email,
      referral_code: u.referral_code,
      referred_by: u.referred_by,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      memoryCount: Number(u.memory_count),
      paidMemoryCount: Number(u.paid_memory_count),
      creditBalance: u.credit_balance,
      hasReferralCode: u.has_referral_code,
      isProfileComplete: u.is_profile_complete,
    }));

    return NextResponse.json({ users, total: count ?? users.length, page: q.page, pageSize: q.pageSize });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
