import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildLandingMetadata, faqJsonLd } from '@/data/seo-landings';
import LandingPageClient from './LandingPageClient';

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.meta' });

  return buildLandingMetadata({
    locale: locale as Locale,
    path: '',
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords') as string[],
  });
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // FAQPage structured data used to live in the root layout with hardcoded Thai.
  // It belongs to this page and has to follow the active locale, so it is emitted here.
  const t = await getTranslations({ locale, namespace: 'landing.faq' });
  const faqItems = t.raw('items') as { q: string; a: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
      <LandingPageClient />
    </>
  );
}
