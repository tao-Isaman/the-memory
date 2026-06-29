import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

// Cache duration: stats barely move, and CDN (s-maxage) + SWR shield the DB,
// so the origin recomputes at most ~once/hour/region.
const CACHE_MAX_AGE = 3600; // 1 hour
const CACHE_STALE_WHILE_REVALIDATE = 7200; // 2 hours

// Counts are cheap now (get_user_count is O(1), memories/stories are head counts),
// so serve them live. Previously this trusted a once-a-day blob, which is why the
// home-page user count lagged a full day and froze at the old 10000 listUsers cap.
async function getStats() {
  const supabase = getSupabaseServiceClient();

  const { data: userCountData } = await supabase.rpc('get_user_count');
  const [memories, stories] = await Promise.all([
    supabase.from('memories').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
  ]);

  return {
    users: Number(userCountData) || 0,
    memories: memories.count || 0,
    stories: stories.count || 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const stats = await getStats();
    const response = NextResponse.json(stats);
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`
    );
    return response;
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
