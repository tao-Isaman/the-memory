import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Fetch all stats in parallel
    const [users, memories, stories, paidMemories] = await Promise.all([
      supabase.from('user_referrals').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    return NextResponse.json({
      totalUsers: users.count || 0,
      totalMemories: memories.count || 0,
      totalStories: stories.count || 0,
      paidMemories: paidMemories.count || 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
