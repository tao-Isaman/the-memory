import { notFound } from 'next/navigation';
import { buildSeoLandingMetadata, getSeoLandingBySlug } from '@/data/seo-landings';
import UseCasePageClient from '@/app/(landing)/use-case/[slug]/UseCasePageClient';

const SLUG = 'anniversary';

export const metadata = buildSeoLandingMetadata(SLUG);

export default function AnniversaryLandingPage() {
  const data = getSeoLandingBySlug(SLUG);
  if (!data) notFound();
  return <UseCasePageClient useCase={data} />;
}
