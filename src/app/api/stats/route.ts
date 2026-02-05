import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

// Cache duration: 1 hour (stats update every 12 hours, so 1 hour cache is fine)
const CACHE_MAX_AGE = 3600; // 1 hour in seconds
const CACHE_STALE_WHILE_REVALIDATE = 7200; // 2 hours

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Using 'any' until types are regenerated after migration
    const { data, error } = await (supabase as any)
      .from('site_stats')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching site_stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      users: data?.total_users || 0,
      memories: data?.total_memories || 0,
      stories: data?.total_stories || 0,
      activeMemories: data?.active_memories || 0,
      updatedAt: data?.updated_at || null,
    });

    // Add cache headers for CDN and browser caching
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`
    );

    return response;
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
