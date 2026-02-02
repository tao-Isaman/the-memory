import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { UserReferral, ReferralConversion } from '@/types/referral';

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

export function generateReferralLink(code: string, baseUrl: string): string {
  return `${baseUrl}?ref=${code}`;
}

export function toUserReferral(row: Database['public']['Tables']['user_referrals']['Row']): UserReferral {
  return {
    id: row.id,
    userId: row.user_id,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    hasUsedReferralDiscount: row.has_used_referral_discount,
    paidReferralCount: row.paid_referral_count,
    pendingDiscountClaims: row.pending_discount_claims,
    totalDiscountsClaimed: row.total_discounts_claimed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toReferralConversion(row: Database['public']['Tables']['referral_conversions']['Row']): ReferralConversion {
  return {
    id: row.id,
    referrerId: row.referrer_id,
    referredId: row.referred_id,
    memoryId: row.memory_id,
    convertedAt: row.converted_at,
    discountClaimed: row.discount_claimed,
    claimedAt: row.claimed_at,
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
        paid_referral_count: 0,
        pending_discount_claims: 0,
        total_discounts_claimed: 0,
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

// Get count of users who signed up with this user's referral code
export async function getReferralSignupCount(
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

// Record a conversion when a referred user makes their first payment
export async function recordReferralConversion(
  supabase: SupabaseClient<Database>,
  referrerId: string,
  referredId: string,
  memoryId: string
): Promise<boolean> {
  // Check if conversion already exists for this referred user
  const { data: existingList } = await supabase
    .from('referral_conversions')
    .select('id')
    .eq('referred_id', referredId)
    .limit(1);

  if (existingList && existingList.length > 0) {
    // Already converted, skip
    console.log(`Conversion already exists for referred user ${referredId}`);
    return true;
  }

  // Create conversion record
  const { error: conversionError } = await supabase
    .from('referral_conversions')
    .insert({
      referrer_id: referrerId,
      referred_id: referredId,
      memory_id: memoryId,
    });

  if (conversionError) {
    console.error('Error creating conversion:', conversionError);
    return false;
  }

  console.log(`Conversion record created: referrer=${referrerId}, referred=${referredId}`);

  // Update referrer's stats - increment paid_referral_count AND pending_discount_claims
  const referral = await getUserReferral(supabase, referrerId);
  if (referral) {
    const { error: updateError } = await supabase
      .from('user_referrals')
      .update({
        paid_referral_count: referral.paidReferralCount + 1,
        pending_discount_claims: referral.pendingDiscountClaims + 1,
      })
      .eq('user_id', referrerId);

    if (updateError) {
      console.error('Error updating referrer stats:', updateError);
      return false;
    }
    console.log(`Referrer ${referrerId} paid_referral_count updated to ${referral.paidReferralCount + 1}, pending_discount_claims updated to ${referral.pendingDiscountClaims + 1}`);
  } else {
    console.error(`Referrer ${referrerId} not found in user_referrals`);
  }

  return true;
}

// Claim a discount (decrement pending, increment claimed)
export async function claimDiscount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ success: boolean; remainingClaims: number }> {
  const referral = await getUserReferral(supabase, userId);

  if (!referral || referral.pendingDiscountClaims <= 0) {
    return { success: false, remainingClaims: 0 };
  }

  const { error } = await supabase
    .from('user_referrals')
    .update({
      pending_discount_claims: referral.pendingDiscountClaims - 1,
      total_discounts_claimed: referral.totalDiscountsClaimed + 1,
    })
    .eq('user_id', userId);

  if (error) {
    return { success: false, remainingClaims: referral.pendingDiscountClaims };
  }

  // Mark one conversion as claimed
  await supabase
    .from('referral_conversions')
    .update({
      discount_claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq('referrer_id', userId)
    .eq('discount_claimed', false)
    .limit(1);

  return {
    success: true,
    remainingClaims: referral.pendingDiscountClaims - 1,
  };
}

// Check if user has made any payment before (for first payment detection)
export async function hasUserPaidBefore(
  supabase: SupabaseClient<Database>,
  userId: string,
  excludeMemoryId?: string
): Promise<boolean> {
  let query = supabase
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (excludeMemoryId) {
    query = query.neq('id', excludeMemoryId);
  }

  const { count, error } = await query;

  if (error) {
    return false;
  }

  return (count || 0) > 0;
}

// Check if user is eligible for referral discount (new user who applied a code)
export async function isEligibleForReferralDiscount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ eligible: boolean; discountAmount: number }> {
  const referral = await getUserReferral(supabase, userId);

  // User must have a referral record with referred_by set and not used discount yet
  if (!referral || !referral.referredBy || referral.hasUsedReferralDiscount) {
    return { eligible: false, discountAmount: 0 };
  }

  // Check if this is their first payment
  const hasPaid = await hasUserPaidBefore(supabase, userId);
  if (hasPaid) {
    return { eligible: false, discountAmount: 0 };
  }

  return { eligible: true, discountAmount: 50 }; // 50 THB discount
}

// Mark referral discount as used after successful payment
export async function markReferralDiscountUsed(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_referrals')
    .update({ has_used_referral_discount: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking referral discount as used:', error);
    return false;
  }

  return true;
}
