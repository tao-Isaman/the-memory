'use client';

import { useState } from 'react';
import { X, Wallet, Loader2, Smartphone, Building, CheckCircle } from 'lucide-react';
import HeartIcon from './HeartIcon';
import { PaymentMethod } from '@/types/referral';

interface ClaimMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (remainingClaims: number) => void;
  userId: string;
  pendingClaims: number;
}

const THAI_BANKS = [
  { value: 'kbank', label: 'ธนาคารกสิกรไทย' },
  { value: 'ktb', label: 'ธนาคารกรุงไทย' },
  { value: 'bbl', label: 'ธนาคารกรุงเทพ' },
  { value: 'scb', label: 'ธนาคารไทยพาณิชย์' },
  { value: 'bay', label: 'ธนาคารกรุงศรีอยุธยา' },
  { value: 'ttb', label: 'ธนาคารทหารไทยธนชาต (TTB)' },
  { value: 'gsb', label: 'ธนาคารออมสิน' },
  { value: 'other', label: 'อื่นๆ' },
];

export default function ClaimMoneyModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  pendingClaims,
}: ClaimMoneyModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return /^0[0-9]{9}$/.test(cleaned);
  };

  const validateBankTransfer = (): boolean => {
    return (
      bankName.trim() !== '' &&
      accountNumber.trim().length >= 10 &&
      accountName.trim().length >= 2
    );
  };

  const handlePhoneChange = (value: string) => {
    // Only allow numbers, max 10 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
    setError(null);
  };

  const handleAccountNumberChange = (value: string) => {
    // Only allow numbers
    const cleaned = value.replace(/\D/g, '');
    setAccountNumber(cleaned);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (paymentMethod === 'promptpay') {
      if (!validatePhone(phoneNumber)) {
        setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลักที่ถูกต้อง');
        return;
      }
    } else {
      if (!validateBankTransfer()) {
        setError('กรุณากรอกข้อมูลธนาคารให้ครบถ้วน');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/referral/claim-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paymentMethod,
          paymentInfo: paymentMethod === 'promptpay' ? phoneNumber : accountNumber,
          bankName: paymentMethod === 'bank_transfer' ? bankName : undefined,
          accountName: paymentMethod === 'bank_transfer' ? accountName : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด');
      }

      setShowSuccess(true);
      onSuccess(data.remainingClaims);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setPaymentMethod('promptpay');
    setPhoneNumber('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  const claimAmount = 50; // Fixed 50 THB per claim

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="memory-card p-6 max-w-md w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet size={24} className="text-green-600" />
            <h2 className="text-xl font-bold text-green-700">ขอรับเงิน</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {showSuccess ? (
          // Success View
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-700 mb-2">
              ส่งคำขอสำเร็จ!
            </h3>
            <p className="text-gray-600 mb-4">
              คำขอรับเงิน {claimAmount} บาท ถูกส่งแล้ว
              <br />
              กรุณารอแอดมินตรวจสอบและโอนเงินให้
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {paymentMethod === 'promptpay'
                ? `พร้อมเพย์: ${phoneNumber}`
                : `${bankName} เลขบัญชี: ${accountNumber}`
              }
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              เสร็จสิ้น
            </button>
          </div>
        ) : (
          <>
            {/* Amount Info */}
            <div className="text-center mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <Wallet size={32} className="mx-auto mb-2 text-green-600" />
              <p className="text-gray-700 font-medium">จำนวนเงินที่จะได้รับ</p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {claimAmount} บาท
              </p>
              <p className="text-sm text-gray-500 mt-1">
                (1 สิทธิ์จาก {pendingClaims} สิทธิ์ที่มี)
              </p>
            </div>

            {/* Payment Method Tabs */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกวิธีรับเงิน
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('promptpay');
                    setError(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'promptpay'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Smartphone size={18} />
                  <span className="font-medium">พร้อมเพย์</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    setError(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building size={18} />
                  <span className="font-medium">โอนธนาคาร</span>
                </button>
              </div>
            </div>

            {/* PromptPay Form */}
            {paymentMethod === 'promptpay' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์ (พร้อมเพย์)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="0812345678"
                  className="input-valentine w-full text-center text-lg tracking-wider"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  กรอกเบอร์โทรศัพท์ที่ลงทะเบียนพร้อมเพย์
                </p>
              </div>
            )}

            {/* Bank Transfer Form */}
            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ธนาคาร
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      setError(null);
                    }}
                    className="input-valentine w-full"
                    disabled={loading}
                  >
                    <option value="">-- เลือกธนาคาร --</option>
                    {THAI_BANKS.map((bank) => (
                      <option key={bank.value} value={bank.label}>
                        {bank.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลขบัญชี
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    placeholder="1234567890"
                    className="input-valentine w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อบัญชี
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      setError(null);
                    }}
                    placeholder="ชื่อ นามสกุล"
                    className="input-valentine w-full"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  กำลังส่งคำขอ...
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  ยืนยันขอรับเงิน {claimAmount} บาท
                </>
              )}
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
          </>
        )}
      </div>
    </div>
  );
}
