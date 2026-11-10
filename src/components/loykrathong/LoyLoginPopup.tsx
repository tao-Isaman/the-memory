'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackEvent } from '@/lib/analytics';
import { eventPhase } from '@/lib/loykrathong/config';
import { localDay, loyPopupKey, shouldShowLoyPopup } from '@/lib/loykrathong/popup';

function readLastShown(userId: string): string | null {
  try {
    return localStorage.getItem(loyPopupKey(userId));
  } catch {
    return null; // storage blocked: the popup may show again, it never blocks anything
  }
}

/**
 * Seasonal popup for signed-in users: invites them into the Loy Krathong template.
 * Mounted by the signed-in app layout once the user is known, so it only ever renders in
 * the browser; the decision is taken once, when it mounts.
 */
export default function LoyLoginPopup({ userId }: { userId: string }) {
  const t = useTranslations('loykrathong.popup');
  const [open, setOpen] = useState(() =>
    shouldShowLoyPopup({
      seasonOpen: eventPhase() === 'open',
      search: window.location.search,
      today: localDay(new Date()),
      lastShownDay: readLastShown(userId),
    }),
  );

  // Showing it counts for today, whether or not the user reacts.
  useEffect(() => {
    if (!open) return;
    trackEvent('loy_popup_view');
    try {
      localStorage.setItem(loyPopupKey(userId), localDay(new Date()));
    } catch {
      // storage blocked
    }
  }, [open, userId]);

  if (!open) return null;

  const dismiss = () => {
    trackEvent('loy_popup_dismiss');
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loy-popup-title"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#FFFBF7] p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('close')}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          ✕
        </button>
        <p className="text-sm font-medium text-[#E63946]">{t('title')}</p>
        <h2 id="loy-popup-title" className="mt-1 text-2xl font-bold text-[#4A1942]">
          {t('headline')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B5E57]">{t('body')}</p>
        <Link
          href="/create?template=loykrathong"
          className="btn-primary mt-5 block w-full py-3"
          onClick={() => {
            trackEvent('loy_popup_click');
            setOpen(false);
          }}
        >
          {t('button')}
        </Link>
        <button type="button" onClick={dismiss} className="mt-3 w-full py-2 text-sm text-[#6B5E57] hover:opacity-80">
          {t('later')}
        </button>
      </div>
    </div>
  );
}
