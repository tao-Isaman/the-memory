import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

// Messages are split one file per surface (messages/<locale>/<namespace>.json) instead of
// one giant blob — ~1000 strings in a single file is unreviewable and unmergeable.
// Every namespace must exist for every locale or the import below throws.
export const NAMESPACES = [
  'common',
  'landing',
  'auth',
  'viewer',
  'payment',
  'create',
  'dashboard',
  'credits',
  'profile',
  'referral',
  'legal',
  'updates',
  'useCase',
  'loykrathong',
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    }),
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
    // Dates/numbers follow the locale; th-TH formatting was hardcoded in 8+ files.
    now: new Date(),
  };
});
