'use client';

import { useAppSessionTracking } from '@/hooks/useAppSessionTracking';

/**
 * Renders nothing — it exists so the (app) layout (a server component) can start
 * time-in-app tracking. Mounted once for the whole signed-in app, so navigating
 * between dashboard/create/credits/universe stays ONE session rather than starting a
 * new one on every route change.
 */
export default function AppSessionTracker() {
  useAppSessionTracking();
  return null;
}
