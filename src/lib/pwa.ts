// Client-side PWA helpers: device identity, platform detection, standalone
// detection, and install/launch tracking (to our DB + GA4).
import { trackEvent } from './analytics';
import { getSupabaseBrowserClient } from './supabase';

const DEVICE_ID_KEY = 'pwa_device_id';

export type PwaPlatform = 'android' | 'ios' | 'desktop' | 'other';

/** Stable per-device id (persists in localStorage, shared between browser and installed PWA on the same origin). */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as Mac; detect via touch points.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export function detectPlatform(): PwaPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (isIOS()) return 'ios';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'other';
}

/** True when the app is running as an installed PWA (standalone window). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  // iOS Safari exposes navigator.standalone instead of the display-mode media query.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mq || iosStandalone);
}

/** Record a PWA install (definitive) — to our DB and GA4. */
export async function trackInstall(): Promise<void> {
  trackEvent('pwa_installed', { source: detectPlatform() });
  await sendToServer('installed');
}

/** Record a PWA launch in standalone mode (heartbeat used to estimate active installs). */
export async function trackLaunch(): Promise<void> {
  trackEvent('pwa_launch_standalone', { source: detectPlatform() });
  await sendToServer('launch');
}

async function getAccessToken(): Promise<string | null> {
  try {
    const client = getSupabaseBrowserClient();
    const sess = await client?.auth.getSession();
    return sess?.data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function sendToServer(event: 'installed' | 'launch'): Promise<void> {
  try {
    // Attach the user's token when logged in so the install/launch can be linked to them.
    const token = await getAccessToken();
    await fetch('/api/pwa/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      keepalive: true,
      body: JSON.stringify({
        event,
        deviceId: getDeviceId(),
        platform: detectPlatform(),
      }),
    });
  } catch {
    // Analytics is best-effort; never block the UI on it.
  }
}
