'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, X, Sparkles } from 'lucide-react';
import { PROFILE_COMPLETION_CREDITS } from '@/lib/constants';

interface ProfileCompletionBannerProps {
  userId: string;
}

export default function ProfileCompletionBanner({ userId }: ProfileCompletionBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkProfile = async () => {
      const dismissed = localStorage.getItem('profile_banner_dismissed');
      if (dismissed === 'true') {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/profile?userId=${userId}`);
        const data = await response.json();

        if (data.isComplete && data.creditsClaimed) {
          setIsVisible(false);
        } else {
          const shouldShow =
            !data.profile ||
            !data.isComplete ||
            (data.isComplete && !data.creditsClaimed);
          setIsVisible(shouldShow);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setIsVisible(true);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [userId]);

  const handleDismiss = () => {
    localStorage.setItem('profile_banner_dismissed', 'true');
    setIsVisible(false);
  };

  const handleGoToProfile = () => {
    setIsVisible(false);
    router.push('/profile');
  };

  if (loading || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="ปิด"
        >
          <X size={18} className="text-gray-400" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center">
            <Gift size={32} className="text-[#E63946]" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="font-kanit text-xl font-bold text-gray-800 mb-2">
            กรอกโปรไฟล์ รับเครดิตฟรี!
          </h3>
          <p className="text-gray-500 text-sm mb-3">
            บอกเราเพิ่มเติมเกี่ยวกับตัวคุณ แล้วรับของขวัญจากเรา
          </p>
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-full px-4 py-1.5">
            <Sparkles size={16} className="text-[#E63946]" />
            <span className="font-kanit font-semibold text-[#E63946]">
              {PROFILE_COMPLETION_CREDITS} เครดิตฟรี
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-kanit text-sm hover:bg-gray-50 transition-colors"
          >
            ไว้ทีหลัง
          </button>
          <button
            onClick={handleGoToProfile}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E63946] to-[#FF6B6B] text-white font-kanit font-semibold text-sm hover:shadow-lg transition-all"
          >
            ไปกรอกเลย
          </button>
        </div>
      </div>
    </div>
  );
}
