'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, History, Loader2, Wallet } from 'lucide-react';
import { ClaimStatus } from '@/types/referral';

interface ClaimRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentInfo: string;
  bankName: string | null;
  status: ClaimStatus;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface ClaimHistorySectionProps {
  userId: string;
  refreshTrigger?: number;
}

export default function ClaimHistorySection({
  userId,
  refreshTrigger = 0,
}: ClaimHistorySectionProps) {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/referral/claim-discount?userId=${userId}`);
        const data = await response.json();
        setClaims(data.claims || []);
      } catch (error) {
        console.error('Error fetching claims:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [userId, refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
            <Clock size={12} />
            รอดำเนินการ
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle size={12} />
            โอนแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            <XCircle size={12} />
            ปฏิเสธ
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === 'promptpay' ? 'พร้อมเพย์' : 'โอนธนาคาร';
  };

  // Don't show section if no claims
  if (!loading && claims.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <History size={16} className="text-gray-500" />
        <h4 className="font-medium text-gray-800">ประวัติการขอรับเงิน</h4>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <Loader2 size={24} className="animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {claims.map((claim) => (
            <div key={claim.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Wallet size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {claim.amount} บาท
                    </p>
                    <p className="text-xs text-gray-500">
                      {getPaymentMethodLabel(claim.paymentMethod)}
                      {claim.bankName && ` - ${claim.bankName}`}
                    </p>
                  </div>
                </div>
                {getStatusBadge(claim.status)}
              </div>

              <div className="ml-10 text-xs text-gray-500">
                <p>
                  {claim.paymentMethod === 'promptpay'
                    ? `เบอร์: ${claim.paymentInfo}`
                    : `เลขบัญชี: ${claim.paymentInfo}`
                  }
                </p>
                <p className="mt-1">ส่งคำขอ: {formatDate(claim.createdAt)}</p>
                {claim.processedAt && (
                  <p>ดำเนินการ: {formatDate(claim.processedAt)}</p>
                )}
              </div>

              {/* Show admin note for rejected claims */}
              {claim.status === 'rejected' && claim.adminNote && (
                <div className="ml-10 mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs text-red-600">
                    <span className="font-medium">หมายเหตุ:</span> {claim.adminNote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
