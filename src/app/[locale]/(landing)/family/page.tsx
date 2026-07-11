import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { getSeoLandingBySlug, buildLandingMetadata, faqJsonLd } from '@/data/seo-landings';
import UseCasePageClient from '@/app/[locale]/(landing)/use-case/[slug]/UseCasePageClient';

const SLUG = 'family';
const CONTENT_KEY = `useCase.seoLandings.${SLUG}`;

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: CONTENT_KEY });

  return buildLandingMetadata({
    locale: locale as Locale,
    path: `/${SLUG}`,
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t.raw('keywords') as string[],
  });
}

export default async function FamilyLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const config = getSeoLandingBySlug(SLUG);
  if (!config) notFound();

  const t = await getTranslations({ locale, namespace: CONTENT_KEY });
  const faqItems = t.raw('faqItems') as { q: string; a: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
      <UseCasePageClient config={config} contentKey={CONTENT_KEY} />
    </>
  );
}
