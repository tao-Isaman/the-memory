'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CreditBalanceProvider } from '@/contexts/CreditBalanceContext';
import HeartFirework from './HeartFirework';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <CreditBalanceProvider>
        <HeartFirework enabled />
        {children}
      </CreditBalanceProvider>
    </AuthProvider>
  );
}
