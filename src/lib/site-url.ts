/**
 * Canonical origin of the public site, used for canonical/alternate links,
 * sitemap.xml, robots.txt and the SEO landing pages.
 *
 * Set NEXT_PUBLIC_SITE_URL (e.g. "https://memory.korat.tech") in the Vercel
 * project to change the domain; no code change is needed. When unset it falls
 * back to the current value so behaviour is unchanged.
 *
 * Note: NEXT_PUBLIC_* values are inlined at build time, so a change takes
 * effect on the next deployment.
 */
const DEFAULT_SITE_URL = 'https://thememory.app';

function normalise(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return DEFAULT_SITE_URL;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return DEFAULT_SITE_URL;
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL: string = normalise(process.env.NEXT_PUBLIC_SITE_URL);
