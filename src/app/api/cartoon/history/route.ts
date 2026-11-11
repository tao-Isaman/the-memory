import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireUser } from '@/lib/supabase-server';
import { getUserCartoonGenerations } from '@/lib/cartoon';

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const userId = auth.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '9', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);


    const supabase = getSupabaseServiceClient();
    const { generations, total } = await getUserCartoonGenerations(supabase, userId, limit, offset);

    return NextResponse.json({ generations, total });
  } catch (error) {
    console.error('Cartoon history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
