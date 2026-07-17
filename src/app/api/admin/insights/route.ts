import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

/**
 * Admin insights: what drives payment, the signup->create->pay funnel, recipient
 * engagement, and a revenue trend. All from one SQL-aggregated RPC (get_insights) —
 * never fetch-all-and-reduce-in-JS, which PostgREST silently caps at ~1000 rows.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '90', 10) || 90, 1), 365);

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.rpc('get_insights', { p_days: days });

    if (error) {
      console.error('Admin insights error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ days, ...data });
  } catch (error) {
    console.error('Admin insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
