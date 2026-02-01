'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import HeartIcon from './HeartIcon';

interface PaymentButtonProps {
  memoryId: string;
  memoryTitle: string;
  userId: string;
  className?: string;
  onPaymentStart?: () => void;
  onPaymentError?: (error: string) => void;
}

export default function PaymentButton({
  memoryId,
  memoryTitle,
  userId,
  className = '',
  onPaymentStart,
  onPaymentError,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
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

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`btn-primary flex items-center justify-center gap-2 ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading ? (
        <>
          <HeartIcon size={16} className="animate-pulse-heart" />
          <span>กำลังดำเนินการ...</span>
        </>
      ) : (
        <>
          <CreditCard size={16} />
          <span>ชำระเงิน</span>
        </>
      )}
    </button>
  );
}
