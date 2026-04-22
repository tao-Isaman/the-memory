import { notFound } from 'next/navigation';
import { buildSeoLandingMetadata, getSeoLandingBySlug } from '@/data/seo-landings';
import UseCasePageClient from '@/app/(landing)/use-case/[slug]/UseCasePageClient';

const SLUG = 'reconcile';

export const metadata = buildSeoLandingMetadata(SLUG);

export default function ReconcileLandingPage() {
  const data = getSeoLandingBySlug(SLUG);
  if (!data) notFound();
  return <UseCasePageClient useCase={data} />;
}
