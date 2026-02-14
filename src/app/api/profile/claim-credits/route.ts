import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { ensureUserCreditsRow } from '@/lib/credits';
import { PROFILE_COMPLETION_CREDITS } from '@/lib/constants';
import { Database } from '@/types/database';
import { UserProfile } from '@/types/profile';

// Helper function to convert database row to UserProfile
function toUserProfile(
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

// Helper function to check if profile is complete
function isProfileComplete(profile: UserProfile): boolean {
  return !!(
    profile.phone &&
    profile.phone.trim() !== '' &&
    profile.birthday &&
    profile.birthday.trim() !== '' &&
    profile.gender &&
    profile.job &&
    profile.job.trim() !== '' &&
    profile.relationshipStatus &&
    profile.occasionType
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = toUserProfile(profileData);

    // Check if credits already claimed
    if (profile.profileCreditsClaimed) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
      });
    }

    // Check if profile is complete
    if (!isProfileComplete(profile)) {
      return NextResponse.json(
        { error: 'Profile is not complete' },
        { status: 400 }
      );
    }

    // Ensure user has a credits row
    await ensureUserCreditsRow(supabase, userId);

    // Get current balance
    const { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance, total_purchased')
      .eq('user_id', userId)
      .single();

    if (creditsError || !creditsData) {
      return NextResponse.json(
        { error: 'Failed to fetch credit balance' },
        { status: 500 }
      );
    }

    const currentBalance = creditsData.balance;
    const currentTotalPurchased = creditsData.total_purchased;
    const newBalance = currentBalance + PROFILE_COMPLETION_CREDITS;

    // Update user credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        total_purchased: currentTotalPurchased + PROFILE_COMPLETION_CREDITS,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating credit balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to grant credits' },
        { status: 500 }
      );
    }

    // Insert credit transaction
    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: PROFILE_COMPLETION_CREDITS,
        balance_after: newBalance,
        description: `โบนัสกรอกโปรไฟล์ครบ (${PROFILE_COMPLETION_CREDITS} เครดิต)`,
      });

    if (txError) {
      console.error('Error inserting credit transaction:', txError);
    }

    // Mark profile credits as claimed with optimistic lock
    const { error: claimError } = await supabase
      .from('user_profiles')
      .update({ profile_credits_claimed: true })
      .eq('user_id', userId)
      .eq('profile_credits_claimed', false);

    if (claimError) {
      console.error('Error marking credits as claimed:', claimError);
      // Don't fail the request if this fails - credits were already granted
    }

    console.log(
      `Granted ${PROFILE_COMPLETION_CREDITS} credits for profile completion to user ${userId}, new balance: ${newBalance}`
    );

    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      newBalance,
      creditsGranted: PROFILE_COMPLETION_CREDITS,
    });
  } catch (error) {
    console.error('Error claiming profile credits:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
