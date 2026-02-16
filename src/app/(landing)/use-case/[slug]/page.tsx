import { Metadata } from 'next';
import { USE_CASES, getUseCaseBySlug } from '@/data/use-cases';
import UseCasePageClient from './UseCasePageClient';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return USE_CASES.map((uc) => ({ slug: uc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) return {};

  return {
    title: useCase.metaTitle,
    description: useCase.metaDescription,
    keywords: useCase.keywords.join(', '),
    openGraph: {
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      locale: 'th_TH',
      type: 'website',
      siteName: 'The Memory',
      images: [
        {
          url: '/og-image.webp',
          width: 420,
          height: 300,
          alt: useCase.metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      images: ['/og-image.webp'],
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) notFound();

  return <UseCasePageClient useCase={useCase} />;
}
