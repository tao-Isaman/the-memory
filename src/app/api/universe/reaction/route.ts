import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, getBearerUser } from '@/lib/supabase-server';
import { sendPushToSubscriptions, isPushConfigured } from '@/lib/push-server';
import { REACTION_EMOJIS } from '@/lib/reactions';

export const runtime = 'nodejs';

/** Story types that appear in the universe feed (kept in sync with get_universe_feed). */
const FEED_STORY_TYPES = ['image', 'text-image', 'text'];

/**
 * Universe (จักรวาล) reaction toggle — a logged-in user reacts to a feed story with an
 * emoji. Same emoji again → toggles OFF (soft delete); a different emoji → switches.
 * The story's owner gets an in-app notification + Web Push at most ONCE per
 * (story, user) — re-toggling never re-notifies (anti notification spam).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getBearerUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const storyId = typeof body?.storyId === 'string' ? body.storyId : '';
    const emoji = typeof body?.emoji === 'string' ? body.emoji : '';
    if (!storyId || !(REACTION_EMOJIS as readonly string[]).includes(emoji)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // 1. The story must actually be visible in the feed: a feed-eligible type, inside an
    //    active + shared memory, and not the caller's own.
    const { data: story } = await supabase
      .from('stories')
      .select('id, memory_id, type')
      .eq('id', storyId)
      .single();
    if (!story || !FEED_STORY_TYPES.includes(story.type)) {
      return NextResponse.json({ error: 'Story not available' }, { status: 404 });
    }

    const { data: memory } = await supabase
      .from('memories')
      .select('id, user_id, title, status, share_to_universe')
      .eq('id', story.memory_id)
      .single();
    if (!memory || memory.status !== 'active' || !memory.share_to_universe) {
      return NextResponse.json({ error: 'Story not available' }, { status: 404 });
    }
    if (memory.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot react to your own story' }, { status: 400 });
    }

    // 2. Toggle. ONE row per (story, user) forever: removed_at flips, emoji switches.
    const { data: existing } = await supabase
      .from('universe_reactions')
      .select('id, emoji, removed_at, notified_at')
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .maybeSingle();

    const now = new Date().toISOString();
    let action: 'added' | 'removed';
    let reactionId: string;
    let shouldNotify = false;

    if (!existing) {
      const { data: inserted, error: insErr } = await supabase
        .from('universe_reactions')
        .insert({ story_id: storyId, memory_id: memory.id, user_id: user.id, emoji })
        .select('id')
        .single();
      if (insErr || !inserted) {
        // 23505 = unique violation: a concurrent first-reaction won the race — treat as added.
        if ((insErr as { code?: string } | null)?.code === '23505') {
          return NextResponse.json({ ok: true, action: 'added', emoji });
        }
        console.error('universe_reactions insert error:', insErr);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      action = 'added';
      reactionId = inserted.id;
      shouldNotify = true;
    } else if (!existing.removed_at && existing.emoji === emoji) {
      const { error: updErr } = await supabase
        .from('universe_reactions')
        .update({ removed_at: now, updated_at: now })
        .eq('id', existing.id);
      if (updErr) {
        console.error('universe_reactions remove error:', updErr);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      action = 'removed';
      reactionId = existing.id;
    } else {
      // Re-react after toggle-off, or switch to a different emoji.
      const { error: updErr } = await supabase
        .from('universe_reactions')
        .update({ emoji, removed_at: null, updated_at: now })
        .eq('id', existing.id);
      if (updErr) {
        console.error('universe_reactions update error:', updErr);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      action = 'added';
      reactionId = existing.id;
      shouldNotify = existing.notified_at === null;
    }

    // 3. Notify the owner (best-effort — failures here never fail the reaction itself).
    if (action === 'added' && shouldNotify) {
      const reactorName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        'เพื่อนในจักรวาล';
      const title = `${emoji} มีคนชอบเรื่องราวของคุณในจักรวาล`;
      const notifBody = `${reactorName} กดรีแอคชันให้เรื่องราวในความทรงจำ "${memory.title}"`;
      const url = `/memory/${memory.id}`;

      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: memory.user_id,
        title,
        body: notifBody,
        url,
        type: 'universe_reaction',
        created_by: user.id,
      });
      if (notifErr) {
        console.error('universe reaction notification insert error:', notifErr);
      } else {
        // Mark notified only on success so a failed attempt can retry on a future re-react.
        await supabase
          .from('universe_reactions')
          .update({ notified_at: now })
          .eq('id', reactionId);

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
    }

    return NextResponse.json({ ok: true, action, emoji });
  } catch (error) {
    console.error('universe reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
