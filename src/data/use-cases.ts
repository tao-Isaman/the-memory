import { MemoryTheme } from '@/types/memory';

/**
 * Locale-independent config for the 6 use-case pages (/use-case/[slug]).
 *
 * All human-readable text (title, hero copy, meta tags, keywords, sample prompts,
 * FAQ) lives in `messages/<locale>/useCase.json` under `useCases.<slug>` — SEO copy
 * has to be written natively per locale, not translated, so it cannot live here.
 * Only the things that are the same in every language stay in TypeScript.
 */
export interface UseCaseConfig {
  slug: string;
  theme: MemoryTheme;
  emoji: string;
  /** Tailwind gradient classes for the tile / icon chips. */
  color: string;
}

export const USE_CASES: UseCaseConfig[] = [
  {
    slug: 'surprise-gift',
    theme: 'love',
    emoji: '💕',
    color: 'from-pink-500 to-rose-500',
  },
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
    slug: 'apology',
    theme: 'apology',
    emoji: '🌷',
    color: 'from-purple-400 to-violet-500',
  },
  {
    slug: 'long-distance',
    theme: 'longdistance',
    emoji: '✈️',
    color: 'from-sky-400 to-blue-500',
  },
  {
    slug: 'family',
    theme: 'family',
    emoji: '👨‍👩‍👧‍👦',
    color: 'from-blue-400 to-indigo-500',
  },
];

/** Used by the create page to auto-select the theme a visitor arrived with. */
export function getUseCaseBySlug(slug: string): UseCaseConfig | undefined {
  return USE_CASES.find((uc) => uc.slug === slug);
}
