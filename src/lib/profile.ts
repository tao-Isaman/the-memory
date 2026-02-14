import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { UserProfile } from '@/types/profile';
import { PROFILE_COMPLETION_CREDITS } from '@/lib/constants';
import { ensureUserCreditsRow } from '@/lib/credits';

// -- Row Converter --

export function toUserProfile(
  row: Database['public']['Tables']['user_profiles']['Row']
): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    phone: row.phone,
    birthday: row.birthday,
    gender: row.gender as UserProfile['gender'],
    job: row.job,
    relationshipStatus: row.relationship_status as UserProfile['relationshipStatus'],
    occasionType: row.occasion_type as UserProfile['occasionType'],
    profileCreditsClaimed: row.profile_credits_claimed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// -- Queries --

export async function getUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return toUserProfile(data);
}

// -- Validation --

export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;

  const fields = [
    profile.phone,
    profile.birthday,
    profile.gender,
    profile.job,
    profile.relationshipStatus,
    profile.occasionType,
  ];

  // All 6 fields must be non-null and non-empty strings
  return fields.every(
    (field) => field !== null && field !== undefined && String(field).trim() !== ''
  );
}

// -- Mutations --

export async function upsertUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: {
    phone?: string | null;
    birthday?: string | null;
    gender?: string | null;
    job?: string | null;
    relationshipStatus?: string | null;
    occasionType?: string | null;
  }
): Promise<UserProfile | null> {
  const { data: row, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        phone: data.phone ?? undefined,
        birthday: data.birthday ?? undefined,
        gender: data.gender ?? undefined,
        job: data.job ?? undefined,
        relationship_status: data.relationshipStatus ?? undefined,
        occasion_type: data.occasionType ?? undefined,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error || !row) {
    console.error('Error upserting user profile:', error);
    return null;
  }

  return toUserProfile(row);
}

// -- Credit Grant --

export async function grantProfileCredits(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{
  success: boolean;
  alreadyClaimed: boolean;
  newBalance?: number;
  error?: string;
}> {
  // 1. Get profile and check if credits already claimed
  const profile = await getUserProfile(supabase, userId);

  if (!profile) {
    return { success: false, alreadyClaimed: false, error: 'ไม่พบข้อมูลโปรไฟล์' };
  }

  if (profile.profileCreditsClaimed) {
    return { success: true, alreadyClaimed: true };
  }

  // 2. Verify profile is complete
  if (!isProfileComplete(profile)) {
    return {
      success: false,
      alreadyClaimed: false,
      error: 'กรุณากรอกข้อมูลโปรไฟล์ให้ครบทุกช่อง',
    };
  }

  // 3. Ensure user has a credits row
  const userCredits = await ensureUserCreditsRow(supabase, userId);

  // 4. Calculate new balance
  const newBalance = userCredits.balance + PROFILE_COMPLETION_CREDITS;

  // 5. Update user_credits (balance and total_purchased)
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      balance: newBalance,
      total_purchased: userCredits.totalPurchased + PROFILE_COMPLETION_CREDITS,
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating credit balance for profile:', updateError);
    return { success: false, alreadyClaimed: false, error: 'ไม่สามารถเพิ่มเครดิตได้' };
  }

  // 6. Insert credit transaction
  const { error: txError } = await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'purchase',
    amount: PROFILE_COMPLETION_CREDITS,
    balance_after: newBalance,
    description: 'โบนัสกรอกโปรไฟล์ครบ (10 เครดิต)',
  });

  if (txError) {
    console.error('Error inserting credit transaction for profile:', txError);
  }

  // 7. Set profile_credits_claimed to true with optimistic lock
  const { error: claimError } = await supabase
    .from('user_profiles')
    .update({ profile_credits_claimed: true })
    .eq('user_id', userId)
    .eq('profile_credits_claimed', false); // Optimistic lock

  if (claimError) {
    console.error('Error marking profile credits as claimed:', claimError);
    // This could mean another request already claimed it, but we'll consider it a success
    // since the credits were added
  }

  console.log(
    `Granted ${PROFILE_COMPLETION_CREDITS} credits for profile completion to user ${userId}, new balance: ${newBalance}`
  );

  return { success: true, alreadyClaimed: false, newBalance };
}
