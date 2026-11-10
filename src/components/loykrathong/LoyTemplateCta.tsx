'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackEvent } from '@/lib/analytics';

interface Props {
  /** GA `source`: 'home', 'done' (after floating), 'landing' (game entry), 'menu' / 'hud' (in game), 'seo_<slug>'. */
  source: string;
  variant: 'card' | 'link' | 'menu' | 'pill' | 'strip';
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

  if (variant === 'strip') {
    return (
      <div className="border-b border-pink-100 bg-gradient-to-r from-[#FFF1F5] via-[#FFF8F0] to-[#FFF1F5] px-4 py-2.5 text-center text-sm">
        {link('font-semibold text-[#E63946] underline-offset-2 hover:underline', t('strip'))}
        <span className="mx-2 text-[#E63946]/40">·</span>
        <Link
          href="/loykrathong"
          className="text-[#6B5E57] underline underline-offset-2 hover:opacity-80"
          onClick={() => trackEvent('loy_cta_click', { source: `${source}_game` })}
        >
          {t('stripGame')}
        </Link>
      </div>
    );
  }

  if (variant === 'pill') {
    return link(
      'h-9 px-3 rounded-full bg-[#E63946] text-white text-sm font-medium flex items-center whitespace-nowrap shadow-lg hover:opacity-90',
      t('landing'),
    );
  }

  if (variant === 'menu') {
    return link('flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#E63946] hover:bg-pink-50', t('landing'));
  }

  if (variant === 'link') {
    return (
      <p className="mb-4 rounded-2xl border border-pink-200 bg-white px-4 py-3 text-center text-sm">
        {link('font-semibold text-[#E63946] underline underline-offset-2 hover:opacity-80', t('landing'))}
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
