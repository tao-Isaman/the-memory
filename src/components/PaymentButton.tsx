'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import HeartIcon from './HeartIcon';
import FreeMemoryOption from './FreeMemoryOption';

interface PaymentButtonProps {
  memoryId: string;
  memoryTitle: string;
  userId: string;
  className?: string;
  onPaymentStart?: () => void;
  onPaymentError?: (error: string) => void;
  onFreeMemorySuccess?: () => void;
}

export default function PaymentButton({
  memoryId,
  memoryTitle,
  userId,
  className = '',
  onPaymentStart,
  onPaymentError,
  onFreeMemorySuccess,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [hasFreeMemory, setHasFreeMemory] = useState(false);
  const [showFreeOption, setShowFreeOption] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const checkReferralStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/referral/status?userId=${userId}`);
      const data = await response.json();
      setHasFreeMemory(data.hasFreeMemory === true);
    } catch (error) {
      console.error('Error checking referral status:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [userId]);

  useEffect(() => {
    checkReferralStatus();
  }, [checkReferralStatus]);

  const handleClick = () => {
    if (hasFreeMemory) {
      setShowFreeOption(true);
    } else {
      handlePayment();
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setShowFreeOption(false);
    onPaymentStart?.();

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memoryId,
          memoryTitle,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError?.(error instanceof Error ? error.message : 'Payment failed');
      setLoading(false);
    }
  };

  const handleUseFree = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/referral/use-free-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memoryId,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate free memory');
      }

      setShowFreeOption(false);
      onFreeMemorySuccess?.();

      // Redirect to success page or refresh
      window.location.href = `/payment/success?memory_id=${memoryId}&free=true`;
    } catch (error) {
      console.error('Free memory error:', error);
      onPaymentError?.(error instanceof Error ? error.message : 'Failed to use free memory');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || checkingStatus}
        className={`btn-primary flex items-center justify-center gap-2 ${
          loading || checkingStatus ? 'opacity-70 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading || checkingStatus ? (
          <>
            <HeartIcon size={16} className="animate-pulse-heart" />
            <span>{checkingStatus ? 'กำลังตรวจสอบ...' : 'กำลังดำเนินการ...'}</span>
          </>
        ) : (
          <>
            <CreditCard size={16} />
            <span>ชำระเงิน</span>
          </>
        )}
      </button>

      <FreeMemoryOption
        isOpen={showFreeOption}
        onClose={() => setShowFreeOption(false)}
        memoryId={memoryId}
        memoryTitle={memoryTitle}
        onUseFree={handleUseFree}
        onPayNormally={handlePayment}
      />
    </>
  );
}
