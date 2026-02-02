'use client';

import { useState } from 'react';
import { Copy, Check, Share2, Users } from 'lucide-react';

interface ReferralCodeDisplayProps {
  code: string;
  referralCount?: number;
}

export default function ReferralCodeDisplay({ code, referralCount = 0 }: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'โค้ดแนะนำ The Memory',
          text: `ใช้โค้ดแนะนำของฉัน "${code}" เพื่อรับสิทธิ์สร้างความทรงจำฟรี 1 ครั้ง!`,
          url: typeof window !== 'undefined' ? window.location.origin : '',
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-4 border border-pink-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">โค้ดแนะนำของคุณ</p>
          <p className="text-xl font-mono font-bold text-[#E63946] tracking-wider">
            {code}
          </p>
          {referralCount > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Users size={12} />
              <span>{referralCount} คนใช้โค้ดของคุณแล้ว</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`p-2 rounded-full transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-white text-[#E63946] hover:bg-pink-100 border border-pink-200'
            }`}
            title={copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white text-[#E63946] hover:bg-pink-100 border border-pink-200 transition-all"
              title="แชร์"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
