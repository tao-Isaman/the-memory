'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackEvent } from '@/lib/analytics';

interface Props {
  /** GA `source`: 'done' (after floating), 'landing' (game entry), 'menu' (game menu), 'seo_<slug>' (content pages). */
  source: string;
  variant: 'card' | 'link' | 'menu';
}

/**
 * Sends free-game and content-page visitors to the paid product: the Loy Krathong
 * starter template. One component for every placement so the destination and the GA
 * events (loy_cta_view / loy_cta_click, split by `source`) are defined once.
 */
export default function LoyTemplateCta({ source, variant }: Props) {
  const t = useTranslations('loykrathong.cta');

  useEffect(() => {
    trackEvent('loy_cta_view', { source });
  }, [source]);

  const link = (className: string, label: string) => (
    <Link
      href="/create?template=loykrathong"
      className={className}
      onClick={() => trackEvent('loy_cta_click', { source })}
    >
      {label}
    </Link>
  );

  if (variant === 'menu') {
    return link('flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#E63946] hover:bg-pink-50', t('landing'));
  }

  if (variant === 'link') {
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
