import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Batch query all data in parallel.
    // Package sales / summary totals come from the get_credit_stats RPC: this used to
    // fetch every credit_transaction with an unbounded .select() and reduce in JS, but
    // PostgREST truncates that (default 1000 rows, and there are thousands), so real
    // purchases — a tiny fraction of rows next to free 'bonus' grants — went missing.
    const [
      { data: authData, error: authError },
      { data: packages },
      { data: transactions },
      { data: recentPurchaseRows },
      { data: userCredits },
      { data: stats, error: statsError },
    ] = await Promise.all([
      supabase.auth.admin.listUsers({ perPage: 10000 }),
      supabase.from('credit_packages').select('*').order('sort_order'),
      supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      // Real purchases only — the all-types feed above is dominated by free bonuses,
      // so a paid package sale can sit hundreds of rows deep and never be seen.
      supabase
        .from('credit_transactions')
        .select('*')
        .eq('type', 'purchase')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('user_credits').select('*').order('balance', { ascending: false }).limit(20),
      supabase.rpc('get_credit_stats'),
    ]);

    if (authError) throw authError;
    if (statsError) throw statsError;

    // Build user email map
    const authUsers = authData?.users || [];
    const userEmailMap = new Map(authUsers.map((u) => [u.id, u.email || 'No email']));

    const packageSales = stats?.packageSales ?? {};

    const packagesWithSales = (packages || []).map((pkg) => {
      const salesCount = packageSales[pkg.id] ?? 0;
      return {
        id: pkg.id,
        name: pkg.name,
        priceTHB: pkg.price_thb,
        credits: pkg.credits,
        salesCount,
        revenue: salesCount * pkg.price_thb,
      };
    });

    const toTx = (tx: {
      id: string;
      user_id: string;
      type: string;
      amount: number;
      balance_after: number;
      description: string | null;
      created_at: string;
    }) => ({
      id: tx.id,
      userEmail: userEmailMap.get(tx.user_id) || 'Unknown',
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balance_after,
      description: tx.description,
      createdAt: tx.created_at,
    });

    const recentTransactions = (transactions || []).map(toTx);
    const recentPurchases = (recentPurchaseRows || []).map(toTx);

    const topUsers = (userCredits || []).map((uc) => ({
      userEmail: userEmailMap.get(uc.user_id) || 'Unknown',
      balance: uc.balance,
      totalPurchased: uc.total_purchased,
      totalUsed: uc.total_used,
    }));

    const summary = {
      totalCreditsSold: Number(stats?.totalCreditsSold ?? 0),
      totalCreditsUsed: Number(stats?.totalCreditsUsed ?? 0),
      totalCreditsRefunded: Number(stats?.totalCreditsRefunded ?? 0),
      totalCreditsBonus: Number(stats?.totalCreditsBonus ?? 0),
      totalRevenueTHB: packagesWithSales.reduce((sum, pkg) => sum + pkg.revenue, 0),
    };

    return NextResponse.json({
      packages: packagesWithSales,
      recentTransactions,
      recentPurchases,
      topUsers,
      summary,
    });
  } catch (error) {
    console.error('Admin credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
