'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  newAppSessionId,
  sendAppSessionEvent,
  isStandalone,
} from '@/lib/app-session';

const HEARTBEAT_MS = 30_000;
/** A single session can't legitimately exceed this. Guards against clock skew and a
 *  machine waking from sleep with a stale timestamp. */
const MAX_SESSION_SECONDS = 12 * 60 * 60;

/**
 * Records ONE app_sessions row per visit to the signed-in app, kept alive by heartbeats
 * and flushed with sendBeacon on unload.
 *
 * Only FOREGROUND time is counted (Page Visibility API). Counting wall-clock instead
 * would let a single forgotten background tab report hours of "engagement" and quietly
 * make the whole metric worthless.
 */
export function useAppSessionTracking() {
  const { user } = useAuth();
  const locale = useLocale();
  const pathname = usePathname();

  const sessionIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');
  // Foreground time already banked, plus the open interval since the tab became visible.
  const bankedMsRef = useRef(0);
  const visibleSinceRef = useRef<number | null>(null);
  const pageViewsRef = useRef(1);
  const endedRef = useRef(false);

  const foregroundSeconds = () => {
    let ms = bankedMsRef.current;
    if (visibleSinceRef.current !== null) ms += Date.now() - visibleSinceRef.current;
    return Math.min(Math.max(Math.round(ms / 1000), 0), MAX_SESSION_SECONDS);
  };

  // Start a session once the user is known.
  useEffect(() => {
    if (!user || sessionIdRef.current) return;
    let cancelled = false;

    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = (await supabase?.auth.getSession()) ?? { data: null };
      const token = data?.session?.access_token ?? '';
      if (cancelled || !token) return;

      const sessionId = newAppSessionId();
      sessionIdRef.current = sessionId;
      tokenRef.current = token;
      bankedMsRef.current = 0;
      visibleSinceRef.current = document.visibilityState === 'visible' ? Date.now() : null;

      sendAppSessionEvent({
        action: 'start',
        sessionId,
        token,
        locale,
        isPwa: isStandalone(),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, locale]);

  // Heartbeats, visibility accounting, and the unload flush.
  useEffect(() => {
    if (!user) return;

    const flush = (action: 'heartbeat' | 'end', useBeacon = false) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || !tokenRef.current) return;
      if (action === 'end') {
        if (endedRef.current) return;
        endedRef.current = true;
      }
      sendAppSessionEvent(
        {
          action,
          sessionId,
          token: tokenRef.current,
          durationSeconds: foregroundSeconds(),
          pageViews: pageViewsRef.current,
        },
        useBeacon,
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Bank the interval that just ended, then stop the clock.
        if (visibleSinceRef.current !== null) {
          bankedMsRef.current += Date.now() - visibleSinceRef.current;
          visibleSinceRef.current = null;
        }
        // Mobile browsers often kill a backgrounded tab without firing pagehide,
        // so treat "hidden" as a durable checkpoint.
        flush('heartbeat', true);
      } else {
        visibleSinceRef.current = Date.now();
      }
    };

    const onPageHide = () => flush('end', true);

    const timer = setInterval(() => flush('heartbeat'), HEARTBEAT_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      flush('end', true);
    };
  }, [user]);

  // Count in-app navigations as page views (the session itself keeps running).
  useEffect(() => {
    if (!sessionIdRef.current) return;
    pageViewsRef.current += 1;
  }, [pathname]);
}
