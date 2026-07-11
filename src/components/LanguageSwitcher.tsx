'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, LOCALE_LABELS, type Locale } from '@/i18n/routing';

/**
 * Switching locale re-navigates to the same route under the new locale. next-intl
 * persists the choice in the NEXT_LOCALE cookie, which then outranks the
 * Accept-Language detection we do for shared memory links.
 */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations('common.language');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <Globe
        size={16}
        className="pointer-events-none absolute left-2.5 text-gray-500"
        aria-hidden
      />
      <span className="sr-only">{t('switchTo')}</span>
      <select
        value={locale}
        disabled={isPending}
        aria-label={t('label')}
        onChange={(e) => {
          const next = e.target.value as Locale;
          startTransition(() => {
            router.replace(pathname, { locale: next });
          });
        }}
        className="appearance-none rounded-full border border-gray-200 bg-white/80 py-1.5 pl-8 pr-7 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-60"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 h-3 w-3 text-gray-400"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </label>
  );
}
