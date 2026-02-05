import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

// Public blob file name for stats
const STATS_BLOB_NAME = 'site-stats.json';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel adds this header for cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if valid CRON_SECRET or if called from Vercel Cron (has x-vercel-cron header)
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !hasValidSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Get user count from Supabase Auth (real users)
    const { data: allUsers } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    const userCount = allUsers?.users?.length || 0;

    // Count other stats in parallel
    const [memories, stories] = await Promise.all([
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
    ]);

    const stats = {
      users: userCount,
      memories: memories.count || 0,
      stories: stories.count || 0,
      updatedAt: new Date().toISOString(),
    };

    // Save stats to Vercel Blob (public JSON file)
    const blob = await put(STATS_BLOB_NAME, JSON.stringify(stats), {
      access: 'public',
      addRandomSuffix: false, // Keep consistent filename
      contentType: 'application/json',
    });

    console.log('Site stats saved to blob:', blob.url);

    return NextResponse.json({
      success: true,
      stats,
      blobUrl: blob.url,
    });
  } catch (error) {
    console.error('Cron update-stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
