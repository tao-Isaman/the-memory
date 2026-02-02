'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import ShareModal from '@/components/ShareModal';
import { CheckCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const memoryId = searchParams.get('memory_id');
  const sessionId = searchParams.get('session_id');
  const isFree = searchParams.get('free') === 'true';

  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function verifyPayment() {
      // If this is a free memory activation, skip payment verification
      if (isFree && memoryId) {
        setStatus('success');
        return;
      }

      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (data.status === 'active') {
          setStatus('success');
        } else if (data.status === 'pending') {
          setStatus('pending');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
      }
    }

    verifyPayment();
  }, [sessionId, isFree, memoryId]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message="กำลังตรวจสอบการชำระเงิน..." size="lg" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="memory-card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-green-600" />
        </div>

        <h1 className="font-kanit text-2xl font-bold text-[#E63946] mb-4">
          {status === 'success'
            ? (isFree ? 'ใช้สิทธิ์ฟรีสำเร็จ!' : 'ชำระเงินสำเร็จ!')
            : status === 'pending'
              ? 'กำลังดำเนินการชำระเงิน'
              : 'เกิดข้อผิดพลาด'}
        </h1>

        {status === 'pending' ? (
          <p className="text-gray-600 mb-6">
            การชำระเงินของคุณกำลังดำเนินการ หากใช้ PromptPay อาจใช้เวลาสักครู่
            คุณสามารถแชร์ลิงก์ได้ทันทีที่การชำระเงินเสร็จสมบูรณ์
          </p>
        ) : status === 'success' ? (
          <p className="text-gray-600 mb-6">
            {isFree
              ? 'คุณได้ใช้สิทธิ์ความทรงจำฟรีจากโค้ดแนะนำเรียบร้อยแล้ว!'
              : 'ความทรงจำของคุณพร้อมแชร์กับคนพิเศษแล้ว!'}
          </p>
        ) : (
          <p className="text-gray-600 mb-6">
            ไม่สามารถตรวจสอบการชำระเงินได้ กรุณาลองอีกครั้งหรือติดต่อเรา
          </p>
        )}

        <div className="flex flex-col gap-3">
          {memoryId && status === 'success' && (
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <HeartIcon size={16} filled />
              แชร์ความทรงจำ
            </button>
          )}

          <Link
            href="/dashboard"
            className="btn-secondary w-full text-center"
          >
            กลับไปหน้าหลัก
          </Link>
        </div>
      </div>

      {memoryId && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          memoryId={memoryId}
          memoryTitle="ความทรงจำของคุณ"
          showSuccessMessage={true}
        />
      )}
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <HeartLoader message="กำลังโหลด..." size="lg" />
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
