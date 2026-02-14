'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const toastStyles = {
  success: {
    border: 'border-green-200',
    text: 'text-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    border: 'border-red-200',
    text: 'text-red-700',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  info: {
    border: 'border-pink-200',
    text: 'text-pink-700',
    icon: Info,
    iconColor: 'text-pink-500',
  },
};

export function ToastItem({ toast, onDismiss }: ToastProps) {
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`animate-fade-in-up bg-white rounded-xl shadow-lg border ${style.border} px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      <Icon size={20} className={style.iconColor} />
      <span className={`flex-1 text-sm font-medium ${style.text}`}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
