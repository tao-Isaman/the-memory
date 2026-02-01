'use client';

import { MemoryStatus } from '@/types/memory';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface PaymentStatusProps {
  status: MemoryStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig = {
  pending: {
    label: 'รอชำระเงิน',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700',
  },
  active: {
    label: 'ใช้งานได้',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
  },
  failed: {
    label: 'ชำระเงินล้มเหลว',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
  },
};

export default function PaymentStatus({
  status,
  showLabel = true,
  size = 'sm',
}: PaymentStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 14 : 16;
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${padding} ${textSize} ${config.className}`}
    >
      <Icon size={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
