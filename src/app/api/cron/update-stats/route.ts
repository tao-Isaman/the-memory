import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

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

    // Count all stats in parallel
    const [users, memories, stories, activeMemories] = await Promise.all([
      supabase.from('user_referrals').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const stats = {
      users: users.count || 0,
      memories: memories.count || 0,
      stories: stories.count || 0,
      activeMemories: activeMemories.count || 0,
    };

    // Update stats table (using 'any' until types are regenerated after migration)
    const { error: updateError } = await (supabase as any)
      .from('site_stats')
      .update({
        total_users: stats.users,
        total_memories: stats.memories,
        total_stories: stats.stories,
        active_memories: stats.activeMemories,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (updateError) {
      console.error('Error updating site_stats:', updateError);
      return NextResponse.json(
        { error: 'Failed to update stats' },
        { status: 500 }
      );
    }

    console.log('Site stats updated:', stats);

    return NextResponse.json({
      success: true,
      stats,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron update-stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
