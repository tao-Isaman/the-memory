// Client-side Web Push helpers: permission, subscribe/unsubscribe, state.
// The service worker is registered elsewhere (PWAInstallPrompt); here we use it.
import { getSupabaseBrowserClient } from './supabase';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function authHeader(): Promise<Record<string, string>> {
  const client = getSupabaseBrowserClient();
  const sess = await client?.auth.getSession();
  const token = sess?.data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

export async function getPushState(): Promise<{ permission: PushPermissionState; subscribed: boolean }> {
  if (!isPushSupported()) return { permission: 'unsupported', subscribed: false };
  const permission = Notification.permission as PushPermissionState;
  let subscribed = false;
  try {
    const reg = await navigator.serviceWorker.ready;
    subscribed = !!(await reg.pushManager.getSubscription());
  } catch {
    /* ignore */
  }
  return { permission, subscribed };
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: 'unsupported' };
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return { ok: false, error: 'not-configured' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, error: 'denied' };

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    }
    const json = sub.toJSON();
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        userAgent: navigator.userAgent,
      }),
    });
    if (!res.ok) return { ok: false, error: 'save-failed' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'subscribe-failed' };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
  } catch {
    /* best-effort */
  }
}
