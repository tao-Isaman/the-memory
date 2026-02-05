import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = getSupabaseServiceClient();

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('user_referrals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    // Get all memories for this user with story count
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (memoriesError) {
      throw memoriesError;
    }

    // Get story counts for each memory
    const memoriesWithCounts = await Promise.all(
      (memories || []).map(async (memory) => {
        const { count } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('memory_id', memory.id);

        return {
          ...memory,
          storyCount: count || 0,
        };
      })
    );

    return NextResponse.json({
      user,
      memories: memoriesWithCounts,
    });
  } catch (error) {
    console.error('Admin user memories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
