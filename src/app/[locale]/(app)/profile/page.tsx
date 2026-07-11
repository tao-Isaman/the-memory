'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useToast } from '@/hooks/useToast';
import HeartLoader from '@/components/HeartLoader';
import { ArrowLeft, Mail, Calendar, User, Phone, Cake, Briefcase, Heart, Gift } from 'lucide-react';
import { JOB_OPTIONS, PROFILE_COMPLETION_CREDITS } from '@/lib/constants';

// The DB stores the Thai job string (JOB_OPTIONS is the canonical value list); only the
// LABEL is translated, index-for-index, via profile.jobs. "Other" is the last entry — it
// unlocks the free-text input, so keep it last in JOB_OPTIONS.
const OTHER_JOB = JOB_OPTIONS[JOB_OPTIONS.length - 1];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { refresh } = useCreditBalance();
  const { showToast } = useToast();
  const router = useRouter();
  const t = useTranslations('profile');
  const format = useFormatter();

  const jobLabels = t.raw('jobs') as string[];

  // Profile state
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<'' | 'male' | 'female' | 'other'>('');
  const [job, setJob] = useState('');
  const [customJob, setCustomJob] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState<'' | 'single' | 'dating' | 'married' | 'other'>('');
  const [occasionType, setOccasionType] = useState<'' | 'valentine' | 'anniversary' | 'birthday' | 'other'>('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [creditsClaimed, setCreditsClaimed] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch profile data
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setProfileLoading(true);
      const response = await fetch(`/api/profile?userId=${user.id}`);
      const data = await response.json();

      if (data.profile) {
        setPhone(data.profile.phone || '');
        setBirthday(data.profile.birthday || '');
        setGender((data.profile.gender as '' | 'male' | 'female' | 'other') || '');

        // Handle Job logic
        const loadedJob = data.profile.job || '';
        if (loadedJob && !JOB_OPTIONS.includes(loadedJob)) {
          setJob(OTHER_JOB);
          setCustomJob(loadedJob);
        } else {
          setJob(loadedJob);
          setCustomJob('');
        }

        setRelationshipStatus((data.profile.relationshipStatus as '' | 'single' | 'dating' | 'married' | 'other') || '');
        setOccasionType((data.profile.occasionType as '' | 'valentine' | 'anniversary' | 'birthday' | 'other') || '');
      }

      setIsComplete(data.isComplete);
      setCreditsClaimed(data.creditsClaimed);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Check validation
    const finalJob = job === OTHER_JOB ? customJob.trim() : job;

    if (!phone || !birthday || !gender || !finalJob || !relationshipStatus || !occasionType) {
      showToast(t('errors.INCOMPLETE_FORM'), 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phone,
          birthday,
          gender: gender || null,
          job: finalJob,
          relationshipStatus: relationshipStatus || null,
          occasionType: occasionType || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      // Re-fetch profile to update isComplete/creditsClaimed
      await fetchProfile();

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast(t('errors.SAVE_FAILED'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClaimCredits = async () => {
    if (!user || claiming) return;

    try {
      setClaiming(true);
      const response = await fetch('/api/profile/claim-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'CLAIM_FAILED');
      }

      setJustClaimed(true);
      setCreditsClaimed(true);

      // Clear profile banner dismissal from localStorage
      localStorage.removeItem('profile_banner_dismissed');

      // Refresh credit balance in AppBar
      refresh();

      setTimeout(() => setJustClaimed(false), 5000);
    } catch (error) {
      console.error('Error claiming credits:', error);
      // The API may answer with a code we know, or with prose we don't — fall back to a
      // generic translated message so a server string never leaks into an EN/ID screen.
      const code = error instanceof Error ? error.message : 'CLAIM_FAILED';
      showToast(t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.CLAIM_FAILED'), 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message={t('page.loading')} size="lg" />
      </main>
    );
  }

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || t('info.noName');
  const initials = fullName.charAt(0).toUpperCase();
  const memberSince = format.dateTime(new Date(user.created_at), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen relative z-10">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-12">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#E63946] transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>{t('page.back')}</span>
        </Link>

        {/* Avatar + Name */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-pink-200 mb-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="w-full h-full bg-gradient-to-r from-[#FF6B9D] to-[#E63946] flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        {/* Info Card */}
        <div className="memory-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
              <User size={18} className="text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('info.name')}</p>
              <p className="text-sm font-medium text-gray-800">{fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
              <Mail size={18} className="text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('info.email')}</p>
              <p className="text-sm font-medium text-gray-800">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
              <Calendar size={18} className="text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('info.memberSince')}</p>
              <p className="text-sm font-medium text-gray-800">{memberSince}</p>
            </div>
          </div>
        </div>

        {/* Credit Reward Banner */}
        {isComplete && !creditsClaimed && (
          <div className="mt-4 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-xl p-4 flex items-center gap-3">
            <Gift className="text-[#E63946] flex-shrink-0" size={24} />
            <div className="flex-1">
              <p className="font-kanit font-medium text-[#E63946]">{t('reward.title')}</p>
              <p className="text-sm text-gray-500">
                {t('reward.subtitle', { credits: PROFILE_COMPLETION_CREDITS })}
              </p>
            </div>
            <button
              onClick={handleClaimCredits}
              disabled={claiming}
              className="px-4 py-2 bg-[#E63946] text-white rounded-lg font-kanit text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {claiming ? t('reward.claiming') : t('reward.claim')}
            </button>
          </div>
        )}

        {/* Success Message */}
        {justClaimed && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="font-kanit font-medium text-green-600">
              {t('reward.claimed', { credits: PROFILE_COMPLETION_CREDITS })}
            </p>
          </div>
        )}

        {/* Editable Profile Section */}
        <h3 className="font-kanit text-lg font-semibold text-gray-800 mt-8 mb-4">
          {t('form.sectionTitle')}
        </h3>

        <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-5 space-y-4">
          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 font-kanit">
              <Phone size={16} className="text-pink-400" />
              {t('form.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('form.phonePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 font-kanit">
              <Cake size={16} className="text-pink-400" />
              {t('form.birthday')}
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 font-kanit">
              <User size={16} className="text-pink-400" />
              {t('form.gender')}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as '' | 'male' | 'female' | 'other')}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">{t('form.select')}</option>
              <option value="male">{t('gender.male')}</option>
              <option value="female">{t('gender.female')}</option>
              <option value="other">{t('gender.other')}</option>
            </select>
          </div>

          {/* Job */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 font-kanit">
              <Briefcase size={16} className="text-pink-400" />
              {t('form.job')}
            </label>
            <select
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
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
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all animate-fade-in-up"
              />
            )}
          </div>

          {/* Relationship Status */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 font-kanit">
              <Heart size={16} className="text-pink-400" />
              {t('form.relationship')}
            </label>
            <select
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value as '' | 'single' | 'dating' | 'married' | 'other')}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1 font-kanit">
              <Gift size={16} className="text-pink-400" />
              {t('form.occasion')}
            </label>
            <select
              value={occasionType}
              onChange={(e) => setOccasionType(e.target.value as '' | 'valentine' | 'anniversary' | 'birthday' | 'other')}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">{t('form.select')}</option>
              <option value="valentine">{t('occasion.valentine')}</option>
              <option value="anniversary">{t('occasion.anniversary')}</option>
              <option value="birthday">{t('occasion.birthday')}</option>
              <option value="other">{t('occasion.other')}</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#E63946] to-[#FF6B6B] text-white font-kanit font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? t('form.saving') : t('form.save')}
        </button>

        {/* Save Success Message */}
        {saved && (
          <p className="text-center text-green-500 text-sm mt-2 font-kanit">
            {t('form.saved')}
          </p>
        )}
      </div>
    </main>
  );
}
