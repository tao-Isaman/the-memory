import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' ? Math.floor(value) : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Records recipient view sessions for /memory/[id]. Open endpoint (viewers are
 * not logged in) — low-stakes engagement analytics, written via the service role.
 *   - action 'start'    → create the session row (client-generated viewId).
 *   - action 'progress' → update furthest story / completion / dwell mid-session.
 *   - action 'end'      → final flush on tab close / navigation (sendBeacon).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const action = body?.action;
    const viewId = typeof body?.viewId === 'string' ? body.viewId : '';

    if (!viewId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const now = new Date().toISOString();

    if (action === 'start') {
      const memoryId = typeof body?.memoryId === 'string' ? body.memoryId : '';
      const viewerId = typeof body?.viewerId === 'string' ? body.viewerId.slice(0, 100) : '';
      if (!memoryId || !viewerId) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }

      const { error } = await supabase.from('memory_views').upsert(
        {
          id: viewId,
          memory_id: memoryId,
          viewer_id: viewerId,
          is_owner: body?.isOwner === true,
          stories_total: clampInt(body?.storiesTotal, 0, 1000),
          started_at: now,
          last_event_at: now,
        },
        { onConflict: 'id' },
      );

      if (error) {
        console.error('memory_views start error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'progress' || action === 'end') {
      const { error } = await supabase
        .from('memory_views')
        .update({
          max_story_reached: clampInt(body?.maxStoryReached, 0, 1000),
          completed: body?.completed === true,
          duration_seconds: clampInt(body?.durationSeconds, 0, 86400),
          last_event_at: now,
        })
        .eq('id', viewId);

      if (error) {
        console.error('memory_views update error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('memory_views error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
