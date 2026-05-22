'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Share, Plus } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { isIOS, isStandalone, trackInstall, trackLaunch } from '@/lib/pwa';

// The browser's install prompt event (not in standard TS lib types).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_install_dismissed_at';
const INSTALLED_KEY = 'pwa_installed';
const DAY_MS = 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 4000;

function recentlyDismissed(): boolean {
  const v = localStorage.getItem(DISMISS_KEY);
  return !!v && Date.now() - Number(v) < DAY_MS;
}

function markDismissed() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

function alreadyInstalled(): boolean {
  return localStorage.getItem(INSTALLED_KEY) === '1';
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  const show = useCallback((ios: boolean) => {
    if (alreadyInstalled() || recentlyDismissed() || isStandalone()) return;
    setIosMode(ios);
    setVisible(true);
    trackEvent('pwa_prompt_shown', { source: ios ? 'ios' : 'android' });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register the service worker (enables installability + offline fallback).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* registration is best-effort */
      });
    }

    // If launched as an installed app, send a heartbeat (once per session) and skip the prompt.
    if (isStandalone()) {
      if (!sessionStorage.getItem('pwa_launch_tracked')) {
        sessionStorage.setItem('pwa_launch_tracked', '1');
        trackLaunch();
        // Ensure a returning installed user is never nagged again.
        localStorage.setItem(INSTALLED_KEY, '1');
      }
      return;
    }

    // Android/desktop (Chromium): capture the native prompt.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      window.setTimeout(() => show(false), SHOW_DELAY_MS);
    };

    // Fired when the app gets installed (any path).
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      setVisible(false);
      setDeferredPrompt(null);
      trackInstall();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari never fires beforeinstallprompt → show manual instructions instead.
    const ua = navigator.userAgent || '';
    const iosSafari = isIOS() && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (iosSafari) {
      window.setTimeout(() => show(true), SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [show]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      trackEvent('pwa_install_accepted');
      // appinstalled handler will record the install.
    } else {
      trackEvent('pwa_install_dismissed');
      markDismissed();
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleLater = () => {
    trackEvent('pwa_install_dismissed', { source: iosMode ? 'ios' : 'android' });
    markDismissed();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-white shadow-2xl border border-pink-100 overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="The Memory" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-kanit font-bold text-gray-800 text-sm">ติดตั้งแอป The Memory</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              เพิ่มลงหน้าจอโฮม เปิดใช้ได้เร็วขึ้น เหมือนแอปจริง ไม่ต้องเปิดเบราว์เซอร์
            </p>
          </div>
          <button
            onClick={handleLater}
            aria-label="ปิด"
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 -mt-1 -mr-1 p-1"
          >
            <X size={18} />
          </button>
        </div>

        {iosMode ? (
          // iOS Safari manual instructions
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-pink-50 p-3 text-xs text-gray-600 space-y-2">
              <p className="flex items-center gap-2">
                <span className="font-semibold">1.</span> แตะปุ่มแชร์
                <Share size={15} className="inline text-blue-500" /> ด้านล่างของ Safari
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">2.</span> เลือก &quot;เพิ่มลงในหน้าจอโฮม&quot;
                <Plus size={15} className="inline text-gray-600" />
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 px-4 pb-4">
            <button
              onClick={handleLater}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold border-2 border-pink-200 text-gray-600 hover:bg-pink-50 transition-colors"
            >
              ไว้ก่อน
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #E63946 100%)',
                boxShadow: '0 4px 15px rgba(230, 57, 70, 0.3)',
              }}
            >
              ติดตั้ง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
