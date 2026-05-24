import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, getBearerUser, isAdminEmail } from '@/lib/supabase-server';
import { sendPushToSubscriptions, isPushConfigured } from '@/lib/push-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Admin-only: send a notification (broadcast or to one user), optionally also as Web Push.
 * Hardened server-side via JWT — unlike the read-only admin endpoints, this can reach
 * every user, so it must not rely on the client-side AdminLayout guard alone.
 */
export async function POST(request: NextRequest) {
  const user = await getBearerUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 100) : '';
  const message = typeof body?.body === 'string' ? body.body.trim().slice(0, 300) : '';
  const url = typeof body?.url === 'string' && body.url.trim() ? body.url.trim().slice(0, 500) : null;
  const target = body?.target === 'user' ? 'user' : 'all';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const sendPush = body?.sendPush === true;

  if (!title || !message) {
    return NextResponse.json({ error: 'กรุณากรอกหัวข้อและข้อความ' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // Resolve target: null = broadcast to everyone.
  let targetUserId: string | null = null;
  if (target === 'user') {
    if (!email) return NextResponse.json({ error: 'กรุณาระบุอีเมลผู้รับ' }, { status: 400 });
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 10000 });
    const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) return NextResponse.json({ error: 'ไม่พบผู้ใช้อีเมลนี้' }, { status: 404 });
    targetUserId = found.id;
  }

  // 1. Persist the notification (shows in the in-app inbox immediately).
  const { data: inserted, error: insErr } = await supabase
    .from('notifications')
    .insert({
      user_id: targetUserId,
      title,
      body: message,
      url,
      type: 'announcement',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    console.error('notification insert error:', insErr);
    return NextResponse.json({ error: 'บันทึกการแจ้งเตือนไม่สำเร็จ' }, { status: 500 });
  }

  // 2. Web Push (best-effort; skipped gracefully if VAPID keys are absent).
  let pushSent = 0;
  let pushFailed = 0;
  if (sendPush && isPushConfigured()) {
    let query = supabase.from('push_subscriptions').select('endpoint, p256dh, auth');
    if (targetUserId) query = query.eq('user_id', targetUserId);
    const { data: subs } = await query;
    if (subs && subs.length > 0) {
      const result = await sendPushToSubscriptions(supabase, subs, {
        title,
        body: message,
        url: url ?? '/',
      });
      pushSent = result.sent;
      pushFailed = result.failed;
    }
  }

  return NextResponse.json({
    ok: true,
    notificationId: inserted.id,
    target: targetUserId ? 'user' : 'all',
    pushConfigured: isPushConfigured(),
    pushSent,
    pushFailed,
  });
}
