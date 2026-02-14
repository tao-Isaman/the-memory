'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useToast } from '@/hooks/useToast';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import { Phone, Cake, User, Briefcase, Heart, Gift } from 'lucide-react';
import { PROFILE_COMPLETION_CREDITS, JOB_OPTIONS } from '@/lib/constants';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { refresh: refreshCredits } = useCreditBalance();
  const { showToast } = useToast();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [job, setJob] = useState('');
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
    if (!phone || !birthday || !gender || !job || !relationshipStatus || !occasionType) {
      showToast('กรุณากรอกข้อมูลให้ครบทุกช่องเพื่อรับเครดิตฟรี', 'error');
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
          job,
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
        job.trim() !== '' &&
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
            showToast(`ยินดีด้วย! คุณได้รับ ${PROFILE_COMPLETION_CREDITS} เครดิตฟรี`, 'success');
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
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message="กำลังเชื่อมต่อ..." size="lg" />
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
          <h1 className="font-kanit text-2xl font-bold text-[#E63946]">ยินดีต้อนรับ!</h1>
          <p className="text-gray-500 mt-2">บอกเราเพิ่มเติมเกี่ยวกับตัวคุณ</p>
          <p className="text-sm text-pink-400 mt-1">
            กรอกครบ 6 ข้อ รับ {PROFILE_COMPLETION_CREDITS} เครดิตฟรี!
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
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="08X-XXX-XXXX"
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
              วันเกิด
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
              เพศ
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">เลือก...</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>

          {/* Job */}
          <div>
            <label
              htmlFor="job"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Briefcase size={16} className="text-[#E63946]" />
              อาชีพ
            </label>
            <select
              id="job"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">เลือกอาชีพ...</option>
              {JOB_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Relationship Status */}
          <div>
            <label
              htmlFor="relationshipStatus"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Heart size={16} className="text-[#E63946]" />
              สถานะความสัมพันธ์
            </label>
            <select
              id="relationshipStatus"
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">เลือก...</option>
              <option value="single">โสด</option>
              <option value="dating">คบหาดูใจ</option>
              <option value="married">แต่งงาน</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>

          {/* Occasion Type */}
          <div>
            <label
              htmlFor="occasionType"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
            >
              <Gift size={16} className="text-[#E63946]" />
              โอกาสที่ต้องการสร้าง
            </label>
            <select
              id="occasionType"
              value={occasionType}
              onChange={(e) => setOccasionType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            >
              <option value="">เลือก...</option>
              <option value="valentine">วาเลนไทน์</option>
              <option value="anniversary">วันครบรอบ</option>
              <option value="birthday">วันเกิด</option>
              <option value="other">อื่นๆ</option>
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
            ข้ามไปก่อน
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#E63946] to-[#FF6B6B] text-white font-kanit font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </main>
  );
}
