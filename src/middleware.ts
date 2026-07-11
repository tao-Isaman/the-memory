import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing, locales } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Shared memory links are the ONE place we auto-detect the recipient's language:
// a Thai creator sends /memory/<id> to a friend abroad and it should open in their
// language. Everything else (notably the Thai homepage) must never auto-redirect,
// or Googlebot — which crawls with Accept-Language: en — gets bounced to /en.
const MEMORY_PATH = /^\/memory\/[^/]+\/?$/;

/** Best supported locale from an Accept-Language header, honouring q-weights. */
function detectLocale(header: string | null): string {
  if (!header) return routing.defaultLocale;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      const quality = q ? parseFloat(q.split('=')[1]) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    // Match the base language: "en-GB" -> "en", "id-ID" -> "id".
    const base = tag.split('-')[0];
    const hit = locales.find((l) => l === base);
    if (hit) return hit;
  }
  return routing.defaultLocale;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Unprefixed /memory/<id> means "default locale (th)". Redirect the recipient to their
  // own language when we can infer it. An explicit choice (cookie) always wins, and an
  // already-prefixed path (/en/memory/...) never matches, so this can't loop.
  if (MEMORY_PATH.test(pathname)) {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const chosen =
      cookieLocale && (locales as readonly string[]).includes(cookieLocale)
        ? cookieLocale
        : detectLocale(request.headers.get('accept-language'));

    if (chosen !== routing.defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${chosen}${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip API + OAuth route handlers and anything with a file extension.
  // /admin IS included: it lives under [locale] so it still needs the rewrite to /th.
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};
