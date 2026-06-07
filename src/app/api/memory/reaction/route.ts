import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { sendPushToSubscriptions, isPushConfigured } from '@/lib/push-server';
import { REACTION_EMOJIS, REACTION_MESSAGE_MAX } from '@/lib/reactions';

export const runtime = 'nodejs';

const RATE_LIMIT = 20;                       // max reactions per viewer per memory ...
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;  // ... per 24h (anti-spam)

/**
 * Reaction / reply loop — anonymous recipients send a ❤️ (and an optional short reply)
 * from the memory ending screen. Open endpoint (viewers aren't logged in); writes via the
 * service role. On a new reaction the memory's owner gets an in-app notification + Web Push
 * and returns to see it, closing the recipient→creator loop.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const memoryId = typeof body?.memoryId === 'string' ? body.memoryId : '';
    const viewerId = typeof body?.viewerId === 'string' ? body.viewerId.slice(0, 100) : '';
    const rawEmoji = typeof body?.emoji === 'string' ? body.emoji : '❤️';
    const emoji = (REACTION_EMOJIS as readonly string[]).includes(rawEmoji) ? rawEmoji : '❤️';
    const messageRaw =
      typeof body?.message === 'string' ? body.message.trim().slice(0, REACTION_MESSAGE_MAX) : '';
    const message = messageRaw || null;
    const isOwner = body?.isOwner === true;

    if (!memoryId || !viewerId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // 1. The memory must exist and be active (don't accept reactions on drafts / unknown ids).
    const { data: memory } = await supabase
      .from('memories')
      .select('id, user_id, title, status')
      .eq('id', memoryId)
      .single();
    if (!memory || memory.status !== 'active') {
      return NextResponse.json({ error: 'Memory not available' }, { status: 404 });
    }

    // 2. Rate limit per viewer per memory.
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count: recentCount } = await supabase
      .from('memory_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('memory_id', memoryId)
      .eq('viewer_id', viewerId)
      .gte('created_at', since);
    if ((recentCount ?? 0) >= RATE_LIMIT) {
      return NextResponse.json({ error: 'Too many reactions' }, { status: 429 });
    }

    // 3. Dedup a pure reaction (no message): one per viewer/emoji/memory — repeated taps
    //    are idempotent and must not re-notify the owner.
    if (!message) {
      const { data: existing } = await supabase
        .from('memory_reactions')
        .select('id')
        .eq('memory_id', memoryId)
        .eq('viewer_id', viewerId)
        .eq('emoji', emoji)
        .is('message', null)
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    }

    // 4. Store the reaction.
    const { error: insErr } = await supabase.from('memory_reactions').insert({
      memory_id: memoryId,
      viewer_id: viewerId,
      emoji,
      message,
      is_owner: isOwner,
    });
    if (insErr) {
      console.error('memory_reactions insert error:', insErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 5. Notify the owner (skip owner self-reactions). Best-effort — failures here never
    //    fail the reaction itself.
    if (!isOwner && memory.user_id) {
      const title = message
        ? '💌 มีคนตอบกลับความทรงจำของคุณ'
        : `${emoji} มีคนส่งหัวใจให้ความทรงจำของคุณ`;
      const notifBody = message ? message : `"${memory.title}" — แตะเพื่อเปิดดูอีกครั้ง`;
      const url = `/memory/${memoryId}`;

      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: memory.user_id,
        title,
        body: notifBody,
        url,
        type: 'reaction',
      });
      if (notifErr) console.error('reaction notification insert error:', notifErr);

      if (isPushConfigured()) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', memory.user_id);
        if (subs && subs.length > 0) {
          await sendPushToSubscriptions(supabase, subs, { title, body: notifBody, url });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('memory_reactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
