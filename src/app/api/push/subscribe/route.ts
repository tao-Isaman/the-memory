import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, getBearerUser } from '@/lib/supabase-server';

export const runtime = 'nodejs';

/** Save a Web Push subscription for the authenticated user. */
export async function POST(request: NextRequest) {
  const user = await getBearerUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body?.p256dh === 'string' ? body.p256dh : '';
  const auth = typeof body?.auth === 'string' ? body.auth : '';
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  // Upsert by endpoint (reassigns the device to this user on re-login).
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: typeof body?.userAgent === 'string' ? body.userAgent.slice(0, 300) : null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );

  if (error) {
    console.error('push subscribe error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Remove a Web Push subscription for the authenticated user. */
export async function DELETE(request: NextRequest) {
  const user = await getBearerUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  if (!endpoint) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id);

  if (error) {
    console.error('push unsubscribe error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
