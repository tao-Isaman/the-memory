import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const memoryId = request.nextUrl.searchParams.get('memory_id');

  if (!memoryId) {
    return NextResponse.json(
      { error: 'Missing memory_id parameter' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseServiceClient();

    const { data: memory, error } = await supabase
      .from('memories')
      .select('id, status, paid_at')
      .eq('id', memoryId)
      .single();

    if (error || !memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      memoryId: memory.id,
      status: memory.status,
      paidAt: memory.paid_at,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
