import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/referral-claims
 * Fetch all referral claims with optional status filter
 * Query params: ?status=pending|completed|rejected|all (default: all)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') || 'all';

    // Build query
    let query = supabase
      .from('referral_claims')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching referral claims:', error);
      return NextResponse.json(
        { error: 'Failed to fetch referral claims' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/admin/referral-claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
