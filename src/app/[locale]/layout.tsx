import type { Metadata, Viewport } from "next";
import { Itim, Kanit, Leckerli_One } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import FloatingHearts from "@/components/FloatingHearts";
import ClientProviders from "@/components/ClientProviders";
import { Analytics } from "@vercel/analytics/next";
import { routing, type Locale } from "@/i18n/routing";

// Kanit/Itim already ship the `latin` subset, so English and Indonesian render
// correctly with no font change.
const itim = Itim({
  weight: "400",
  subsets: ["thai", "latin"],
  variable: "--font-itim",
});

const kanit = Kanit({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
});

const leckerliOne = Leckerli_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-leckerli",
});

const SITE_URL = "https://thememory.app";

/** Canonical + hreflang. Thai is unprefixed (localePrefix: 'as-needed'). */
function urlFor(locale: Locale) {
  return locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`;
}

const OG_LOCALE: Record<Locale, string> = {
  th: "th_TH",
  en: "en_US",
  id: "id_ID",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "common.meta" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: "The Memory" }],
    creator: "The Memory",
    publisher: "The Memory",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      siteName: "The Memory",
      images: [
        {
          url: "/og-image.webp",
          width: 420,
          height: 300,
          alt: t("ogAlt"),
        },
      ],
      locale: OG_LOCALE[locale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: ["/og-image.webp"],
    },
    alternates: {
      canonical: urlFor(locale),
      languages: {
        th: urlFor("th"),
        en: urlFor("en"),
        id: urlFor("id"),
        "x-default": urlFor("th"),
      },
    },
    category: "gift",
    verification: {
      google: "rmJ1lfrMVRg7O8BWKQPV7wc1YAmrQ8gzsbFXUfCS-68",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "The Memory",
    },
    icons: {
      icon: [
        { url: "/mascot.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#E63946",
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering of the locale segment.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common.meta" });

  return (
    <html lang={locale}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MZKHDF94QX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MZKHDF94QX');
          `}
        </Script>
        <Script
          id="json-ld-app"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "The Memory",
              alternateName: t("schemaAlternateName"),
              description: t("schemaDescription"),
              url: urlFor(locale as Locale),
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "THB",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                ratingCount: "150",
              },
              inLanguage: locale,
              keywords: t("keywords"),
            }),
          }}
        />
      </head>
      <body
        className={`${itim.variable} ${kanit.variable} ${leckerliOne.variable} antialiased min-h-screen`}
      >
        <NextIntlClientProvider>
          <ClientProviders>
            <FloatingHearts />
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
