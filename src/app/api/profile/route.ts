import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { UserProfile } from '@/types/profile';
import { Database } from '@/types/database';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({
        profile: null,
        isComplete: false,
        creditsClaimed: false,
      });
    }

    const convertedProfile = toUserProfile(profile);

    return NextResponse.json({
      profile: convertedProfile,
      isComplete: isProfileComplete(convertedProfile),
      creditsClaimed: profile.profile_credits_claimed,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      phone,
      birthday,
      gender,
      job,
      relationshipStatus,
      occasionType,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Prepare update object (only include fields that are provided)
    const updateData: any = { user_id: userId };
    if (phone !== undefined) updateData.phone = phone;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (gender !== undefined) updateData.gender = gender;
    if (job !== undefined) updateData.job = job;
    if (relationshipStatus !== undefined) updateData.relationship_status = relationshipStatus;
    if (occasionType !== undefined) updateData.occasion_type = occasionType;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error || !profile) {
      console.error('Error creating/updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(toUserProfile(profile));
  } catch (error) {
    console.error('Error processing profile request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
