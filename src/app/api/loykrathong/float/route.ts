import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, getBearerUser } from '@/lib/supabase-server';
import { cleanText, maskProfanity } from '@/lib/profanity';
import {
  LK_DESIGNS,
  LK_EVENT,
  LK_FLOAT_COOLDOWN_S,
  LK_NAME_MAX,
  LK_NAME_MIN,
  LK_TO_MAX,
  LK_WISH_MAX,
  eventPhase,
  type KrathongDesign,
} from '@/lib/loykrathong/config';
import { isShellColor } from '@/lib/loykrathong/player';

export const runtime = 'nodejs';

interface Body {
  guestId?: string;
  name?: string;
  design?: string;
  wish?: string;
  toName?: string;
  color?: string;
  room?: number;
  preview?: boolean;
}

/**
 * POST /api/loykrathong/float — float one krathong.
 * Guests allowed (no login). Validates, masks profanity, enforces a per-guest
 * cooldown, inserts with the service role. Realtime delivers the row to every player.
 */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (eventPhase() !== 'open' && !body.preview) {
    return NextResponse.json({ error: 'closed' }, { status: 403 });
  }

  const guestId = typeof body.guestId === 'string' ? body.guestId.slice(0, 64) : '';
  const name = cleanText(String(body.name ?? ''), LK_NAME_MAX);
  const wish = cleanText(String(body.wish ?? ''), LK_WISH_MAX);
  const toName = cleanText(String(body.toName ?? ''), LK_TO_MAX);
  const design = String(body.design ?? '');

  if (!guestId) return NextResponse.json({ error: 'guest' }, { status: 400 });
  if (name.length < LK_NAME_MIN) return NextResponse.json({ error: 'name' }, { status: 400 });
  if (!wish) return NextResponse.json({ error: 'wish' }, { status: 400 });
  if (!(LK_DESIGNS as readonly string[]).includes(design)) {
    return NextResponse.json({ error: 'design' }, { status: 400 });
  }

  const user = await getBearerUser(request);
  const supabase = getSupabaseServiceClient();

  // Cooldown: one krathong per guest per LK_FLOAT_COOLDOWN_S seconds.
  const since = new Date(Date.now() - LK_FLOAT_COOLDOWN_S * 1000).toISOString();
  const { count } = await supabase
    .from('krathong_floats')
    .select('id', { count: 'exact', head: true })
    .eq('guest_id', guestId)
    .gte('created_at', since);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'rate' }, { status: 429 });
  }

  const { data, error } = await supabase
    .from('krathong_floats')
    .insert({
      user_id: user?.id ?? null,
      guest_id: guestId,
      display_name: maskProfanity(name),
      design: design as KrathongDesign,
      wish: maskProfanity(wish),
      to_name: toName ? maskProfanity(toName) : null,
      color: isShellColor(body.color) ? body.color : null,
      room: typeof body.room === 'number' && Number.isFinite(body.room) ? Math.trunc(body.room) : null,
      year: LK_EVENT.year,
    })
    .select('id, display_name, design, wish, to_name, color, created_at')
    .single();

  if (error || !data) {
    console.error('[loykrathong] insert failed', error);
    return NextResponse.json({ error: 'db' }, { status: 500 });
  }

  return NextResponse.json({ float: data });
}
