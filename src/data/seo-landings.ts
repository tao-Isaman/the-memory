import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import type { UseCaseConfig } from './use-cases';

/**
 * Locale-independent config for the standalone SEO landing pages (/valentine, /birthday, …).
 *
 * Same split as use-cases.ts: text lives in `messages/<locale>/useCase.json` under
 * `seoLandings.<slug>`, because the whole point of these pages is to rank, and
 * ranking copy has to be written natively per locale rather than translated.
 *
 * NOTE: this module is imported by the (client) create page, so it must stay free of
 * `next-intl/server` / `server-only` imports. Pages resolve their own translations and
 * hand the finished strings to `buildLandingMetadata`.
 */
export const SEO_LANDINGS: UseCaseConfig[] = [
  {
    slug: 'anniversary',
    theme: 'anniversary',
    emoji: '💍',
    color: 'from-amber-500 to-yellow-600',
  },
  {
    slug: 'birthday',
    theme: 'birthday',
    emoji: '🎂',
    color: 'from-orange-400 to-amber-500',
  },
  {
    slug: 'valentine',
    theme: 'love',
    emoji: '💘',
    color: 'from-rose-500 to-pink-600',
  },
  {
    slug: 'reconcile',
    theme: 'apology',
    emoji: '🌷',
    color: 'from-purple-400 to-violet-500',
  },
  {
    slug: 'family',
    theme: 'family',
    emoji: '👨‍👩‍👧‍👦',
    color: 'from-emerald-400 to-green-500',
  },
  {
    slug: 'missyou',
    theme: 'longdistance',
    emoji: '💭',
    color: 'from-sky-400 to-blue-500',
  },
];

/** Used by the create page to auto-select the theme a visitor arrived with. */
export function getSeoLandingBySlug(slug: string): UseCaseConfig | undefined {
  return SEO_LANDINGS.find((uc) => uc.slug === slug);
}

const SITE_URL = 'https://thememory.app';

const OG_LOCALE: Record<Locale, string> = {
  th: 'th_TH',
  en: 'en_US',
  id: 'id_ID',
};

/** Thai is unprefixed (localePrefix: 'as-needed'); en/id live under /en and /id. */
export function localeUrl(locale: Locale, path = ''): string {
  const base = locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`;
  return `${base}${path}`;
}

/**
 * Per-page canonical + hreflang. Without this every landing page inherits the root
 * layout's canonical (the home page), which would collapse all of them into one URL
 * in Google's eyes.
 */
export function localeAlternates(locale: Locale, path = ''): Metadata['alternates'] {
  return {
    canonical: localeUrl(locale, path),
    languages: {
      th: localeUrl('th', path),
      en: localeUrl('en', path),
      id: localeUrl('id', path),
      'x-default': localeUrl('th', path),
    },
  };
}

export function buildLandingMetadata({
  locale,
  path,
  title,
  description,
  keywords,
}: {
  locale: Locale;
  /** Path without the locale prefix, e.g. '' | '/valentine' | '/use-case/anniversary'. */
  path: string;
  title: string;
  description: string;
  keywords: string[];
}): Metadata {
  return {
    title,
    description,
    keywords: keywords.join(', '),
    alternates: localeAlternates(locale, path),
    openGraph: {
      title,
      description,
      locale: OG_LOCALE[locale],
      type: 'website',
      siteName: 'The Memory',
      url: localeUrl(locale, path),
      images: [
        {
          url: '/og-image.webp',
          width: 420,
          height: 300,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.webp'],
    },
  };
}

/** FAQPage structured data, shared by the landing page and every use-case page. */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}
