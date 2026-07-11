import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

/** Must match the client clamp — a single session can't legitimately run longer. */
const MAX_SESSION_SECONDS = 12 * 60 * 60;
const MAX_PAGE_VIEWS = 5000;

/**
 * Time-in-app tracking. One app_sessions row per visit, created on `start` and advanced by
 * `heartbeat` / `end`.
 *
 * The user is derived from the access token in the BODY (sendBeacon cannot set an
 * Authorization header) — a client-supplied user id is never trusted, or anyone could
 * inflate another account's engagement.
 *
 * Best-effort: always answers 200 so a failed beacon never surfaces as a console error
 * in the user's app.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, token } = body ?? {};

    if (!sessionId || !token || !action) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const supabase = getSupabaseServiceClient();

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (authError || !userId) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const now = new Date().toISOString();

    if (action === 'start') {
      const { error } = await supabase.from('app_sessions').insert({
        id: sessionId,
        user_id: userId,
        started_at: now,
        last_event_at: now,
        duration_seconds: 0,
        page_views: 1,
        locale: typeof body.locale === 'string' ? body.locale.slice(0, 8) : null,
        is_pwa: body.isPwa === true,
      });
      // A duplicate id just means the beacon was retried — not an error worth surfacing.
      if (error && error.code !== '23505') {
        console.error('app_sessions insert error:', error);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'heartbeat' || action === 'end') {
      const incoming = Math.min(
        Math.max(Math.round(Number(body.durationSeconds) || 0), 0),
        MAX_SESSION_SECONDS,
      );
      const pageViews = Math.min(
        Math.max(Math.round(Number(body.pageViews) || 1), 1),
        MAX_PAGE_VIEWS,
      );

      // Monotonic: never let a late/out-of-order beacon shrink a session. The row is
      // scoped to user_id too, so a stolen session id can't be advanced by someone else.
      const { data: existing } = await supabase
        .from('app_sessions')
        .select('duration_seconds')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existing) return NextResponse.json({ ok: false }, { status: 200 });

      const { error } = await supabase
        .from('app_sessions')
        .update({
          duration_seconds: Math.max(existing.duration_seconds ?? 0, incoming),
          page_views: pageViews,
          last_event_at: now,
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) console.error('app_sessions update error:', error);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false }, { status: 200 });
  } catch (error) {
    console.error('app session tracking error:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
