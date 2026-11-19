import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient, requireAdmin } from '@/lib/supabase-server';
import { emailsByIds } from '@/lib/auth-users';

export const runtime = 'nodejs';

interface SubscriberRow {
  userId: string;
  email: string;
  devices: number;
  lastUsed: string;
}

/** Admin-only: who has enabled push notifications (grouped by user). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const admin = auth.user;

  const supabase = getSupabaseServiceClient();
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('user_id, created_at, last_used_at');
  if (error) {
    console.error('subscribers query error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Map user_id → email.
  // Only the subscribers' own emails (listUsers returns one page: everyone past it showed "unknown").
  const emailById = await emailsByIds(supabase, (subs ?? []).map((s) => s.user_id));

  // Group subscriptions by user (a user may have several devices).
  const byUser = new Map<string, SubscriberRow>();
  for (const s of subs ?? []) {
    if (!s.user_id) continue;
    const existing = byUser.get(s.user_id);
    if (existing) {
      existing.devices += 1;
      if (s.last_used_at > existing.lastUsed) existing.lastUsed = s.last_used_at;
    } else {
      byUser.set(s.user_id, {
        userId: s.user_id,
        email: emailById.get(s.user_id) ?? 'unknown',
        devices: 1,
        lastUsed: s.last_used_at,
      });
    }
  }

  const subscribers = Array.from(byUser.values()).sort((a, b) =>
    b.lastUsed.localeCompare(a.lastUsed),
  );

  return NextResponse.json({
    totalSubscribers: subscribers.length,
    totalDevices: (subs ?? []).length,
    subscribers,
  });
}
