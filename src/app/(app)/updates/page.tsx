'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, Wrench, Bug, Megaphone } from 'lucide-react';
import HeartIcon from '@/components/HeartIcon';
import { patchNotes, getLatestVersion, PatchItemType } from '@/data/patch-notes';
import { setLastSeenVersion } from '@/lib/patch-notes';

const itemTypeConfig: Record<PatchItemType, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  feature: {
    label: 'ใหม่',
    icon: Star,
    className: 'bg-pink-100 text-[#E63946]',
  },
  improvement: {
    label: 'ปรับปรุง',
    icon: Wrench,
    className: 'bg-blue-100 text-blue-700',
  },
  fix: {
    label: 'แก้ไข',
    icon: Bug,
    className: 'bg-green-100 text-green-700',
  },
  announcement: {
    label: 'ประกาศ',
    icon: Megaphone,
    className: 'bg-yellow-100 text-yellow-700',
  },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function UpdatesPage() {
  useEffect(() => {
    setLastSeenVersion(getLatestVersion());
  }, []);

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
          <span>กลับไปหน้าหลัก</span>
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#E63946] flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">มีอะไรใหม่</h2>
            <p className="text-sm text-gray-500">อัปเดตและปรับปรุงล่าสุด</p>
          </div>
        </div>

        {/* Patch Notes Timeline */}
        <div className="space-y-6">
          {patchNotes.map((note, index) => (
            <div
              key={note.version}
              className="memory-card p-5 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Version + Date header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-gradient-to-r from-[#FF6B9D] to-[#E63946] text-white px-2.5 py-0.5 rounded-full">
                    v{note.version}
                  </span>
                  {index === 0 && (
                    <span className="text-xs font-medium bg-pink-100 text-[#E63946] px-2 py-0.5 rounded-full animate-pulse-heart">
                      ล่าสุด
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(note.date)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-kanit text-lg font-bold text-gray-800 mb-1">
                {note.title}
              </h3>
              {note.summary && (
                <p className="text-sm text-gray-500 mb-3">{note.summary}</p>
              )}

              {/* Items */}
              <ul className="space-y-2">
                {note.items.map((item, itemIndex) => {
                  const config = itemTypeConfig[item.type];
                  const ItemIcon = config.icon;
                  return (
                    <li key={itemIndex} className="flex items-start gap-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${config.className}`}>
                        <ItemIcon size={12} />
                        {config.label}
                      </span>
                      <span className="text-sm text-gray-700">{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>
            สร้างด้วย{' '}
            <HeartIcon size={14} className="inline-block align-middle mx-1" />
            {' '}สำหรับช่วงเวลาพิเศษของคุณ
          </p>
        </div>
      </div>
    </main>
  );
}
