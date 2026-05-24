import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, getBearerUser } from '@/lib/supabase-server';

const VALID_PLATFORMS = ['android', 'ios', 'desktop', 'other'];

/**
 * Records a PWA install or standalone-launch heartbeat.
 * Open endpoint (recipients/viewers are not logged in) — low-stakes analytics.
 * Deduped by device_id via upsert.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const event = body?.event;
    const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.slice(0, 100) : '';
    const platform = VALID_PLATFORMS.includes(body?.platform) ? body.platform : 'other';

    if (!deviceId || (event !== 'installed' && event !== 'launch')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const now = new Date().toISOString();

    // Link the install to the logged-in user when a valid token is sent. Anonymous
    // viewers send none → user_id stays null; an existing link is preserved on update
    // (user_id is only included in the record when we actually have one).
    const user = await getBearerUser(request);

    // Both events refresh last_seen_at; only an explicit install sets installed_at.
    // (On a brand-new row, installed_at falls back to the DB default of NOW().)
    const record = {
      device_id: deviceId,
      platform,
      last_seen_at: now,
      ...(user ? { user_id: user.id } : {}),
      ...(event === 'installed' ? { installed_at: now } : {}),
    };

    const { error } = await supabase
      .from('pwa_installs')
      .upsert(record, { onConflict: 'device_id' });

    if (error) {
      console.error('PWA track error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PWA track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
