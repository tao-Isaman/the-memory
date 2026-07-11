'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Wallet, Loader2, Smartphone, Building, CheckCircle } from 'lucide-react';
import { PaymentMethod } from '@/types/referral';

// Fixed payout, in THB for every locale (deliberate product decision).
const CLAIM_AMOUNT_THB = 50;

// Bank codes only — the label comes from referral.banks.<code>. The label (not the code)
// is what gets submitted as `bankName`, so admins still read a human bank name.
const THAI_BANK_CODES = ['kbank', 'ktb', 'bbl', 'scb', 'bay', 'ttb', 'gsb', 'other'] as const;

interface ClaimMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (remainingClaims: number) => void;
  userId: string;
  pendingClaims: number;
}

export default function ClaimMoneyModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  pendingClaims,
}: ClaimMoneyModalProps) {
  const t = useTranslations('referral');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  // Holds an error CODE (see messages/<locale>/referral.json → "errors"), never prose.
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  /**
   * Maps an error code to translated copy. Anything we don't recognise (e.g. a raw
   * message from an API route that hasn't been converted to codes yet) falls back to
   * the generic error, so a Thai server string never leaks into an EN/ID screen.
   */
  const errorText = (code: string | null) => {
    if (!code) return '';
    return t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.GENERIC');
  };

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
    setErrorCode(null);
  };

  const handleAccountNumberChange = (value: string) => {
    // Only allow numbers
    const cleaned = value.replace(/\D/g, '');
    setAccountNumber(cleaned);
    setErrorCode(null);
  };

  const handleSubmit = async () => {
    setErrorCode(null);

    // Validation
    if (paymentMethod === 'promptpay') {
      if (!validatePhone(phoneNumber)) {
        setErrorCode('INVALID_PHONE');
        return;
      }
    } else {
      if (!validateBankTransfer()) {
        setErrorCode('INCOMPLETE_BANK_INFO');
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
        throw new Error(data.error || 'CLAIM_FAILED');
      }

      setShowSuccess(true);
      onSuccess(data.remainingClaims);
    } catch (err) {
      setErrorCode(err instanceof Error ? err.message : 'GENERIC');
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
    setErrorCode(null);
    setShowSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="memory-card p-6 max-w-md w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet size={24} className="text-green-600" />
            <h2 className="text-xl font-bold text-green-700">{t('modal.title')}</h2>
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
              {t('modal.successTitle')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('modal.successBody', { amount: CLAIM_AMOUNT_THB })}
              <br />
              {t('modal.successWait')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {paymentMethod === 'promptpay'
                ? t('modal.successPromptpay', { value: phoneNumber })
                : t('modal.successBank', { bank: bankName, value: accountNumber })}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              {t('modal.done')}
            </button>
          </div>
        ) : (
          <>
            {/* Amount Info */}
            <div className="text-center mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <Wallet size={32} className="mx-auto mb-2 text-green-600" />
              <p className="text-gray-700 font-medium">{t('modal.amountLabel')}</p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {t('modal.amount', { amount: CLAIM_AMOUNT_THB })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('modal.rightsNote', { pending: pendingClaims })}
              </p>
            </div>

            {/* Payment Method Tabs */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('modal.methodLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('promptpay');
                    setErrorCode(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'promptpay'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Smartphone size={18} />
                  <span className="font-medium">{t('method.promptpay')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    setErrorCode(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building size={18} />
                  <span className="font-medium">{t('method.bank_transfer')}</span>
                </button>
              </div>
            </div>

            {/* PromptPay Form */}
            {paymentMethod === 'promptpay' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modal.phoneLabel')}
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={t('modal.phonePlaceholder')}
                  className="input-valentine w-full text-center text-lg tracking-wider"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t('modal.phoneHint')}
                </p>
              </div>
            )}

            {/* Bank Transfer Form */}
            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('modal.bankLabel')}
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      setErrorCode(null);
                    }}
                    className="input-valentine w-full"
                    disabled={loading}
                  >
                    <option value="">{t('modal.bankPlaceholder')}</option>
                    {THAI_BANK_CODES.map((bank) => (
                      <option key={bank} value={t(`banks.${bank}`)}>
                        {t(`banks.${bank}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('modal.accountNumber')}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    placeholder={t('modal.accountNumberPlaceholder')}
                    className="input-valentine w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('modal.accountName')}
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      setErrorCode(null);
                    }}
                    placeholder={t('modal.accountNamePlaceholder')}
                    className="input-valentine w-full"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {errorCode && (
              <p className="text-red-500 text-sm mb-4 text-center">{errorText(errorCode)}</p>
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
                  {t('modal.submitting')}
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  {t('modal.submit', { amount: CLAIM_AMOUNT_THB })}
                </>
              )}
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              {t('modal.cancel')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
