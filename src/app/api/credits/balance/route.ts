import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getUserCredits } from '@/lib/credits';

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
    const userCredits = await getUserCredits(supabase, userId);

    return NextResponse.json({
      balance: userCredits?.balance ?? 0,
      totalPurchased: userCredits?.totalPurchased ?? 0,
      totalUsed: userCredits?.totalUsed ?? 0,
    });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
