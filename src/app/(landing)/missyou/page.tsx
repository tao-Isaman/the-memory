import { notFound } from 'next/navigation';
import { buildSeoLandingMetadata, getSeoLandingBySlug } from '@/data/seo-landings';
import UseCasePageClient from '@/app/(landing)/use-case/[slug]/UseCasePageClient';

const SLUG = 'missyou';

export const metadata = buildSeoLandingMetadata(SLUG);

export default function MissYouLandingPage() {
  const data = getSeoLandingBySlug(SLUG);
  if (!data) notFound();
  return <UseCasePageClient useCase={data} />;
}
