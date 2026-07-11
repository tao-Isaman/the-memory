import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { CartoonGeneration } from '@/types/cartoon';
import { CARTOON_CREDIT_COST } from '@/lib/constants';

export function toCartoonGeneration(
  row: Database['public']['Tables']['cartoon_generations']['Row']
): CartoonGeneration {
  return {
    id: row.id,
    userId: row.user_id,
    originalImageUrl: row.original_image_url,
    cartoonImageUrl: row.cartoon_image_url,
    creditsUsed: row.credits_used,
    prompt: row.prompt,
    status: row.status as CartoonGeneration['status'],
    createdAt: row.created_at,
  };
}

/**
 * Error codes returned to the client. The UI is localised, so these must stay
 * stable, language-neutral identifiers — components map them to translated copy
 * (messages/<locale>/credits.json → "errors"). Never return prose from here.
 */
export type CartoonCreditError =
  | 'CREDIT_ACCOUNT_NOT_FOUND'
  | 'INSUFFICIENT_CREDITS'
  | 'CREDIT_DEDUCTION_FAILED';

export async function deductCreditsForCartoon(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ success: boolean; newBalance: number; error?: CartoonCreditError }> {
  // Get current balance
  const { data: userCredits, error: fetchError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError || !userCredits) {
    return { success: false, newBalance: 0, error: 'CREDIT_ACCOUNT_NOT_FOUND' };
  }

  if (userCredits.balance < CARTOON_CREDIT_COST) {
    return {
      success: false,
      newBalance: userCredits.balance,
      error: 'INSUFFICIENT_CREDITS',
    };
  }

  const newBalance = userCredits.balance - CARTOON_CREDIT_COST;

  // Deduct credits
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      balance: newBalance,
      total_used: userCredits.total_used + CARTOON_CREDIT_COST,
    })
    .eq('user_id', userId)
    .eq('balance', userCredits.balance); // Optimistic lock

  if (updateError) {
    return { success: false, newBalance: userCredits.balance, error: 'CREDIT_DEDUCTION_FAILED' };
  }

  // Record transaction. `description` is a locale-neutral ledger note (admin-facing);
  // the user-facing label in the credits page is derived from `type`, not from this string.
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'use',
    amount: -CARTOON_CREDIT_COST,
    balance_after: newBalance,
    description: `Cartoon generation (${CARTOON_CREDIT_COST} credits)`,
  });

  return { success: true, newBalance };
}

export async function refundCreditsForCartoon(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!userCredits) return;

  const newBalance = userCredits.balance + CARTOON_CREDIT_COST;

  await supabase
    .from('user_credits')
    .update({
      balance: newBalance,
      total_used: Math.max(0, userCredits.total_used - CARTOON_CREDIT_COST),
    })
    .eq('user_id', userId);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'refund',
    amount: CARTOON_CREDIT_COST,
    balance_after: newBalance,
    description: 'Refund — cartoon generation failed',
  });
}

export async function saveCartoonGeneration(
  supabase: SupabaseClient<Database>,
  data: {
    userId: string;
    originalImageUrl: string | null;
    cartoonImageUrl: string | null;
    creditsUsed: number;
    prompt: string | null;
    status: string;
  }
): Promise<CartoonGeneration | null> {
  const { data: row, error } = await supabase
    .from('cartoon_generations')
    .insert({
      user_id: data.userId,
      original_image_url: data.originalImageUrl,
      cartoon_image_url: data.cartoonImageUrl,
      credits_used: data.creditsUsed,
      prompt: data.prompt,
      status: data.status,
    })
    .select()
    .single();

  if (error || !row) {
    console.error('Error saving cartoon generation:', error);
    return null;
  }

  return toCartoonGeneration(row);
}

export async function getUserCartoonGenerations(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 9,
  offset: number = 0
): Promise<{ generations: CartoonGeneration[]; total: number }> {
  const { count } = await supabase
    .from('cartoon_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  const { data, error } = await supabase
    .from('cartoon_generations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return { generations: [], total: 0 };
  }

  return {
    generations: data.map(toCartoonGeneration),
    total: count || 0,
  };
}
