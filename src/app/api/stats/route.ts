import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Cache duration: 1 hour (stats update every 12 hours, so 1 hour cache is fine)
const CACHE_MAX_AGE = 3600; // 1 hour in seconds
const CACHE_STALE_WHILE_REVALIDATE = 7200; // 2 hours

export async function GET() {
  try {
    // Find the stats blob file
    const { blobs } = await list({ prefix: 'site-stats' });
    const statsBlob = blobs.find(b => b.pathname === 'site-stats.json');

    if (!statsBlob) {
      // Return empty stats if blob doesn't exist yet
      return NextResponse.json({
        users: 0,
        memories: 0,
        stories: 0,
        activeMemories: 0,
        updatedAt: null,
      });
    }

    // Fetch the JSON from blob URL
    const statsResponse = await fetch(statsBlob.url);
    const stats = await statsResponse.json();

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
