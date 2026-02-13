'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CreditBalanceContextType {
  balance: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CreditBalanceContext = createContext<CreditBalanceContextType | undefined>(undefined);

export function CreditBalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/credits/balance?userId=${user.id}`);
      const data = await response.json();
      setBalance(data.balance ?? 0);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const refresh = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  return (
    <CreditBalanceContext.Provider value={{ balance, loading, refresh }}>
      {children}
    </CreditBalanceContext.Provider>
  );
}

export function useCreditBalance() {
  const context = useContext(CreditBalanceContext);
  if (context === undefined) {
    throw new Error('useCreditBalance must be used within a CreditBalanceProvider');
  }
  return context;
}
