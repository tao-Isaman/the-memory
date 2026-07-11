import type { MetadataRoute } from 'next';
import { USE_CASES } from '@/data/use-cases';
import { SEO_LANDINGS } from '@/data/seo-landings';
import { locales, routing, type Locale } from '@/i18n/routing';

const SITE_URL = 'https://thememory.app';

/** Thai is unprefixed (localePrefix: 'as-needed'); en/id live under /en and /id. */
function urlFor(locale: Locale, path = ''): string {
  const base = locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`;
  return `${base}${path}`;
}

// Public, indexable pages only. /memory/[id] is deliberately absent: those are private
// gift links, and listing them would publish every user's memory. The app pages
// (dashboard/create/credits) sit behind auth and have nothing to crawl.
const PUBLIC_PATHS: Array<{
  path: string;
  priority: number;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
}> = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  ...USE_CASES.map((uc) => ({
    path: `/use-case/${uc.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  })),
  ...SEO_LANDINGS.map((l) => ({
    path: `/${l.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  })),
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
];

/**
 * One entry per (path × locale), each carrying the full hreflang set. Google needs the
 * alternates declared on every variant — not just the default — to treat them as one
 * page in three languages rather than three competing pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: urlFor(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, urlFor(l, path)])),
          'x-default': urlFor(routing.defaultLocale, path),
        },
      },
    })),
  );
}
