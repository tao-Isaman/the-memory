'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import HeartIcon from './HeartIcon';
import { X, Users, Loader2 } from 'lucide-react';

// Fixed discount, in THB for every locale (deliberate product decision).
const REFERRAL_AMOUNT_THB = 50;

interface LinkReferralCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function LinkReferralCodeModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: LinkReferralCodeModalProps) {
  const t = useTranslations('referral');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  // Holds an error CODE (see messages/<locale>/referral.json → "errors"), never prose.
  const [errorCode, setErrorCode] = useState<string | null>(null);

  /**
   * Maps an error code to translated copy. Anything we don't recognise (e.g. a raw
   * message from an API route that hasn't been converted to codes yet) falls back to
   * the generic error, so a Thai server string never leaks into an EN/ID screen.
   */
  const errorText = (c: string | null) => {
    if (!c) return '';
    return t.has(`errors.${c}`) ? t(`errors.${c}`) : t('errors.GENERIC');
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    setErrorCode(null);
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setErrorCode('CODE_LENGTH');
      return;
    }

    setLoading(true);
    setErrorCode(null);

    try {
      const response = await fetch('/api/referral/link-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, referralCode: code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorCode(data.error || 'GENERIC');
        return;
      }

      onSuccess();
    } catch {
      setErrorCode('GENERIC');
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
            <Users size={24} className="text-[#E63946]" />
            <h2 className="text-xl font-bold text-[#E63946]">{t('link.title')}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Text */}
        <div className="text-center mb-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
          <HeartIcon size={32} className="mx-auto mb-2 text-[#E63946]" filled />
          <p className="text-gray-700 font-medium">{t('link.question')}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t('link.subtitle')}
          </p>
          <p className="text-lg font-bold text-[#E63946] mt-2">
            {t('link.discount', { amount: REFERRAL_AMOUNT_THB })}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t('link.firstPayment')}
          </p>
        </div>

        {/* Code Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('link.inputLabel')}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={t('link.inputPlaceholder')}
            maxLength={6}
            className="input-valentine w-full text-center text-2xl tracking-[0.5em] font-mono uppercase"
            disabled={loading}
          />
          {errorCode && (
            <p className="text-red-500 text-sm mt-2 text-center">{errorText(errorCode)}</p>
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
              <Users size={18} />
            )}
            {loading ? t('link.submitting') : t('link.submit')}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            {t('link.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
