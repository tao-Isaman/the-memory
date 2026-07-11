import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

/**
 * Time-in-app stats for the admin dashboard.
 *
 * Everything comes from the get_engagement_stats RPC in ONE round trip, aggregated in
 * SQL. Deliberately not "fetch all sessions and reduce in JS" — PostgREST silently caps
 * an unbounded .select() at ~1000 rows, which is exactly how the credits dashboard ended
 * up reporting wrong numbers.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 1), 365);

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.rpc('get_engagement_stats', { p_days: days });

    if (error) {
      console.error('Admin engagement error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ days, ...data });
  } catch (error) {
    console.error('Admin engagement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
