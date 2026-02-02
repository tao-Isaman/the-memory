'use client';

import { useState } from 'react';
import { Copy, Check, Users, Gift } from 'lucide-react';
import { ReferralStats } from '@/types/referral';

interface ReferralCodeDisplayProps {
  code: string;
  stats: ReferralStats;
}

export default function ReferralCodeDisplay({
  code,
  stats,
}: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral Code Section */}
      <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-4 border border-pink-200">
        <p className="text-xs text-gray-500 mb-2">โค้ดแนะนำของคุณ</p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-mono font-bold text-[#E63946] tracking-widest">
            {code}
          </p>
          <button
            onClick={handleCopyCode}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-white text-[#E63946] hover:bg-pink-100 border border-pink-200'
            }`}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
          </button>
        </div>

        {/* How it works */}
        <div className="mt-4 p-3 bg-white/50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">วิธีใช้:</span> บอกโค้ดนี้ให้เพื่อนหรือคนรู้จัก
            เมื่อพวกเขาใช้โค้ดตอนสมัครและชำระเงินครั้งแรก จะได้รับส่วนลด <span className="font-bold text-[#E63946]">50 บาท</span> ทันที!
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Users size={14} />
            <span className="text-xs">ใช้โค้ดแล้ว</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalSignups}</p>
          <p className="text-xs text-gray-400">คน</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Gift size={14} />
            <span className="text-xs">ชำระเงินแล้ว</span>
          </div>
          <p className="text-2xl font-bold text-[#E63946]">{stats.totalPaidConversions}</p>
          <p className="text-xs text-gray-400">คน</p>
        </div>
      </div>

      {/* Info note */}
      <p className="text-xs text-gray-400 text-center">
        สถิตินี้แสดงจำนวนคนที่ใช้โค้ดของคุณและชำระเงินสำเร็จ
      </p>
    </div>
  );
}
