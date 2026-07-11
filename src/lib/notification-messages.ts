import type { Locale } from '@/i18n/routing';

/**
 * Reaction notification copy (in-app inbox + Web Push).
 *
 * These can't come from next-intl's React tree: they're rendered in an API route, and
 * the language must be the RECIPIENT's (the memory owner's), not the reacting visitor's.
 * We read it from `memories.locale` — the language the creator built the memory in.
 *
 * Web Push bodies are baked at send time, so they cannot be re-translated later.
 */
type ReactionCopy = {
  replyTitle: string;
  heartTitle: (emoji: string) => string;
  fallbackBody: (memoryTitle: string) => string;
};

type UniverseCopy = {
  anonymousReactor: string;
  title: (emoji: string) => string;
  body: (reactorName: string, memoryTitle: string) => string;
};

export const REACTION_NOTIFICATION: Record<Locale, ReactionCopy> = {
  th: {
    replyTitle: '💌 มีคนตอบกลับความทรงจำของคุณ',
    heartTitle: (emoji) => `${emoji} มีคนส่งหัวใจให้ความทรงจำของคุณ`,
    fallbackBody: (title) => `"${title}" — แตะเพื่อเปิดดูอีกครั้ง`,
  },
  en: {
    replyTitle: '💌 Someone replied to your memory',
    heartTitle: (emoji) => `${emoji} Someone sent love to your memory`,
    fallbackBody: (title) => `"${title}" — tap to open it again`,
  },
  id: {
    replyTitle: '💌 Ada yang membalas kenanganmu',
    heartTitle: (emoji) => `${emoji} Ada yang mengirim cinta untuk kenanganmu`,
    fallbackBody: (title) => `"${title}" — ketuk untuk membukanya lagi`,
  },
};

export const UNIVERSE_NOTIFICATION: Record<Locale, UniverseCopy> = {
  th: {
    anonymousReactor: 'เพื่อนในจักรวาล',
    title: (emoji) => `${emoji} มีคนชอบเรื่องราวของคุณในจักรวาล`,
    body: (name, title) => `${name} กดรีแอคชันให้เรื่องราวในความทรงจำ "${title}"`,
  },
  en: {
    anonymousReactor: 'A friend in the Universe',
    title: (emoji) => `${emoji} Someone loved your story in the Universe`,
    body: (name, title) => `${name} reacted to a story in your memory "${title}"`,
  },
  id: {
    anonymousReactor: 'Teman di Universe',
    title: (emoji) => `${emoji} Ada yang menyukai ceritamu di Universe`,
    body: (name, title) => `${name} memberi reaksi pada cerita di kenanganmu "${title}"`,
  },
};

/** Narrow an untrusted DB value to a supported locale. */
export function ownerLocale(value: unknown): Locale {
  return value === 'en' || value === 'id' ? value : 'th';
}
