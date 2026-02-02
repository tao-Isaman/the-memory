'use client';

import { useState } from 'react';
import HeartIcon from './HeartIcon';
import { X, Gift, CreditCard, Loader2, Sparkles } from 'lucide-react';

interface FreeMemoryOptionProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  memoryTitle: string;
  onUseFree: () => Promise<void>;
  onPayNormally: () => void;
}

export default function FreeMemoryOption({
  isOpen,
  onClose,
  memoryTitle,
  onUseFree,
  onPayNormally,
}: FreeMemoryOptionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseFree = async () => {
    setLoading(true);
    setError(null);

    try {
      await onUseFree();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
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
            <Sparkles size={24} className="text-[#E63946]" />
            <h2 className="text-xl font-bold text-[#E63946]">สิทธิ์พิเศษ!</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Memory Offer */}
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-pink-50 to-yellow-50 rounded-xl border border-pink-200">
          <HeartIcon size={40} className="mx-auto mb-3 text-[#E63946]" filled />
          <p className="text-lg font-bold text-gray-800 mb-2">
            คุณมีสิทธิ์รับความทรงจำฟรี 1 ครั้ง!
          </p>
          <p className="text-sm text-gray-600">
            จากโค้ดแนะนำที่คุณใช้ตอนสมัคร
          </p>
        </div>

        {/* Memory Info */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">ความทรงจำ</p>
          <p className="font-medium text-gray-800 truncate">{memoryTitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUseFree}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E63946] to-pink-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Gift size={18} />
            )}
            {loading ? 'กำลังเปิดใช้งาน...' : 'ใช้สิทธิ์ฟรี'}
          </button>
          <button
            onClick={onPayNormally}
            disabled={loading}
            className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CreditCard size={18} />
            ชำระเงินปกติ
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-400 text-center mt-4">
          สิทธิ์ฟรีใช้ได้ครั้งเดียวเท่านั้น
        </p>
      </div>
    </div>
  );
}
