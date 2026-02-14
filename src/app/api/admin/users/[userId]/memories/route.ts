import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = getSupabaseServiceClient();

    // Get user info from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const authUser = authData.user;

    // Get referral info if exists
    const { data: referral } = await supabase
      .from('user_referrals')
      .select('referral_code, referred_by')
      .eq('user_id', userId)
      .single();

    // Get user profile for birthday
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('birthday, job, gender')
      .eq('user_id', userId)
      .single();

    let age: number | null = null;
    if (profile?.birthday) {
      const birthDate = new Date(profile.birthday);
      const today = new Date();
      // Calculate age manually if needed, or rely on DB function if we called it
      // Here we do it in JS for simplicity on the API side since we fetched the date
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const user = {
      user_id: authUser.id,
      user_email: authUser.email || 'No email',
      referral_code: referral?.referral_code || null,
      referred_by: referral?.referred_by || null,
      created_at: authUser.created_at,
      age: age,
      job: profile?.job || null,
      gender: profile?.gender || null,
    };

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
