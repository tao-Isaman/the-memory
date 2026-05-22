'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CreditBalanceProvider } from '@/contexts/CreditBalanceContext';
import { ToastProvider } from '@/contexts/ToastContext';
import HeartFirework from './HeartFirework';
import PWAInstallPrompt from './PWAInstallPrompt';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CreditBalanceProvider>
          <HeartFirework enabled />
          {children}
          <PWAInstallPrompt />
        </CreditBalanceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
