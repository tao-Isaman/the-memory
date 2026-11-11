import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireUser } from '@/lib/supabase-server';
import { getCreditTransactions } from '@/lib/credits';

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);


    const supabase = getSupabaseServiceClient();
    const { transactions, total } = await getCreditTransactions(supabase, userId, limit, offset);

    return NextResponse.json({ transactions, total });
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
