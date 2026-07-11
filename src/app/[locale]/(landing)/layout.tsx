import { setRequestLocale } from "next-intl/server";

/**
 * Marketing-group layout.
 *
 * No `generateMetadata` here on purpose: every page in this group (home, /use-case/[slug],
 * the six SEO landings, privacy, terms) declares its own title/description/canonical, and a
 * group-level default would otherwise stamp the home page's canonical URL onto the legal
 * pages via metadata inheritance.
 *
 * FloatingHearts is likewise omitted: src/app/[locale]/layout.tsx renders it once for every
 * surface, so rendering it again here would double the decoration on marketing pages.
 */
export default async function LandingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <>{children}</>;
}
