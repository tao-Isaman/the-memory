import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getActivePackages } from '@/lib/credits';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const packages = await getActivePackages(supabase);

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
