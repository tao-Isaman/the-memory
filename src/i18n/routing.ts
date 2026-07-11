import { defineRouting } from 'next-intl/routing';

export const locales = ['th', 'en', 'id'] as const;
export type Locale = (typeof locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  th: 'ไทย',
  en: 'English',
  id: 'Bahasa Indonesia',
};

export const routing = defineRouting({
  locales,
  defaultLocale: 'th',

  // Thai stays unprefixed at "/" so every existing URL — and the rankings they carry
  // for ของขวัญเซอร์ไพรส์แฟน — is untouched. English/Indonesian get /en and /id.
  localePrefix: 'as-needed',

  // Global auto-detection is OFF deliberately. Googlebot crawls with
  // `Accept-Language: en`; with detection on it would be bounced off the Thai homepage
  // to /en, putting the primary keyword ranking at risk. Recipient-language detection
  // is applied ONLY to shared memory links (/memory/[id]) in middleware.ts, which are
  // not SEO surfaces. A manual choice (NEXT_LOCALE cookie) always wins.
  localeDetection: false,
});
