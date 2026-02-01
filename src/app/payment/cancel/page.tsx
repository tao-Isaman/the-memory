'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import PaymentButton from '@/components/PaymentButton';
import { useAuth } from '@/hooks/useAuth';
import { XCircle } from 'lucide-react';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const memoryId = searchParams.get('memory_id');
  const { user } = useAuth();

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="memory-card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle size={40} className="text-red-500" />
        </div>

        <h1 className="font-kanit text-2xl font-bold text-[#E63946] mb-4">
          ยกเลิกการชำระเงิน
        </h1>

        <p className="text-gray-600 mb-6">
          การชำระเงินถูกยกเลิก ความทรงจำของคุณยังคงอยู่และรอการชำระเงิน
          คุณสามารถลองชำระเงินอีกครั้งได้
        </p>

        <div className="flex flex-col gap-3">
          {memoryId && user && (
            <PaymentButton
              memoryId={memoryId}
              memoryTitle=""
              userId={user.id}
              className="w-full"
            />
          )}

          <Link
            href="/dashboard"
            className="btn-secondary w-full text-center"
          >
            กลับไปหน้าหลัก
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          <HeartIcon size={12} className="inline-block mr-1" />
          ความทรงจำของคุณจะแสดงให้ผู้อื่นเห็นได้หลังจากชำระเงินเสร็จสิ้น
        </p>
      </div>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <HeartLoader message="กำลังโหลด..." size="lg" />
        </main>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
