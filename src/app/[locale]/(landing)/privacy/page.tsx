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
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    // Without this, the root layout's canonical (the home page) is inherited and this
    // page tells Google it *is* the homepage.
    alternates: localeAlternates(locale as Locale, '/privacy'),
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

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('legal');
  const tp = await getTranslations('legal.privacy');

  // Shared rich-text handlers: <b> for emphasis, <email> for the contact mailto link.
  const rich = {
    b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    email: () => (
      <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#E63946] underline">
        {LEGAL_CONTACT_EMAIL}
      </a>
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
              {tp('title')}
            </h1>
          </div>
          <p className="text-xs text-gray-400 mb-8">
            {t('versionLine', {
              version: CONSENT_VERSION,
              date: t('effectiveDate'),
            })}
          </p>

          <Section title={tp('s1.title')}>
            <p>{tp('s1.body', { service: SERVICE_NAME, url: SERVICE_URL })}</p>
          </Section>

          <Section title={tp('s2.title')}>
            <p>{tp('s2.intro')}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tp.rich('s2.i1', rich)}</li>
              <li>{tp.rich('s2.i2', rich)}</li>
              <li>{tp.rich('s2.i3', rich)}</li>
              <li>{tp.rich('s2.i4', rich)}</li>
              <li>{tp.rich('s2.i5', rich)}</li>
              <li>{tp.rich('s2.i6', rich)}</li>
            </ul>
          </Section>

          <Section title={tp('s3.title')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tp('s3.i1')}</li>
              <li>{tp('s3.i2')}</li>
              <li>{tp('s3.i3')}</li>
              <li>{tp('s3.i4')}</li>
              <li>{tp('s3.i5')}</li>
              <li>{tp('s3.i6')}</li>
            </ul>
          </Section>

          <Section title={tp('s4.title')}>
            <p>{tp.rich('s4.intro', rich)}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tp.rich('s4.i1', rich)}</li>
              <li>{tp.rich('s4.i2', rich)}</li>
              <li>{tp.rich('s4.i3', rich)}</li>
              <li>{tp.rich('s4.i4', rich)}</li>
              <li>{tp.rich('s4.i5', rich)}</li>
            </ul>
            <p>{tp('s4.outro')}</p>
          </Section>

          <Section title={tp('s5.title')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tp('s5.i1')}</li>
              <li>{tp.rich('s5.i2', rich)}</li>
            </ul>
          </Section>

          <Section title={tp('s6.title')}>
            <p>{tp('s6.body')}</p>
          </Section>

          <Section title={tp('s7.title')}>
            <p>{tp('s7.intro')}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{tp('s7.i1')}</li>
              <li>{tp('s7.i2')}</li>
              <li>{tp('s7.i3')}</li>
              <li>{tp('s7.i4')}</li>
              <li>{tp('s7.i5')}</li>
              <li>{tp('s7.i6')}</li>
            </ul>
            <p>{tp.rich('s7.outro', rich)}</p>
          </Section>

          <Section title={tp('s8.title')}>
            <p>{tp('s8.body')}</p>
          </Section>

          <Section title={tp('s9.title')}>
            <p>{tp('s9.body')}</p>
          </Section>

          <Section title={tp('s10.title')}>
            <p>{tp('s10.body')}</p>
          </Section>

          <Section title={tp('s11.title')}>
            <p>{tp.rich('s11.body', rich)}</p>
          </Section>

          <div className="border-t border-pink-100 pt-6 text-center">
            <Link href="/terms" className="text-sm text-[#E63946] hover:underline">
              {t('readTerms')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
