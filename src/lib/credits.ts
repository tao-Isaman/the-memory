import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { CreditPackage, UserCredits, CreditTransaction } from '@/types/credits';

// -- Row Converters --

export function toCreditPackage(
  row: Database['public']['Tables']['credit_packages']['Row']
): CreditPackage {
  return {
    id: row.id,
    name: row.name,
    credits: row.credits,
    priceTHB: row.price_thb,
    priceSatang: row.price_satang,
    discountPercent: row.discount_percent,
    isPopular: row.is_popular,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toUserCredits(
  row: Database['public']['Tables']['user_credits']['Row']
): UserCredits {
  return {
    id: row.id,
    userId: row.user_id,
    balance: row.balance,
    totalPurchased: row.total_purchased,
    totalUsed: row.total_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreditTransaction(
  row: Database['public']['Tables']['credit_transactions']['Row']
): CreditTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as CreditTransaction['type'],
    amount: row.amount,
    balanceAfter: row.balance_after,
    packageId: row.package_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    memoryId: row.memory_id,
    description: row.description,
    createdAt: row.created_at,
  };
}

// -- Queries --

export async function getActivePackages(
  supabase: SupabaseClient<Database>
): Promise<CreditPackage[]> {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.error('Error fetching credit packages:', error);
    return [];
  }

  return data.map(toCreditPackage);
}

export async function getPackageById(
  supabase: SupabaseClient<Database>,
  packageId: string
): Promise<CreditPackage | null> {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (error || !data) {
    return null;
  }

  return toCreditPackage(data);
}

export async function getUserCreditBalance(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.balance;
}

export async function getUserCredits(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return toUserCredits(data);
}

export async function ensureUserCreditsRow(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserCredits> {
  const { data, error } = await supabase
    .from('user_credits')
    .upsert(
      { user_id: userId, balance: 0, total_purchased: 0, total_used: 0 },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error || !data) {
    // Row already exists, fetch it
    const existing = await getUserCredits(supabase, userId);
    if (existing) return existing;
    throw new Error('Failed to ensure user credits row');
  }

  return toUserCredits(data);
}

// -- Mutations --

export async function addCredits(
  supabase: SupabaseClient<Database>,
  userId: string,
  credits: number,
  packageId: string,
  stripeSessionId: string,
  stripePaymentIntentId: string | null
): Promise<{ success: boolean; newBalance: number }> {
  // Idempotency: check if this session already processed
  const { data: existingTx } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('stripe_checkout_session_id', stripeSessionId)
    .limit(1);

  if (existingTx && existingTx.length > 0) {
    console.log(`Credits already added for session ${stripeSessionId}`);
    const balance = await getUserCreditBalance(supabase, userId);
    return { success: true, newBalance: balance };
  }

  // Ensure user has a credits row
  const userCredits = await ensureUserCreditsRow(supabase, userId);

  const newBalance = userCredits.balance + credits;

  // Update balance
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      balance: newBalance,
      total_purchased: userCredits.totalPurchased + credits,
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating credit balance:', updateError);
    return { success: false, newBalance: userCredits.balance };
  }

  // Insert transaction record
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'purchase',
      amount: credits,
      balance_after: newBalance,
      package_id: packageId,
      stripe_checkout_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      description: `ซื้อ ${credits} เครดิต`,
    });

  if (txError) {
    console.error('Error inserting credit transaction:', txError);
  }

  console.log(`Added ${credits} credits for user ${userId}, new balance: ${newBalance}`);
  return { success: true, newBalance };
}

export async function getCreditTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  const { count } = await supabase
    .from('credit_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return { transactions: [], total: 0 };
  }

  return {
    transactions: data.map(toCreditTransaction),
    total: count || 0,
  };
}
