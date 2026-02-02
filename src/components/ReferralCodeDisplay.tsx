'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Users, Gift, CheckCircle, Clock, Wallet } from 'lucide-react';
import { ReferralStats } from '@/types/referral';
import ClaimMoneyModal from './ClaimMoneyModal';
import ClaimHistorySection from './ClaimHistorySection';

interface ReferralCodeDisplayProps {
  code: string;
  stats: ReferralStats;
  userId: string;
}

interface ReferredUser {
  userId: string;
  appliedAt: string;
  hasPaid: boolean;
  usedDiscount: boolean;
}

export default function ReferralCodeDisplay({
  code,
  stats,
  userId,
}: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [currentPendingClaims, setCurrentPendingClaims] = useState(stats.pendingDiscounts);
  const [claimHistoryRefresh, setClaimHistoryRefresh] = useState(0);

  const handleClaimSuccess = (remainingClaims: number) => {
    setCurrentPendingClaims(remainingClaims);
    setClaimHistoryRefresh((prev) => prev + 1);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Fetch referred users
  useEffect(() => {
    const fetchReferredUsers = async () => {
      try {
        const response = await fetch(`/api/referral/referred-users?userId=${userId}`);
        const data = await response.json();
        if (data.users) {
          setReferredUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching referred users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchReferredUsers();
  }, [userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

      {/* Claim Money Section */}
      {currentPendingClaims > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                คุณมี <span className="font-bold text-green-600">{currentPendingClaims}</span> สิทธิ์รับเงิน
              </p>
              <p className="text-lg font-bold text-green-700">
                รวม {currentPendingClaims * 50} บาท
              </p>
            </div>
            <button
              onClick={() => setShowClaimModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Wallet size={18} />
              ขอรับเงิน
            </button>
          </div>
        </div>
      )}

      {/* Referred Users List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="font-medium text-gray-800">รายชื่อผู้ใช้โค้ด</h4>
        </div>

        {loadingUsers ? (
          <div className="p-4 text-center text-gray-500 text-sm">กำลังโหลด...</div>
        ) : referredUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">ยังไม่มีผู้ใช้โค้ดของคุณ</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {referredUsers.map((user, index) => (
              <div key={user.userId} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-[#E63946] font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      ผู้ใช้ #{user.userId.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-400">
                      ใช้โค้ดเมื่อ {formatDate(user.appliedAt)}
                    </p>
                  </div>
                </div>
                <div>
                  {user.hasPaid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <CheckCircle size={12} />
                      ชำระแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                      <Clock size={12} />
                      รอชำระ
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim History Section */}
      <ClaimHistorySection userId={userId} refreshTrigger={claimHistoryRefresh} />

      {/* Claim Money Modal */}
      <ClaimMoneyModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSuccess={handleClaimSuccess}
        userId={userId}
        pendingClaims={currentPendingClaims}
      />
    </div>
  );
}
