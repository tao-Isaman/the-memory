'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import PaymentButton from '@/components/PaymentButton';
import Mascot from '@/components/Mascot';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/analytics';

function PaymentCancelContent() {
  const t = useTranslations('payment');
  const searchParams = useSearchParams();
  const memoryId = searchParams.get('memory_id');
  const { user } = useAuth();

  useEffect(() => {
    trackEvent('payment_fail');
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="memory-card p-8 max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <Mascot size={128} emotion="sad" animation="idle" />
        </div>

        <h1 className="font-kanit text-2xl font-bold text-[#E63946] mb-4">
          {t('cancel.title')}
        </h1>

        <p className="text-gray-600 mb-6">{t('cancel.body')}</p>

        <div className="flex flex-col gap-3">
          {memoryId && user && (
            <PaymentButton
              memoryId={memoryId}
              memoryTitle=""
              userId={user.id}
              className="w-full"
            />
          )}

          <Link
            href="/dashboard"
            className="btn-secondary w-full text-center"
          >
            {t('backToDashboard')}
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          <HeartIcon size={12} className="inline-block mr-1" />
          {t('cancel.note')}
        </p>
      </div>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <PaymentCancelFallback />
        </main>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}

function PaymentCancelFallback() {
  const t = useTranslations('common');
  return <HeartLoader message={t('state.loading')} size="lg" />;
}
