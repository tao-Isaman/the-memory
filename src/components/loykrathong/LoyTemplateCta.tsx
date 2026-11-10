'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackEvent } from '@/lib/analytics';

/** Where the CTA is shown: after a krathong is floated, or on the game's entry screen. */
type Placement = 'done' | 'landing';

/**
 * Sends free-game visitors to the paid product: the Loy Krathong starter template.
 * One component for both placements so the destination and the GA events
 * (loy_cta_view / loy_cta_click, split by `source`) are defined once.
 */
export default function LoyTemplateCta({ placement }: { placement: Placement }) {
  const t = useTranslations('loykrathong.cta');

  useEffect(() => {
    trackEvent('loy_cta_view', { source: placement });
  }, [placement]);

  const link = (className: string, label: string) => (
    <Link
      href="/create?template=loykrathong"
      className={className}
      onClick={() => trackEvent('loy_cta_click', { source: placement })}
    >
      {label}
    </Link>
  );

  if (placement === 'landing') {
    return (
      <p className="mt-4 text-center text-sm">
        {link('text-[#E63946] underline underline-offset-2 hover:opacity-80', t('landing'))}
      </p>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-pink-200 bg-white p-4">
      <p className="font-bold text-[#4A1942]">{t('heading')}</p>
      <p className="mt-1 mb-3 text-sm text-[#6B5E57]">{t('body')}</p>
      {link('btn-primary block w-full py-3', t('button'))}
      <p className="mt-2 text-xs text-[#6B5E57]">{t('price')}</p>
    </div>
  );
}
