'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Tag } from 'lucide-react';
import HeartIcon from './HeartIcon';

interface PaymentButtonProps {
  memoryId: string;
  memoryTitle: string;
  userId: string;
  className?: string;
  onPaymentStart?: () => void;
  onPaymentError?: (error: string) => void;
}

interface DiscountInfo {
  eligible: boolean;
  discountAmount: number;
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
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(true);

  // Check if user is eligible for referral discount
  useEffect(() => {
    const checkDiscount = async () => {
      try {
        const response = await fetch(`/api/referral/check-discount?userId=${userId}`);
        const data = await response.json();

        setDiscountInfo({
          eligible: data.eligible === true,
          discountAmount: data.discountAmount || 0
        });
      } catch (error) {
        console.error('Error checking discount:', error);
        setDiscountInfo({ eligible: false, discountAmount: 0 });
      } finally {
        setCheckingDiscount(false);
      }
    };

    checkDiscount();
  }, [userId]);

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
    <div className="space-y-2">
      {/* Discount indicator */}
      {!checkingDiscount && discountInfo?.eligible && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 flex items-center gap-2">
          <Tag size={18} className="text-yellow-600" />
          <p className="text-sm text-yellow-800">
            คุณได้รับส่วนลด <span className="font-bold">{discountInfo.discountAmount} บาท</span> จากโค้ดแนะนำ!
          </p>
        </div>
      )}

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
            <span>ชำระเงิน{discountInfo?.eligible ? ` (ลด ${discountInfo.discountAmount} บาท)` : ''}</span>
          </>
        )}
      </button>
    </div>
  );
}
