import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Batch: Get all cartoon generations and user data in parallel
    const [{ data: cartoons }, { data: authData }] = await Promise.all([
      supabase
        .from('cartoon_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.auth.admin.listUsers({
        perPage: 10000,
      }),
    ]);

    const authUsers = authData?.users || [];
    const userEmailMap = new Map(authUsers.map(u => [u.id, u.email || 'Unknown']));

    // Calculate stats
    const stats = {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      successRate: 0,
      totalCreditsUsed: 0,
    };

    // Get total counts for stats
    const { data: allCartoons } = await supabase
      .from('cartoon_generations')
      .select('status, credits_used');

    if (allCartoons) {
      stats.total = allCartoons.length;
      stats.completed = allCartoons.filter(c => c.status === 'completed').length;
      stats.failed = allCartoons.filter(c => c.status === 'failed').length;
      stats.pending = allCartoons.filter(c => c.status === 'pending').length;
      stats.successRate = stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;
      stats.totalCreditsUsed = allCartoons.reduce((sum, c) => sum + (c.credits_used || 0), 0);
    }

    // Map recent generations with user emails
    const recentGenerations = (cartoons || []).map(cartoon => ({
      id: cartoon.id,
      userEmail: userEmailMap.get(cartoon.user_id) || 'Unknown',
      userId: cartoon.user_id,
      originalImageUrl: cartoon.original_image_url,
      cartoonImageUrl: cartoon.cartoon_image_url,
      creditsUsed: cartoon.credits_used,
      status: cartoon.status,
      createdAt: cartoon.created_at,
    }));

    return NextResponse.json({
      stats,
      recentGenerations,
    });
  } catch (error) {
    console.error('Admin cartoons error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
