'use client';

import { useCallback, useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { getViewerId, newSessionId, sendViewEvent } from '@/lib/view-tracking';

interface Options {
  memoryId: string;
  /** Only track once the memory is actually viewable (active, or owner preview). */
  enabled: boolean;
  isOwner: boolean;
  storiesTotal: number;
}

/**
 * Phase 0 instrumentation: records a viewing SESSION for /memory/[id].
 * Captures view start, furthest story reached, completion, and dwell time.
 * Anonymous & best-effort — never blocks or breaks the viewer.
 *
 * Returns `reportProgress(index)` (call on every navigation) and
 * `markComplete()` (call when the last story is reached).
 */
export function useMemoryViewTracking({ memoryId, enabled, isOwner, storiesTotal }: Options) {
  const viewIdRef = useRef<string | null>(null);
  const startTimeRef = useRef(0);
  const maxReachedRef = useRef(0);
  const completedRef = useRef(false);
  const endSentRef = useRef(false);

  const elapsedSeconds = () =>
    startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;

  // Start the session once, when the memory becomes viewable.
  useEffect(() => {
    if (!enabled || viewIdRef.current) return;
    const viewId = newSessionId();
    viewIdRef.current = viewId;
    startTimeRef.current = Date.now();
    sendViewEvent({
      action: 'start',
      viewId,
      memoryId,
      viewerId: getViewerId(),
      isOwner,
      storiesTotal,
    });
    trackEvent('view_memory', { memory_id: memoryId, is_owner: isOwner });
  }, [enabled, memoryId, isOwner, storiesTotal]);

  const sendEnd = useCallback((useBeacon: boolean) => {
    if (!viewIdRef.current || endSentRef.current) return;
    endSentRef.current = true;
    sendViewEvent(
      {
        action: 'end',
        viewId: viewIdRef.current,
        maxStoryReached: maxReachedRef.current,
        completed: completedRef.current,
        durationSeconds: elapsedSeconds(),
      },
      useBeacon,
    );
  }, []);

  // Flush the session on tab close / app switch (pagehide) and on unmount (SPA navigation away).
  useEffect(() => {
    if (!enabled) return;
    endSentRef.current = false; // re-arm (also handles dev StrictMode remount)
    const onPageHide = () => sendEnd(true);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      sendEnd(false);
    };
  }, [enabled, sendEnd]);

  const reportProgress = useCallback((index: number) => {
    if (index > maxReachedRef.current) maxReachedRef.current = index;
  }, []);

  const markComplete = useCallback(() => {
    if (completedRef.current || !viewIdRef.current) return;
    completedRef.current = true;
    sendViewEvent({
      action: 'progress',
      viewId: viewIdRef.current,
      maxStoryReached: maxReachedRef.current,
      completed: true,
      durationSeconds: elapsedSeconds(),
    });
    trackEvent('complete_memory', { memory_id: memoryId, is_owner: isOwner });
  }, [memoryId, isOwner]);

  return { reportProgress, markComplete };
}
