import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Batch query all data in parallel
    const [
      { data: authData, error: authError },
      { data: packages },
      { data: transactions },
      { data: userCredits },
    ] = await Promise.all([
      supabase.auth.admin.listUsers({ perPage: 10000 }),
      supabase.from('credit_packages').select('*').order('sort_order'),
      supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('user_credits').select('*').order('balance', { ascending: false }).limit(20),
    ]);

    if (authError) {
      throw authError;
    }

    // Build user email map
    const authUsers = authData?.users || [];
    const userEmailMap = new Map(authUsers.map((u) => [u.id, u.email || 'No email']));

    // Calculate package sales
    const { data: allTransactions } = await supabase
      .from('credit_transactions')
      .select('package_id, type, amount');

    const packageSalesMap = new Map<string, number>();
    for (const tx of allTransactions || []) {
      if (tx.type === 'purchase' && tx.package_id) {
        const count = packageSalesMap.get(tx.package_id) || 0;
        packageSalesMap.set(tx.package_id, count + 1);
      }
    }

    // Build packages with sales count
    const packagesWithSales = (packages || []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      priceTHB: pkg.price_thb,
      credits: pkg.credits,
      salesCount: packageSalesMap.get(pkg.id) || 0,
      revenue: (packageSalesMap.get(pkg.id) || 0) * pkg.price_thb,
    }));

    // Build recent transactions with user email
    const recentTransactions = (transactions || []).map((tx) => ({
      id: tx.id,
      userEmail: userEmailMap.get(tx.user_id) || 'Unknown',
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balance_after,
      description: tx.description,
      createdAt: tx.created_at,
    }));

    // Build top users with email
    const topUsers = (userCredits || []).map((uc) => ({
      userEmail: userEmailMap.get(uc.user_id) || 'Unknown',
      balance: uc.balance,
      totalPurchased: uc.total_purchased,
      totalUsed: uc.total_used,
    }));

    // Calculate summary stats
    const allTx = allTransactions || [];
    const totalCreditsSold = allTx
      .filter((tx) => tx.type === 'purchase')
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    const totalCreditsUsed = allTx
      .filter((tx) => tx.type === 'use')
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    const totalCreditsRefunded = allTx
      .filter((tx) => tx.type === 'refund')
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    const totalRevenueTHB = packagesWithSales.reduce((sum, pkg) => sum + pkg.revenue, 0);

    const summary = {
      totalCreditsSold,
      totalCreditsUsed,
      totalCreditsRefunded,
      totalRevenueTHB,
    };

    return NextResponse.json({
      packages: packagesWithSales,
      recentTransactions,
      topUsers,
      summary,
    });
  } catch (error) {
    console.error('Admin credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
