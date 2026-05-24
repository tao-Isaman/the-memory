import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';

let configured: boolean | null = null;

/** Lazily configure web-push from VAPID env. Returns false if keys are absent. */
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@thememory.app';
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/** Whether Web Push is configured (VAPID keys present). */
export function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

interface SubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a push payload to many subscriptions. Best-effort: never throws.
 * Dead endpoints (404/410) are pruned from push_subscriptions.
 */
export async function sendPushToSubscriptions(
  supabase: SupabaseClient,
  subs: SubRow[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!ensureConfigured() || subs.length === 0) return { sent: 0, failed: 0 };

  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );

  if (dead.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', dead);
  }

  return { sent, failed };
}
