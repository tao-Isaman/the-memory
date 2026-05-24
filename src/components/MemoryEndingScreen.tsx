'use client';

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { ThemeColors } from '@/lib/themes';
import HeartIcon from './HeartIcon';

interface MemoryEndingScreenProps {
  themeColors: ThemeColors;
  isOwner: boolean;
  isPreviewMode: boolean;
  editHref: string;
  onReplay: () => void;
  onCreateOwn: () => void;
}

/**
 * The "fin" screen shown after the last story. Turns the old dead-end into a
 * celebratory moment that (for recipients) drives the view→creator loop.
 */
export default function MemoryEndingScreen({
  themeColors,
  isOwner,
  isPreviewMode,
  editHref,
  onReplay,
  onCreateOwn,
}: MemoryEndingScreenProps) {
  const primaryGradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`;
  const primaryClass =
    'flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-95';
  const secondaryClass =
    'flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium border bg-white/40 backdrop-blur-sm transition-all duration-300 hover:bg-black/5 active:scale-95';

  const ReplayButton = (
    <button
      onClick={onReplay}
      className={secondaryClass}
      style={{ color: themeColors.dark, borderColor: `${themeColors.dark}33` }}
    >
      <RotateCcw size={16} />
      ดูอีกครั้ง
    </button>
  );

  return (
    <div className="relative z-50 grow flex flex-col items-center justify-center px-6 text-center animate-fade-in-up">
      {/* Glowing heart */}
      <div className="relative mb-6 flex items-center justify-center" style={{ width: 96, height: 96 }}>
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ backgroundColor: `${themeColors.primary}40` }}
        />
        <HeartIcon
          size={72}
          filled
          className="relative animate-pulse-heart"
          style={{ color: themeColors.primary }}
        />
      </div>

      {isOwner ? (
        <>
          <h2 className="font-kanit text-2xl font-bold mb-2" style={{ color: themeColors.dark }}>
            ดูจบแล้ว 🎉
          </h2>
          <p className="text-sm mb-8 max-w-xs" style={{ color: `${themeColors.dark}cc` }}>
            {isPreviewMode
              ? 'นี่คือสิ่งที่คนรับจะได้เห็น เปิดใช้งานเพื่อส่งให้คนสำคัญ'
              : 'ความทรงจำของคุณพร้อมส่งให้คนสำคัญแล้ว'}
          </p>
          <div className="flex flex-col items-stretch gap-3 w-full max-w-xs">
            <Link
              href={isPreviewMode ? editHref : '/dashboard'}
              className={primaryClass}
              style={{ background: primaryGradient, boxShadow: `0 8px 25px ${themeColors.dark}50` }}
            >
              {isPreviewMode ? 'แก้ไขต่อ' : 'ไปที่แดชบอร์ด'}
              <HeartIcon size={18} filled color="white" />
            </Link>
            {ReplayButton}
          </div>
        </>
      ) : (
        <>
          <h2 className="font-kanit text-2xl font-bold mb-2" style={{ color: themeColors.dark }}>
            หวังว่าคุณจะชอบนะ 💕
          </h2>
          <p className="text-sm mb-8 max-w-xs" style={{ color: `${themeColors.dark}cc` }}>
            อยากสร้างความทรงจำแบบนี้ให้คนสำคัญของคุณบ้างไหม?
          </p>
          <div className="flex flex-col items-stretch gap-3 w-full max-w-xs">
            <button
              onClick={onCreateOwn}
              className={primaryClass}
              style={{ background: primaryGradient, boxShadow: `0 8px 25px ${themeColors.dark}50` }}
            >
              สร้างความทรงจำของคุณเอง
              <HeartIcon size={18} filled color="white" />
            </button>
            {ReplayButton}
            <p className="text-xs mt-1" style={{ color: `${themeColors.dark}99` }}>
              เริ่มต้นฟรี · ดูตัวอย่างก่อนได้
            </p>
          </div>
        </>
      )}
    </div>
  );
}
