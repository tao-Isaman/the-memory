'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useToast } from '@/hooks/useToast';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import { Phone, Cake, User, Briefcase, Heart, Gift } from 'lucide-react';
import { PROFILE_COMPLETION_CREDITS, JOB_OPTIONS } from '@/lib/constants';

// The DB stores the Thai job string (JOB_OPTIONS is the canonical value list); only the
// LABEL is translated, index-for-index, via profile.jobs. "Other" is the last entry — it
// unlocks the free-text input, so keep it last in JOB_OPTIONS.
const OTHER_JOB = JOB_OPTIONS[JOB_OPTIONS.length - 1];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { refresh: refreshCredits } = useCreditBalance();
  const { showToast } = useToast();
  const router = useRouter();
  const t = useTranslations('profile');

  const jobLabels = t.raw('jobs') as string[];

  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [job, setJob] = useState('');
  const [customJob, setCustomJob] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [occasionType, setOccasionType] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/profile?userId=${user.id}`);
        const data = await response.json();

        // If profile exists, redirect to dashboard
        if (data.profile) {
          router.push('/dashboard');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking profile:', error);
        setLoading(false);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user, router]);

  const handleSkip = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    const finalJob = job === OTHER_JOB ? customJob.trim() : job;

    if (!phone || !birthday || !gender || !finalJob || !relationshipStatus || !occasionType) {
      showToast(t('errors.INCOMPLETE_FORM'), 'error');
      return;
    }

    try {
      setSaving(true);

      // Save profile
      const profileResponse = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phone,
          birthday,
          gender,
          job: finalJob,
          relationshipStatus,
          occasionType,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to save profile');
      }

      // Check if all fields are filled
      const allFieldsFilled =
        phone.trim() !== '' &&
        birthday.trim() !== '' &&
        gender !== '' &&
        finalJob !== '' &&
        relationshipStatus !== '' &&
        occasionType !== '';

      // If all fields filled, claim credits
      if (allFieldsFilled) {
        try {
          const claimResponse = await fetch('/api/profile/claim-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });

          const claimData = await claimResponse.json();

          if (claimData.success && !claimData.alreadyClaimed) {
            // Show success message
            showToast(
              t('onboarding.claimedToast', { credits: PROFILE_COMPLETION_CREDITS }),
              'success',
            );
            // Refresh credit balance
            await refreshCredits();
          }
        } catch (claimError) {
          console.error('Error claiming credits:', claimError);
        }
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast(t('errors.GENERIC'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message={t('page.loading')} size="lg" />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen relative z-10">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-12">
        {/* Welcome header */}
        <div className="text-center mb-8">
          <HeartIcon size={64} className="mx-auto mb-4 animate-pulse-heart" />
          <h1 className="font-kanit text-2xl font-bold text-[#E63946]">
            {t('onboarding.welcome')}
          </h1>
          <p className="text-gray-500 mt-2">{t('onboarding.subtitle')}</p>
          <p className="text-sm text-pink-400 mt-1">
            {t('onboarding.rewardHint', { credits: PROFILE_COMPLETION_CREDITS })}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-6 space-y-5">
          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Phone size={16} className="text-[#E63946]" />
              {t('form.phone')}
            </label>
            <input
              type="tel"
              id="phone"
              placeholder={t('form.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Birthday */}
          <div>
            <label
              htmlFor="birthday"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Cake size={16} className="text-[#E63946]" />
              {t('form.birthday')}
            </label>
            <input
              type="date"
              id="birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <User size={16} className="text-[#E63946]" />
              {t('form.gender')}
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">{t('form.select')}</option>
              <option value="male">{t('gender.male')}</option>
              <option value="female">{t('gender.female')}</option>
              <option value="other">{t('gender.other')}</option>
            </select>
          </div>

          {/* Job */}
          <div>
            <label
              htmlFor="job"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Briefcase size={16} className="text-[#E63946]" />
              {t('form.job')}
            </label>
            <select
              id="job"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">{t('form.jobPlaceholder')}</option>
              {JOB_OPTIONS.map((option, index) => (
                <option key={option} value={option}>
                  {jobLabels[index] ?? option}
                </option>
              ))}
            </select>
            {job === OTHER_JOB && (
              <input
                type="text"
                value={customJob}
                onChange={(e) => setCustomJob(e.target.value)}
                placeholder={t('form.customJobPlaceholder')}
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all animate-fade-in-up"
              />
            )}
          </div>

          {/* Relationship Status */}
          <div>
            <label
              htmlFor="relationshipStatus"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Heart size={16} className="text-[#E63946]" />
              {t('form.relationship')}
            </label>
            <select
              id="relationshipStatus"
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">{t('form.select')}</option>
              <option value="single">{t('relationship.single')}</option>
              <option value="dating">{t('relationship.dating')}</option>
              <option value="married">{t('relationship.married')}</option>
              <option value="other">{t('relationship.other')}</option>
            </select>
          </div>

          {/* Occasion Type */}
          <div>
            <label
              htmlFor="occasionType"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Gift size={16} className="text-[#E63946]" />
              {t('form.occasion')}
            </label>
            <select
              id="occasionType"
              value={occasionType}
              onChange={(e) => setOccasionType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">{t('form.select')}</option>
              <option value="valentine">{t('occasion.valentine')}</option>
              <option value="anniversary">{t('occasion.anniversary')}</option>
              <option value="birthday">{t('occasion.birthday')}</option>
              <option value="other">{t('occasion.other')}</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border-2 border-pink-200 text-gray-500 font-kanit hover:bg-pink-50 transition-colors disabled:opacity-50"
          >
            {t('onboarding.skip')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#E63946] to-[#FF6B6B] text-white font-kanit font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? t('onboarding.saving') : t('onboarding.save')}
          </button>
        </div>
      </div>
    </main>
  );
}
