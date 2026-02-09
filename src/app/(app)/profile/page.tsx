'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import HeartLoader from '@/components/HeartLoader';
import { ArrowLeft, Mail, Calendar, User } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message="กำลังเชื่อมต่อ..." size="lg" />
      </main>
    );
  }

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || 'ไม่ระบุชื่อ';
  const initials = fullName.charAt(0).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('th-TH', {
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
          <span>กลับไปหน้าหลัก</span>
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
              <p className="text-xs text-gray-400">ชื่อ</p>
              <p className="text-sm font-medium text-gray-800">{fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
              <Mail size={18} className="text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">อีเมล</p>
              <p className="text-sm font-medium text-gray-800">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
              <Calendar size={18} className="text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">สมาชิกตั้งแต่</p>
              <p className="text-sm font-medium text-gray-800">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
