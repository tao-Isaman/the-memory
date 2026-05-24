// Client-side in-app notification inbox. Reads via the browser Supabase client,
// which carries the user's JWT so RLS returns only their own + broadcast rows.
import { getSupabaseBrowserClient } from './supabase';
import { AppNotification } from '@/types/notification';

const LIMIT = 30;

/** Fetch the recent notifications for the current user, merged with read state. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];

  const { data: notifs, error } = await client
    .from('notifications')
    .select('id, title, body, url, icon, type, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error || !notifs) return [];

  const ids = notifs.map((n) => n.id);
  let readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await client
      .from('notification_reads')
      .select('notification_id')
      .in('notification_id', ids);
    readSet = new Set((reads ?? []).map((r) => r.notification_id));
  }

  return notifs.map((n) => ({
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
