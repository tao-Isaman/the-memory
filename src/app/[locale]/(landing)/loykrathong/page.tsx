import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildLandingMetadata } from '@/data/seo-landings';
import LoyKrathongGame from '@/components/loykrathong/LoyKrathongGame';

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'loykrathong' });
  return buildLandingMetadata({
    locale: locale as Locale,
    path: '/loykrathong',
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t.raw('keywords') as string[],
  });
}

export default async function LoyKrathongPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0b1230]" />}>
      <LoyKrathongGame />
    </Suspense>
  );
}
