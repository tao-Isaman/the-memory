import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { UserReferral } from '@/types/referral';

// Characters for referral code (no confusing chars: 0, O, 1, I, L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export function toUserReferral(row: Database['public']['Tables']['user_referrals']['Row']): UserReferral {
  return {
    id: row.id,
    userId: row.user_id,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    freeMemoryUsed: row.free_memory_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserReferral(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserReferral | null> {
  const { data, error } = await supabase
    .from('user_referrals')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return toUserReferral(data);
}

export async function getReferralByCode(
  supabase: SupabaseClient<Database>,
  code: string
): Promise<UserReferral | null> {
  const { data, error } = await supabase
    .from('user_referrals')
    .select('*')
    .eq('referral_code', code.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  return toUserReferral(data);
}

export async function createUserReferral(
  supabase: SupabaseClient<Database>,
  userId: string,
  referredByUserId?: string
): Promise<UserReferral | null> {
  // Generate unique code with retry logic
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const code = generateReferralCode();

    const { data, error } = await supabase
      .from('user_referrals')
      .insert({
        user_id: userId,
        referral_code: code,
        referred_by: referredByUserId || null,
        free_memory_used: false,
      })
      .select()
      .single();

    if (!error && data) {
      return toUserReferral(data);
    }

    // If error is not a unique constraint violation, throw
    if (error && !error.message.includes('unique')) {
      console.error('Error creating referral:', error);
      return null;
    }

    attempts++;
  }

  return null;
}

export async function getReferralCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('user_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', userId);

  if (error) {
    return 0;
  }

  return count || 0;
}

export async function markFreeMemoryUsed(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_referrals')
    .update({ free_memory_used: true })
    .eq('user_id', userId);

  return !error;
}

export async function activateMemoryForFree(
  supabase: SupabaseClient<Database>,
  memoryId: string,
  userId: string
): Promise<boolean> {
  // Update memory status to active
  const { error } = await supabase
    .from('memories')
    .update({
      status: 'active',
      paid_at: new Date().toISOString(),
    })
    .eq('id', memoryId)
    .eq('user_id', userId);

  return !error;
}
