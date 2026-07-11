import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { localeAlternates } from '@/data/seo-landings';
import HeartIcon from '@/components/HeartIcon';
import {
  CONSENT_VERSION,
  LEGAL_CONTACT_EMAIL,
  SERVICE_NAME,
  SERVICE_URL,
} from '@/data/legal';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.terms' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    // Without this, the root layout's canonical (the home page) is inherited and this
    // page tells Google it *is* the homepage.
    alternates: localeAlternates(locale as Locale, '/terms'),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-kanit text-lg font-semibold text-[#4A1942] mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default async function TermsOfUsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('legal');
  const tt = await getTranslations('legal.terms');

  // Shared rich-text handlers: <b> for emphasis, <email> for the contact mailto link,
  // <privacyLink> for the in-page link across to the privacy policy.
  const rich = {
    b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    email: () => (
      <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#E63946] underline">
        {LEGAL_CONTACT_EMAIL}
      </a>
    ),
    privacyLink: (chunks: React.ReactNode) => (
      <Link href="/privacy" className="text-[#E63946] underline">
        {chunks}
      </Link>
    ),
  };

  return (
    <main className="min-h-screen relative z-10 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E63946] transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          {t('backToHome')}
        </Link>

        <div className="memory-card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <HeartIcon size={28} />
            <h1 className="font-kanit text-2xl md:text-3xl font-bold text-[#4A1942]">
              {tt('title')}
            </h1>
          </div>
          <p className="text-xs text-gray-400 mb-8">
            {t('versionLine', {
              version: CONSENT_VERSION,
              date: t('effectiveDate'),
            })}
          </p>

          <Section title={tt('s1.title')}>
            <p>
              {tt.rich('s1.body', {
                ...rich,
                service: SERVICE_NAME,
                url: SERVICE_URL,
              })}
            </p>
          </Section>

          <Section title={tt('s2.title')}>
            <p>{tt('s2.body', { service: SERVICE_NAME })}</p>
          </Section>

          <Section title={tt('s3.title')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tt('s3.i1')}</li>
              <li>{tt('s3.i2')}</li>
              <li>{tt('s3.i3')}</li>
            </ul>
          </Section>

          <Section title={tt('s4.title')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tt('s4.i1')}</li>
              <li>{tt('s4.i2')}</li>
              <li>{tt('s4.i3')}</li>
              <li>{tt.rich('s4.i4', rich)}</li>
              <li>{tt('s4.i5')}</li>
            </ul>
          </Section>

          <Section title={tt('s5.title')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tt('s5.i1')}</li>
              <li>{tt('s5.i2')}</li>
              <li>{tt('s5.i3')}</li>
              <li>{tt('s5.i4')}</li>
            </ul>
          </Section>

          <Section title={tt('s6.title')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tt('s6.i1')}</li>
              <li>{tt('s6.i2')}</li>
              <li>{tt('s6.i3')}</li>
            </ul>
          </Section>

          <Section title={tt('s7.title')}>
            <p>{tt('s7.body', { service: SERVICE_NAME })}</p>
          </Section>

          <Section title={tt('s8.title')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tt('s8.i1')}</li>
              <li>{tt('s8.i2')}</li>
              <li>{tt('s8.i3')}</li>
            </ul>
          </Section>

          <Section title={tt('s9.title')}>
            <p>{tt('s9.body')}</p>
          </Section>

          <Section title={tt('s10.title')}>
            <p>{tt('s10.body')}</p>
          </Section>

          <Section title={tt('s11.title')}>
            <p>{tt('s11.body')}</p>
          </Section>

          <Section title={tt('s12.title')}>
            <p>{tt.rich('s12.body', rich)}</p>
          </Section>

          <div className="border-t border-pink-100 pt-6 text-center">
            <Link href="/privacy" className="text-sm text-[#E63946] hover:underline">
              {t('readPrivacy')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
