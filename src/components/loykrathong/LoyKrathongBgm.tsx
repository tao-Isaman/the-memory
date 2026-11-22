'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Background music for the Loy Krathong scene. Self-contained: it renders the
// <audio> element and a corner mute toggle, and owns every rule the scene asks
// for:
//   - loops quietly as a background layer, ONLY while this component is mounted
//     (i.e. only on /loykrathong). Unmounting (leaving the scene) stops it.
//   - never autoplays: the first real user gesture anywhere starts it, so
//     iOS/Android autoplay policies are satisfied. Fades in over ~1s.
//   - a mute/unmute button in the top-right HUD, remembered in localStorage.
//   - pauses when the tab is hidden and resumes when it returns
//     (visibilitychange), so it never plays into a backgrounded tab.
//   - preload="none" so the 2.6 MB file never blocks first paint — it is
//     fetched only when playback actually starts.
//
// There is no other audio in this scene today, so there is nothing to duck. If
// a sound effect is ever added, lower `TARGET_VOLUME` (or pause) while it plays.

const SRC = '/audio/loykrathong-bgm.mp3';
const STORAGE_KEY = 'lk-bgm-muted';
const TARGET_VOLUME = 0.55; // track is pre-normalised to -18 LUFS; gentle under the scene
const FADE_MS = 1000;

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function LoyKrathongBgm() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  // Whether the first user gesture has started playback. Until then the tab has
  // no permission to make sound, so the button just reflects the stored intent.
  const startedRef = useRef(false);
  const fadeRaf = useRef<number | null>(null);
  // Mirror of state for listeners registered once (they close over stale state
  // otherwise).
  const mutedRef = useRef(false);

  // Restore the stored mute preference on mount (client-only; SSR renders
  // unmuted, then this corrects it before anything can play).
  useEffect(() => {
    const m = readMuted();
    setMuted(m);
    mutedRef.current = m;
  }, []);

  const cancelFade = () => {
    if (fadeRaf.current !== null) {
      cancelAnimationFrame(fadeRaf.current);
      fadeRaf.current = null;
    }
  };

  // Ramp volume to `to` over FADE_MS. Used for the 1s fade-in; kept generic so a
  // future fade-out is trivial.
  const fadeTo = useCallback((to: number) => {
    const el = audioRef.current;
    if (!el) return;
    cancelFade();
    const from = el.volume;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / FADE_MS);
      el.volume = from + (to - from) * p;
      if (p < 1) {
        fadeRaf.current = requestAnimationFrame(step);
      } else {
        fadeRaf.current = null;
      }
    };
    fadeRaf.current = requestAnimationFrame(step);
  }, []);

  // Begin (or resume) playback and fade in, unless muted. Safe to call from any
  // user-gesture handler, including the mute toggle's own click.
  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el || mutedRef.current) return;
    el.volume = startedRef.current ? el.volume : 0;
    const p = el.play();
    if (p) p.catch(() => { /* gesture lost / not allowed yet — a later one retries */ });
    startedRef.current = true;
    fadeTo(TARGET_VOLUME);
  }, [fadeTo]);

  // First gesture anywhere kicks the music off. Registered once; removes itself
  // after firing. pointerdown covers mouse + touch + pen; keydown covers
  // keyboard-only players.
  useEffect(() => {
    const onFirstGesture = () => {
      play();
      remove();
    };
    const remove = () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture, { passive: true });
    window.addEventListener('keydown', onFirstGesture);
    window.addEventListener('touchstart', onFirstGesture, { passive: true });
    return remove;
  }, [play]);

  // Pause into a hidden tab; resume when it comes back (only if we were already
  // playing and are not muted).
  useEffect(() => {
    const onVisibility = () => {
      const el = audioRef.current;
      if (!el) return;
      if (document.hidden) {
        el.pause();
      } else if (startedRef.current && !mutedRef.current) {
        const p = el.play();
        if (p) p.catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Stop everything when leaving the scene (component unmount). The <audio> is
  // rendered once and never replaced, so capturing it at mount is safe and
  // keeps the ref out of the cleanup closure.
  useEffect(() => {
    const el = audioRef.current;
    return () => {
      cancelFade();
      el?.pause();
    };
  }, []);

  const toggleMuted = () => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch { /* private mode: honour the choice for this session only */ }
      const el = audioRef.current;
      if (el) {
        if (next) {
          cancelFade();
          el.pause();
        } else {
          // Unmuting is itself a user gesture, so it may also be what starts the
          // music for the first time.
          play();
        }
      }
      return next;
    });
  };

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="none" className="hidden" aria-hidden="true" />
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? 'เปิดเสียงเพลง' : 'ปิดเสียงเพลง'}
        aria-pressed={muted}
        title={muted ? 'เปิดเสียงเพลง' : 'ปิดเสียงเพลง'}
        className="h-9 w-9 flex items-center justify-center rounded-full bg-black/45 text-white text-base backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-colors"
      >
        <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
      </button>
    </>
  );
}
