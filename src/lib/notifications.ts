// Client-side in-app notification inbox. Reads via the browser Supabase client,
// which carries the user's JWT so RLS returns only their own + broadcast rows.
import { getSupabaseBrowserClient } from './supabase';
import { AppNotification } from '@/types/notification';

// Fetch a wider window than we display so that, after excluding dismissed rows,
// we can still show up to DISPLAY_LIMIT notifications.
const FETCH_WINDOW = 50;
const DISPLAY_LIMIT = 30;

/** Fetch recent, non-dismissed notifications for the current user, merged with read state. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];

  const { data: notifs, error } = await client
    .from('notifications')
    .select('id, title, body, url, icon, type, created_at')
    .order('created_at', { ascending: false })
    .limit(FETCH_WINDOW);
  if (error || !notifs) return [];

  const ids = notifs.map((n) => n.id);
  const readSet = new Set<string>();
  const dismissedSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await client
      .from('notification_reads')
      .select('notification_id, read_at, dismissed_at')
      .in('notification_id', ids);
    for (const r of reads ?? []) {
      if (r.read_at) readSet.add(r.notification_id);
      if (r.dismissed_at) dismissedSet.add(r.notification_id);
    }
  }

  return notifs
    .filter((n) => !dismissedSet.has(n.id))
    .slice(0, DISPLAY_LIMIT)
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      url: n.url,
      icon: n.icon,
      type: n.type,
      createdAt: n.created_at,
      read: readSet.has(n.id),
    }));
}

/** Mark notifications as read for the current user (idempotent). */
export async function markNotificationsRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const client = getSupabaseBrowserClient();
  if (!client) return;
  const rows = ids.map((id) => ({ notification_id: id, user_id: userId }));
  await client
    .from('notification_reads')
    .upsert(rows, { onConflict: 'notification_id,user_id', ignoreDuplicates: true });
}

/**
 * Dismiss notifications from the current user's inbox (delete-from-my-inbox).
 * Records a per-user dismissal so it works for shared broadcast rows too — the
 * underlying notification row is never deleted here.
 */
export async function dismissNotifications(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const client = getSupabaseBrowserClient();
  if (!client) return;
  const now = new Date().toISOString();
  const rows = ids.map((id) => ({ notification_id: id, user_id: userId, dismissed_at: now }));
  // No ignoreDuplicates: an existing (already-read) state row must be UPDATED to set dismissed_at.
  await client.from('notification_reads').upsert(rows, { onConflict: 'notification_id,user_id' });
}
