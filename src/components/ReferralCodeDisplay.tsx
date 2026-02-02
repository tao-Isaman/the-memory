'use client';

import { useState } from 'react';
import { Copy, Check, Share2, Users, Gift, Loader2 } from 'lucide-react';
import { ReferralStats } from '@/types/referral';

interface ReferralCodeDisplayProps {
  code: string;
  referralLink: string;
  stats: ReferralStats;
  userId: string;
  onClaimSuccess?: () => void;
}

export default function ReferralCodeDisplay({
  code,
  referralLink,
  stats,
  userId,
  onClaimSuccess,
}: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'แนะนำ The Memory',
          text: `สร้างความทรงจำสุดพิเศษให้คนที่คุณรัก! ใช้ลิงก์นี้เพื่อเริ่มต้น`,
          url: referralLink,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleClaimDiscount = async () => {
    if (claiming || stats.pendingDiscounts <= 0) return;

    setClaiming(true);
    setClaimMessage(null);

    try {
      const response = await fetch('/api/referral/claim-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setClaimMessage(data.message);
        onClaimSuccess?.();
      } else {
        setClaimMessage(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      setClaimMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral Link Section */}
      <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-4 border border-pink-200">
        <p className="text-xs text-gray-500 mb-2">ลิงก์แนะนำของคุณ</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-white/50 rounded-lg px-3 py-2 text-sm text-gray-700 border border-pink-100 truncate"
          />
          <button
            onClick={handleCopyLink}
            className={`p-2 rounded-full transition-all ${
              copiedLink
                ? 'bg-green-500 text-white'
                : 'bg-white text-[#E63946] hover:bg-pink-100 border border-pink-200'
            }`}
            title={copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
          >
            {copiedLink ? <Check size={18} /> : <Copy size={18} />}
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

        {/* Code display */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">โค้ด</p>
            <p className="text-lg font-mono font-bold text-[#E63946] tracking-wider">
              {code}
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-white text-[#E63946] hover:bg-pink-100 border border-pink-200'
            }`}
          >
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Users size={14} />
            <span className="text-xs">สมัครแล้ว</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalSignups}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Gift size={14} />
            <span className="text-xs">ชำระเงินแล้ว</span>
          </div>
          <p className="text-2xl font-bold text-[#E63946]">{stats.totalPaidConversions}</p>
        </div>
      </div>

      {/* Discount Claims Section */}
      {stats.pendingDiscounts > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">
                คุณมีสิทธิ์ส่วนลด 50%
              </p>
              <p className="text-sm text-yellow-600">
                {stats.pendingDiscounts} สิทธิ์ (จากคนที่ชำระเงินผ่านลิงก์คุณ)
              </p>
            </div>
            <button
              onClick={handleClaimDiscount}
              disabled={claiming}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {claiming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Gift size={16} />
              )}
              ขอรับส่วนลด
            </button>
          </div>
          {claimMessage && (
            <p className={`mt-2 text-sm ${claimMessage.includes('สำเร็จ') ? 'text-green-600' : 'text-red-600'}`}>
              {claimMessage}
            </p>
          )}
        </div>
      )}

      {/* Claimed discounts info */}
      {stats.claimedDiscounts > 0 && (
        <p className="text-xs text-gray-400 text-center">
          ขอรับส่วนลดไปแล้ว {stats.claimedDiscounts} ครั้ง
        </p>
      )}
    </div>
  );
}
