'use client';

import { useState } from 'react';
import HeartIcon from './HeartIcon';
import { X, Gift, Loader2 } from 'lucide-react';

interface ReferralSetupModalProps {
  isOpen: boolean;
  onSubmit: (code: string | null) => Promise<void>;
  onSkip: () => void;
}

export default function ReferralSetupModal({ isOpen, onSubmit, onSkip }: ReferralSetupModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (value: string) => {
    // Only allow alphanumeric, auto-uppercase, max 6 chars
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    setError(null);
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError('กรุณาใส่โค้ดให้ครบ 6 ตัว');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await onSubmit(null);
      onSkip();
    } catch {
      setError('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="memory-card p-6 max-w-md w-full animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gift size={24} className="text-[#E63946]" />
            <h2 className="text-xl font-bold text-[#E63946]">โค้ดแนะนำ</h2>
          </div>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Promo Text */}
        <div className="text-center mb-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
          <HeartIcon size={32} className="mx-auto mb-2 text-[#E63946]" filled />
          <p className="text-gray-700 font-medium">คุณมีโค้ดแนะนำหรือไม่?</p>
          <p className="text-sm text-gray-500 mt-1">
            ใส่โค้ดแนะนำเพื่อรับสิทธิ์สร้างความทรงจำฟรี 1 ครั้ง!
          </p>
        </div>

        {/* Code Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ใส่โค้ดแนะนำ 6 ตัว
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="เช่น ABC123"
            maxLength={6}
            className="input-valentine w-full text-center text-2xl tracking-[0.5em] font-mono uppercase"
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || code.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Gift size={18} />
            )}
            {loading ? 'กำลังตรวจสอบ...' : 'ใช้โค้ด'}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            ข้าม (ไม่มีโค้ด)
          </button>
        </div>
      </div>
    </div>
  );
}
