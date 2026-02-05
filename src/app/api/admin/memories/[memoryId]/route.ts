import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    const supabase = getSupabaseServiceClient();

    // Get memory
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (memoryError) {
      throw memoryError;
    }

    // Get user info from Supabase Auth
    let user = null;
    if (memory.user_id) {
      const { data: authData } = await supabase.auth.admin.getUserById(memory.user_id);

      if (authData?.user) {
        // Get referral info if exists
        const { data: referral } = await supabase
          .from('user_referrals')
          .select('referral_code')
          .eq('user_id', memory.user_id)
          .single();

        user = {
          user_id: authData.user.id,
          user_email: authData.user.email || 'No email',
          referral_code: referral?.referral_code || null,
        };
      }
    }

    // Get all stories for this memory
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('*')
      .eq('memory_id', memoryId)
      .order('priority', { ascending: true });

    if (storiesError) {
      throw storiesError;
    }

    return NextResponse.json({
      memory,
      user,
      stories: stories || [],
    });
  } catch (error) {
    console.error('Admin memory details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
