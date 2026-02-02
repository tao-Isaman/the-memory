'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Share2, Users, Gift, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ReferralStats, PaymentMethod } from '@/types/referral';

interface ReferralCodeDisplayProps {
  code: string;
  referralLink: string;
  stats: ReferralStats;
  userId: string;
  onClaimSuccess?: () => void;
}

interface ClaimRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentInfo: string;
  bankName: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
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
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');

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

  const fetchClaims = async () => {
    setLoadingClaims(true);
    try {
      const response = await fetch(`/api/referral/claim-discount?userId=${userId}`);
      const data = await response.json();
      if (data.claims) {
        setClaims(data.claims);
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [userId]);

  const handleSubmitClaim = async () => {
    if (claiming) return;

    // Validation
    if (!paymentInfo.trim()) {
      setClaimMessage('กรุณากรอกข้อมูลการรับเงิน');
      return;
    }

    if (paymentMethod === 'bank_transfer' && (!bankName.trim() || !accountName.trim())) {
      setClaimMessage('กรุณากรอกชื่อธนาคารและชื่อบัญชี');
      return;
    }

    setClaiming(true);
    setClaimMessage(null);

    try {
      const response = await fetch('/api/referral/claim-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paymentMethod,
          paymentInfo: paymentInfo.trim(),
          bankName: bankName.trim() || undefined,
          accountName: accountName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClaimMessage(data.message);
        setShowClaimForm(false);
        setPaymentInfo('');
        setBankName('');
        setAccountName('');
        fetchClaims();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
            <Clock size={12} />
            รอดำเนินการ
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle size={12} />
            โอนแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            <XCircle size={12} />
            ปฏิเสธ
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

      {/* Claim Section */}
      {stats.pendingDiscounts > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
          {!showClaimForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-800">
                  คุณมีสิทธิ์รับเงิน 50 บาท
                </p>
                <p className="text-sm text-yellow-600">
                  {stats.pendingDiscounts} สิทธิ์ (จากคนที่ชำระเงินผ่านลิงก์คุณ)
                </p>
              </div>
              <button
                onClick={() => setShowClaimForm(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Gift size={16} />
                ขอรับเงิน
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium text-yellow-800">กรอกข้อมูลรับเงิน</h4>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">วิธีรับเงิน</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'promptpay'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    PromptPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    โอนผ่านธนาคาร
                  </button>
                </div>
              </div>

              {/* PromptPay */}
              {paymentMethod === 'promptpay' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    เบอร์โทร PromptPay
                  </label>
                  <input
                    type="tel"
                    value={paymentInfo}
                    onChange={(e) => setPaymentInfo(e.target.value)}
                    placeholder="0812345678"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              )}

              {/* Bank Transfer */}
              {paymentMethod === 'bank_transfer' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">ธนาคาร</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">เลือกธนาคาร</option>
                      <option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
                      <option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
                      <option value="กรุงเทพ">กรุงเทพ (BBL)</option>
                      <option value="กรุงไทย">กรุงไทย (KTB)</option>
                      <option value="กรุงศรี">กรุงศรี (BAY)</option>
                      <option value="ทหารไทยธนชาต">ทหารไทยธนชาต (TTB)</option>
                      <option value="ออมสิน">ออมสิน (GSB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">เลขบัญชี</label>
                    <input
                      type="text"
                      value={paymentInfo}
                      onChange={(e) => setPaymentInfo(e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">ชื่อบัญชี</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="ชื่อ นามสกุล"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              {claimMessage && (
                <p className={`text-sm ${claimMessage.includes('สำเร็จ') ? 'text-green-600' : 'text-red-600'}`}>
                  {claimMessage}
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowClaimForm(false);
                    setClaimMessage(null);
                  }}
                  className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitClaim}
                  disabled={claiming}
                  className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {claiming ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Gift size={16} />
                  )}
                  {claiming ? 'กำลังส่ง...' : 'ยืนยันขอรับเงิน'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claim History */}
      {claims.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h4 className="font-medium text-gray-800">ประวัติการขอรับเงิน</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingClaims ? (
              <div className="p-4 text-center text-gray-500 text-sm">กำลังโหลด...</div>
            ) : (
              claims.map((claim) => (
                <div key={claim.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{claim.amount} บาท</span>
                    {getStatusBadge(claim.status)}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      {claim.paymentMethod === 'promptpay' ? 'PromptPay' : claim.bankName}: {claim.paymentInfo}
                    </p>
                    <p>ส่งคำขอเมื่อ: {formatDate(claim.createdAt)}</p>
                    {claim.processedAt && (
                      <p>ดำเนินการเมื่อ: {formatDate(claim.processedAt)}</p>
                    )}
                    {claim.adminNote && (
                      <p className="text-gray-600">หมายเหตุ: {claim.adminNote}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Claimed count info */}
      {stats.claimedDiscounts > 0 && claims.length === 0 && (
        <p className="text-xs text-gray-400 text-center">
          ขอรับเงินไปแล้ว {stats.claimedDiscounts} ครั้ง
        </p>
      )}
    </div>
  );
}
