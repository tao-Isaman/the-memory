import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

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

    return NextResponse.json({
      users: data?.total_users || 0,
      memories: data?.total_memories || 0,
      stories: data?.total_stories || 0,
      activeMemories: data?.active_memories || 0,
      updatedAt: data?.updated_at || null,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
