import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { USE_CASES, getUseCaseBySlug } from '@/data/use-cases';
import { buildLandingMetadata, faqJsonLd } from '@/data/seo-landings';
import UseCasePageClient from './UseCasePageClient';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const contentKeyFor = (slug: string) => `useCase.useCases.${slug}`;

/** Cross-product: every use case is prerendered in every locale. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    USE_CASES.map((uc) => ({ locale, slug: uc.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!getUseCaseBySlug(slug)) return {};

  const t = await getTranslations({ locale, namespace: contentKeyFor(slug) });

  return buildLandingMetadata({
    locale: locale as Locale,
    path: `/use-case/${slug}`,
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t.raw('keywords') as string[],
  });
}

export default async function UseCasePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const config = getUseCaseBySlug(slug);
  if (!config) notFound();

  const t = await getTranslations({ locale, namespace: contentKeyFor(slug) });
  const faqItems = t.raw('faqItems') as { q: string; a: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
      <UseCasePageClient config={config} contentKey={contentKeyFor(slug)} />
    </>
  );
}
