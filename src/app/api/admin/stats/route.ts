import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

const MEMORY_PRICE_THB = 99; // Price per memory activation

interface RecentActivity {
  type: 'memory' | 'credit' | 'cartoon';
  userEmail: string;
  description: string;
  createdAt: string;
}

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Get all users for email lookup
    const { data: allUsers } = await supabase.auth.admin.listUsers({
      perPage: 10000,
    });
    const totalUsers = allUsers?.users?.length || 0;

    // Create user ID to email map
    const userEmailMap = new Map<string, string>();
    allUsers?.users?.forEach((user) => {
      if (user.id && user.email) {
        userEmailMap.set(user.id, user.email);
      }
    });

    // Fetch all stats in parallel
    const [
      memories,
      stories,
      paidMemories,
      failedMemoriesResult,
      creditTransactions,
      creditPackages,
      cartoons,
      pendingClaimsResult,
      recentMemories,
      recentCredits,
      recentCartoons,
    ] = await Promise.all([
      supabase.from('memories').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      supabase.from('memories').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('memories').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase.from('credit_transactions').select('*').eq('type', 'purchase'),
      supabase.from('credit_packages').select('*'),
      supabase.from('cartoon_generations').select('*'),
      supabase.from('referral_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      // Recent activities
      supabase.from('memories').select('user_id, title, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('credit_transactions').select('user_id, amount, description, created_at').eq('type', 'purchase').order('created_at', { ascending: false }).limit(10),
      supabase.from('cartoon_generations').select('user_id, status, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    // Calculate total revenue
    const memoryRevenue = (paidMemories.count || 0) * MEMORY_PRICE_THB;

    // Calculate credit revenue from packages
    let creditRevenue = 0;
    const packageMap = new Map<string, number>();
    creditPackages.data?.forEach((pkg) => {
      packageMap.set(pkg.id, pkg.price_thb);
    });

    creditTransactions.data?.forEach((tx) => {
      if (tx.package_id) {
        const price = packageMap.get(tx.package_id);
        if (price) {
          creditRevenue += price;
        }
      }
    });

    const totalRevenue = memoryRevenue + creditRevenue;

    // Calculate credit stats
    const creditsSold = creditTransactions.data?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    const { data: usedTransactions } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('type', 'use');
    const creditsUsed = Math.abs(usedTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0);

    const { data: refundTransactions } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('type', 'refund');
    const creditsRefunded = refundTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    // Calculate cartoon stats
    const totalCartoons = cartoons.data?.length || 0;
    const completedCartoons = cartoons.data?.filter((c) => c.status === 'completed').length || 0;
    const failedCartoons = cartoons.data?.filter((c) => c.status === 'failed').length || 0;
    const pendingCartoons = cartoons.data?.filter((c) => c.status === 'pending').length || 0;

    // Build recent activity
    const activities: RecentActivity[] = [];

    recentMemories.data?.forEach((m) => {
      activities.push({
        type: 'memory',
        userEmail: userEmailMap.get(m.user_id) || 'Unknown',
        description: `สร้าง Memory: ${m.title || 'ไม่มีชื่อ'}`,
        createdAt: m.created_at,
      });
    });

    recentCredits.data?.forEach((c) => {
      activities.push({
        type: 'credit',
        userEmail: userEmailMap.get(c.user_id) || 'Unknown',
        description: c.description || `ซื้อเครดิต ${c.amount}`,
        createdAt: c.created_at,
      });
    });

    recentCartoons.data?.forEach((c) => {
      activities.push({
        type: 'cartoon',
        userEmail: userEmailMap.get(c.user_id) || 'Unknown',
        description: `สร้างรูปการ์ตูน (${c.status})`,
        createdAt: c.created_at,
      });
    });

    // Sort by date and take top 10
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivity = activities.slice(0, 10);

    return NextResponse.json({
      totalUsers,
      totalMemories: memories.count || 0,
      totalStories: stories.count || 0,
      paidMemories: paidMemories.count || 0,
      failedPayments: failedMemoriesResult.count || 0,
      pendingClaims: pendingClaimsResult.count || 0,
      totalRevenue,
      creditStats: {
        totalSold: creditsSold,
        totalUsed: creditsUsed,
        totalRefunded: creditsRefunded,
      },
      cartoonStats: {
        total: totalCartoons,
        completed: completedCartoons,
        failed: failedCartoons,
        pending: pendingCartoons,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
