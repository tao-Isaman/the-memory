'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import ReferralSetupModal from '@/components/ReferralSetupModal';
import ReferralCodeDisplay from '@/components/ReferralCodeDisplay';
import LinkReferralCodeModal from '@/components/LinkReferralCodeModal';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { ReferralStats } from '@/types/referral';

// Fixed reward/discount, in THB for every locale (deliberate product decision).
const REFERRAL_AMOUNT_THB = 50;

interface ReferralStatusResponse {
  hasReferral: boolean;
  referralCode: string | null;
  referralLink: string | null;
  referredBy: string | null;
  stats: ReferralStats;
}

export default function ReferralPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('referral');
  const [showReferralSetup, setShowReferralSetup] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [referralStatus, setReferralStatus] = useState<ReferralStatusResponse | null>(null);
  const [referralLoading, setReferralLoading] = useState(true);

  const checkReferralStatus = useCallback(async () => {
    if (!user) return;
    setReferralLoading(true);
    try {
      const response = await fetch(`/api/referral/status?userId=${user.id}`);
      const data = await response.json();
      setReferralStatus(data);

      // Show setup modal if user doesn't have a referral record yet
      if (!data.hasReferral) {
        setShowReferralSetup(true);
      }
    } catch (error) {
      console.error('Error checking referral status:', error);
    } finally {
      setReferralLoading(false);
    }
  }, [user]);

  const handleReferralSetup = async (code: string | null) => {
    if (!user) return;

    const response = await fetch('/api/referral/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        referralCode: code,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'GENERIC');
    }

    // Refresh referral status
    await checkReferralStatus();
    setShowReferralSetup(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      checkReferralStatus();
    }
  }, [user, checkReferralStatus]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message={t('page.loading')} size="lg" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen relative z-10">
      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-12">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#E63946] transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>{t('page.back')}</span>
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#E63946] flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('page.title')}</h2>
            <p className="text-sm text-gray-500">
              {t('page.subtitle', { amount: REFERRAL_AMOUNT_THB })}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="memory-card p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">{t('howItWorks.title')}</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[#E63946] font-bold">1.</span>
              <span>{t('howItWorks.step1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#E63946] font-bold">2.</span>
              <span>{t('howItWorks.step2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#E63946] font-bold">3.</span>
              <span>
                {t.rich('howItWorks.step3', {
                  amount: REFERRAL_AMOUNT_THB,
                  amt: (chunks) => (
                    <span className="font-bold text-[#E63946]">{chunks}</span>
                  ),
                })}
              </span>
            </li>
          </ul>
        </div>

        {/* Referral Content */}
        {referralLoading ? (
          <div className="text-center py-12">
            <HeartLoader message={t('page.loadingData')} size="md" />
          </div>
        ) : referralStatus?.referralCode ? (
          <>
            <ReferralCodeDisplay
              code={referralStatus.referralCode}
              stats={referralStatus.stats}
              userId={user.id}
            />

            {/* Link referral code button - only show if user hasn't linked one */}
            {referralStatus.hasReferral && !referralStatus.referredBy && (
              <button
                onClick={() => setShowLinkModal(true)}
                className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-xl text-[#E63946] font-medium hover:from-pink-100 hover:to-red-100 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                {t('haveFriendCode')}
              </button>
            )}
          </>
        ) : (
          <div className="memory-card p-6 text-center">
            <HeartIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 mb-4">{t('empty.text')}</p>
            <button
              onClick={() => setShowReferralSetup(true)}
              className="btn-primary"
            >
              {t('empty.cta')}
            </button>
          </div>
        )}
      </div>

      {/* Referral Setup Modal */}
      <ReferralSetupModal
        isOpen={showReferralSetup}
        onSubmit={handleReferralSetup}
        onSkip={() => setShowReferralSetup(false)}
      />

      {/* Link Referral Code Modal */}
      <LinkReferralCodeModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSuccess={() => {
          setShowLinkModal(false);
          checkReferralStatus();
        }}
        userId={user.id}
      />
    </main>
  );
}
