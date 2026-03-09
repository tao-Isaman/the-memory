import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { SupabaseClient } from '@supabase/supabase-js';

const MEMORY_PRICE_THB = 99; // Price per memory activation
const FETCH_PAGE_SIZE = 1000;

/**
 * Paginate through ALL rows to bypass Supabase's server-side max-rows limit.
 */
async function fetchAllRows(
  supabase: SupabaseClient,
  table: string,
  select: string,
): Promise<Record<string, unknown>[]> {
  const allData: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return allData;
}

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

    // Helper to get date string in UTC+7 (Asia/Bangkok)
    const getThaiDateString = (dateString: string | Date) => {
      const date = new Date(dateString);
      // Add 7 hours to convert UTC to Thai time for grouping
      const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      return thaiDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC' // Treat as UTC since we manually adjusted offset
      });
    };

    // Calculate start date (30 days ago)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

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
      dailyPaidMemories,
      dailyCreditTransactions
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
      // Daily stats data
      supabase.from('memories')
        .select('paid_at')
        .eq('status', 'active')
        .not('stripe_payment_intent_id', 'is', null)
        .gte('paid_at', thirtyDaysAgo.toISOString()),
      supabase.from('credit_transactions')
        .select(`
          created_at,
          package_id,
          credit_packages (
            price_thb
          )
        `)
        .eq('type', 'purchase')
        .gte('created_at', thirtyDaysAgo.toISOString()),
    ]);

    // Demographics: paginate through all user_profiles (bypasses 1000-row server limit)
    const userProfiles = {
      data: await fetchAllRows(
        supabase,
        'user_profiles',
        'gender, birthday, job, relationship_status, occasion_type, profile_credits_claimed',
      ),
    };

    // Calculate total revenue
    // 1. Memory Revenue
    const memoryRevenue = (paidMemories.count || 0) * MEMORY_PRICE_THB;

    // 2. Credit Revenue
    const packageMap = new Map<string, number>();
    creditPackages.data?.forEach((pkg) => {
      packageMap.set(pkg.id, pkg.price_thb);
    });

    let creditRevenue = 0;
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

    // Initialize Date Map (Last 30 Days in UTC+7)
    const dateMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      // Calculate date in UTC-based logic first to avoid local server time confusion
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = getThaiDateString(d);
      dateMap.set(dateKey, 0);
    }

    // 1. User Growth Data
    const userGrowthMap = new Map(dateMap);
    allUsers?.users?.forEach((user) => {
      const createdAt = new Date(user.created_at);
      if (createdAt >= thirtyDaysAgo) {
        const dateString = getThaiDateString(createdAt);
        if (userGrowthMap.has(dateString)) {
          userGrowthMap.set(dateString, userGrowthMap.get(dateString)! + 1);
        }
      }
    });

    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([date, count]) => ({ date, count }));


    // 2. Revenue Data
    const revenueMap = new Map(dateMap);

    // 2.1 Credit Packages Revenue
    if (dailyCreditTransactions.data) {
      dailyCreditTransactions.data.forEach((tx) => {
        const dateString = getThaiDateString(tx.created_at);
        // @ts-ignore
        const price = tx.credit_packages?.price_thb || 0;
        if (revenueMap.has(dateString)) {
          revenueMap.set(dateString, revenueMap.get(dateString)! + price);
        }
      });
    }

    // 2.2 Direct Memory Purchase Revenue
    if (dailyPaidMemories.data) {
      dailyPaidMemories.data.forEach((mem) => {
        if (mem.paid_at) {
          const dateString = getThaiDateString(mem.paid_at);
          if (revenueMap.has(dateString)) {
            revenueMap.set(dateString, revenueMap.get(dateString)! + MEMORY_PRICE_THB);
          }
        }
      });
    }

    const revenueData = Array.from(revenueMap.entries())
      .map(([date, amount]) => ({
        date,
        amount,
      }));

    // Aggregate demographics from user_profiles
    const profiles = userProfiles.data || [];

    // Helper: count by field value, returns a map of value -> count
    const countByField = (field: string) => {
      const map = new Map<string, number>();
      profiles.forEach((p) => {
        const val = (p as Record<string, unknown>)[field] as string | null | undefined;
        const key = val ?? '__null__';
        map.set(key, (map.get(key) || 0) + 1);
      });
      return map;
    };

    // Gender
    const genderMap = countByField('gender');
    const genderFilledCount =
      (genderMap.get('male') || 0) +
      (genderMap.get('female') || 0) +
      (genderMap.get('other') || 0);
    const genderUnspecified = totalUsers - genderFilledCount;
    const genderRaw = [
      { name: 'ชาย', value: genderMap.get('male') || 0 },
      { name: 'หญิง', value: genderMap.get('female') || 0 },
      { name: 'อื่นๆ', value: genderMap.get('other') || 0 },
    ].filter((item) => item.value > 0);
    genderRaw.push({ name: 'ไม่ระบุ', value: Math.max(0, genderUnspecified) });

    // Relationship status
    const relMap = countByField('relationship_status');
    const relFilledCount =
      (relMap.get('single') || 0) +
      (relMap.get('dating') || 0) +
      (relMap.get('married') || 0) +
      (relMap.get('other') || 0);
    const relUnspecified = totalUsers - relFilledCount;
    const relationshipStatusRaw = [
      { name: 'โสด', value: relMap.get('single') || 0 },
      { name: 'มีแฟน', value: relMap.get('dating') || 0 },
      { name: 'แต่งงาน', value: relMap.get('married') || 0 },
      { name: 'อื่นๆ', value: relMap.get('other') || 0 },
    ].filter((item) => item.value > 0);
    relationshipStatusRaw.push({ name: 'ไม่ระบุ', value: Math.max(0, relUnspecified) });

    // Occasion type
    const occMap = countByField('occasion_type');
    const occFilledCount =
      (occMap.get('valentine') || 0) +
      (occMap.get('anniversary') || 0) +
      (occMap.get('birthday') || 0) +
      (occMap.get('other') || 0);
    const occUnspecified = totalUsers - occFilledCount;
    const occasionTypeRaw = [
      { name: 'วาเลนไทน์', value: occMap.get('valentine') || 0 },
      { name: 'วันครบรอบ', value: occMap.get('anniversary') || 0 },
      { name: 'วันเกิด', value: occMap.get('birthday') || 0 },
      { name: 'อื่นๆ', value: occMap.get('other') || 0 },
    ].filter((item) => item.value > 0);
    occasionTypeRaw.push({ name: 'ไม่ระบุ', value: Math.max(0, occUnspecified) });

    // Age groups from birthday
    const ageGroupMap = new Map<string, number>([
      ['<18', 0],
      ['18-24', 0],
      ['25-34', 0],
      ['35-44', 0],
      ['45+', 0],
    ]);
    let ageFilledCount = 0;
    const today = new Date();
    profiles.forEach((p) => {
      if (!p.birthday) return;
      const birth = new Date(p.birthday as string);
      if (isNaN(birth.getTime())) return;
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
      }
      ageFilledCount += 1;
      if (age < 18) ageGroupMap.set('<18', (ageGroupMap.get('<18') || 0) + 1);
      else if (age <= 24) ageGroupMap.set('18-24', (ageGroupMap.get('18-24') || 0) + 1);
      else if (age <= 34) ageGroupMap.set('25-34', (ageGroupMap.get('25-34') || 0) + 1);
      else if (age <= 44) ageGroupMap.set('35-44', (ageGroupMap.get('35-44') || 0) + 1);
      else ageGroupMap.set('45+', (ageGroupMap.get('45+') || 0) + 1);
    });
    const ageGroups = [
      ...Array.from(ageGroupMap.entries()).map(([name, value]) => ({ name, value })),
      { name: 'ไม่ระบุ', value: Math.max(0, totalUsers - ageFilledCount) },
    ];

    // Top jobs (max 8)
    const jobMap = new Map<string, number>();
    profiles.forEach((p) => {
      const job = (p.job as string | null | undefined)?.trim();
      if (!job) return;
      jobMap.set(job, (jobMap.get(job) || 0) + 1);
    });
    const topJobs = Array.from(jobMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    // Profile completion: profile_credits_claimed = true means completed
    const completedProfiles = profiles.filter((p) => p.profile_credits_claimed === true).length;
    const profileCompletion = {
      total: totalUsers,
      completed: completedProfiles,
      rate: totalUsers > 0 ? Math.round((completedProfiles / totalUsers) * 100) : 0,
    };

    const demographics = {
      gender: genderRaw,
      relationshipStatus: relationshipStatusRaw,
      occasionType: occasionTypeRaw,
      ageGroups,
      topJobs,
      profileCompletion,
    };

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
      userGrowth,
      revenueData,
      demographics,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
