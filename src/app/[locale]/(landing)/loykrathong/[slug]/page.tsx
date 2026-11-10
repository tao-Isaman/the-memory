import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { LOY_PAGES, getLoyPage } from '@/data/loy-pages';
import { buildLandingMetadata, faqJsonLd, localeUrl } from '@/data/seo-landings';
import HeartIcon from '@/components/HeartIcon';
import LoyTemplateCta from '@/components/loykrathong/LoyTemplateCta';

// Thai-only content pages: only the default locale is generated, anything else is a 404.
export const dynamicParams = false;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return LOY_PAGES.map((page) => ({ locale: routing.defaultLocale, slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getLoyPage(slug);
  if (!page || locale !== routing.defaultLocale) return {};
  const path = `/loykrathong/${page.slug}`;
  return {
    ...buildLandingMetadata({
      locale: routing.defaultLocale,
      path,
      title: page.metaTitle,
      description: page.metaDescription,
      keywords: page.keywords,
    }),
    // No hreflang alternates: the page exists in Thai only.
    alternates: { canonical: localeUrl(routing.defaultLocale, path) },
  };
}

export default async function LoyContentPage({ params }: Props) {
  const { locale, slug } = await params;
  const page = getLoyPage(slug);
  if (!page || locale !== routing.defaultLocale) notFound();
  setRequestLocale(locale);

  const others = LOY_PAGES.filter((p) => p.slug !== page.slug);
  const source = `seo_${page.slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-white to-[#FFF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(page.faq)) }}
      />

      <nav className="border-b border-gray-100 bg-[#FFFBF7]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <HeartIcon size={24} />
            <span className="text-xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent">
              The Memory
            </span>
          </Link>
          <Link href="/loykrathong" className="text-sm font-medium text-[#E63946] hover:opacity-80">
            🪷 ลอยกระทงออนไลน์
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#4A1942] leading-tight mb-4">{page.h1}</h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-8">{page.intro}</p>

        <LoyTemplateCta source={source} variant="card" />

        {page.sections.map((section) => {
          const List = section.ordered ? 'ol' : 'ul';
          return (
            <section key={section.heading} className="mt-10">
              <h2 className="text-2xl font-bold text-[#4A1942] mb-3">{section.heading}</h2>
              {section.intro && <p className="text-gray-600 leading-relaxed mb-4">{section.intro}</p>}
              <List className={`space-y-2 pl-6 text-gray-700 leading-relaxed ${section.ordered ? 'list-decimal' : 'list-disc'}`}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </List>
            </section>
          );
        })}

        <section className="mt-12 rounded-2xl bg-[#0b1230] p-6 text-center text-white">
          <h2 className="text-xl font-bold mb-2">ลอยกระทงออนไลน์ที่หมู่บ้านน้องปู</h2>
          <p className="text-white/80 text-sm mb-4">
            แต่งตัวน้องปู เลือกกระทง แล้วไปอธิษฐานที่ท่าน้ำ เล่นได้ฟรี ไม่ต้องติดตั้งแอป
          </p>
          <Link href="/loykrathong" className="btn-primary inline-block px-8 py-3">
            ไปลอยกระทงออนไลน์
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-[#4A1942] mb-4">คำถามที่พบบ่อย</h2>
          <div className="space-y-4">
            {page.faq.map((item) => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-[#4A1942] mb-1">{item.q}</h3>
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[#4A1942] mb-3">อ่านต่อ</h2>
          <ul className="space-y-2 pl-6 list-disc">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={`/loykrathong/${other.slug}`} className="text-[#E63946] underline underline-offset-2 hover:opacity-80">
                  {other.h1}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          <LoyTemplateCta source={`${source}_bottom`} variant="card" />
        </div>
      </main>

      <footer className="py-8 bg-[#4A1942] text-center text-sm text-pink-300">
        <Link href="/" className="hover:text-white transition-colors">The Memory</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-white transition-colors">ข้อกำหนดการใช้งาน</Link>
      </footer>
    </div>
  );
}
