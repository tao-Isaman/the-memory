import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

// Cache duration: 1 hour (stats update daily, so 1 hour cache is fine)
const CACHE_MAX_AGE = 3600; // 1 hour in seconds
const CACHE_STALE_WHILE_REVALIDATE = 7200; // 2 hours

// Fallback: Query database directly (used when blob doesn't exist)
async function getStatsFromDatabase() {
  const supabase = getSupabaseServiceClient();

  // Get user count from Supabase Auth
  const { data: allUsers } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  const userCount = allUsers?.users?.length || 0;

  // Get other stats
  const [memories, stories] = await Promise.all([
    supabase.from('memories').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
  ]);

  return {
    users: userCount,
    memories: memories.count || 0,
    stories: stories.count || 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    let stats;

    // Try to get stats from Vercel Blob first
    try {
      const { blobs } = await list({ prefix: 'site-stats' });
      const statsBlob = blobs.find(b => b.pathname === 'site-stats.json');

      if (statsBlob) {
        const statsResponse = await fetch(statsBlob.url);
        stats = await statsResponse.json();
      }
    } catch (blobError) {
      console.log('Blob not available, falling back to database');
    }

    // Fallback to database if blob doesn't exist or failed
    if (!stats) {
      stats = await getStatsFromDatabase();
    }

    const response = NextResponse.json(stats);

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
