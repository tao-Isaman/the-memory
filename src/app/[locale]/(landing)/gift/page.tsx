import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import GiftGame from '@/components/gift/GiftGame';

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Static metadata (campaign mini-game, demo). Not indexed — it is a QR-only
// entry point, not an SEO landing.
export const metadata: Metadata = {
  title: 'กล่องของขวัญ 🎁 | The Memory',
  description: 'เปิดกล่องของขวัญ แล้วส่งความรู้สึกถึงคนที่คุณคิดถึง',
  robots: { index: false, follow: false },
};

export default async function GiftPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#1a1140]" />}>
      <GiftGame />
    </Suspense>
  );
}
