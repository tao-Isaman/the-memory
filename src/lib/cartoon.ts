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

export async function deductCreditsForCartoon(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  // Get current balance
  const { data: userCredits, error: fetchError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError || !userCredits) {
    return { success: false, newBalance: 0, error: 'ไม่พบข้อมูลเครดิต กรุณาซื้อเครดิตก่อน' };
  }

  if (userCredits.balance < CARTOON_CREDIT_COST) {
    return {
      success: false,
      newBalance: userCredits.balance,
      error: `เครดิตไม่เพียงพอ (ต้องการ ${CARTOON_CREDIT_COST} เครดิต, คงเหลือ ${userCredits.balance})`,
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
    return { success: false, newBalance: userCredits.balance, error: 'ไม่สามารถหักเครดิตได้' };
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'use',
    amount: -CARTOON_CREDIT_COST,
    balance_after: newBalance,
    description: `สร้างรูปการ์ตูน (${CARTOON_CREDIT_COST} เครดิต)`,
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
    description: 'คืนเครดิต — สร้างรูปการ์ตูนไม่สำเร็จ',
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
  limit: number = 20
): Promise<CartoonGeneration[]> {
  const { data, error } = await supabase
    .from('cartoon_generations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(toCartoonGeneration);
}
