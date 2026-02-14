import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Get user count from Supabase Auth
    const { data: authData } = await supabase.auth.admin.listUsers({
      perPage: 1,
      page: 1,
    });

    // Get total user count - we need to fetch all to count
    const { data: allUsers } = await supabase.auth.admin.listUsers({
      perPage: 10000,
    });
    const totalUsers = allUsers?.users?.length || 0;

    // Fetch other stats in parallel
    const [memories, stories, paidMemories] = await Promise.all([
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    return NextResponse.json({
      totalUsers,
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
