'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import { ArrowLeft, Coins, Star, ShoppingCart, Clock, Plus, Minus } from 'lucide-react';
import { CreditPackage } from '@/types/credits';
import { CreditTransaction } from '@/types/credits';
import Link from 'next/link';

export default function CreditsPage() {
  const { user, loading: authLoading } = useAuth();
  const { balance, refresh: refreshBalance } = useCreditBalance();
  const router = useRouter();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/credits/packages');
        const data = await response.json();
        setPackages(data.packages || []);
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  // Refresh balance on mount (in case returning from payment)
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/credits/transactions?userId=${user.id}&limit=20`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory && transactions.length === 0) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  const handlePurchase = async (packageId: string) => {
    if (!user) return;
    setPurchaseLoading(packageId);

    try {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseLoading(null);
    }
  };

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message="กำลังโหลด..." size="lg" />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center hover:bg-pink-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-[#E63946]" />
        </Link>
        <div className="flex-1">
          <h1 className="font-kanit text-2xl font-bold text-[#E63946]">เครดิต</h1>
          <p className="text-sm text-gray-500">ซื้อเครดิตเพื่อเปิดใช้งานความทรงจำ</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="memory-card p-6 mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coins size={24} className="text-[#E63946]" />
          <span className="text-sm text-gray-500 font-kanit">เครดิตคงเหลือ</span>
        </div>
        <p className="text-5xl font-bold text-[#E63946] font-kanit">{balance}</p>
        <p className="text-sm text-gray-400 mt-2">ใช้เครดิตเพื่อเปิดใช้งานความทรงจำ</p>
      </div>

      {/* Packages */}
      {loadingPackages ? (
        <div className="flex justify-center py-12">
          <HeartLoader message="กำลังโหลดแพ็กเกจ..." size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {packages.map((pkg) => {
            const perCredit = (pkg.priceTHB / pkg.credits).toFixed(2);
            return (
              <div
                key={pkg.id}
                className={`relative memory-card p-6 text-center transition-all hover:-translate-y-1 ${
                  pkg.isPopular ? 'border-2 border-[#E63946] shadow-lg shadow-pink-100' : ''
                }`}
              >
                {/* Popular badge */}
                {pkg.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#FF6B9D] to-[#E63946] rounded-full text-white text-xs font-bold flex items-center gap-1">
                    <Star size={12} />
                    ยอดนิยม
                  </div>
                )}

                {/* Credit count */}
                <div className="mt-2 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <HeartIcon size={20} filled className="text-[#FF6B9D]" />
                    <p className="font-kanit text-3xl font-bold text-[#E63946]">{pkg.credits}</p>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">เครดิต</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <p className="font-kanit text-2xl font-bold text-gray-800">
                    {pkg.priceTHB} <span className="text-base font-normal">บาท</span>
                  </p>
                  {pkg.credits > 1 && (
                    <p className="text-sm text-gray-400">
                      ≈ {perCredit} บาท/เครดิต
                    </p>
                  )}
                </div>

                {/* Discount tag */}
                {pkg.discountPercent > 0 && (
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-full text-xs font-bold text-yellow-700 mb-4">
                    ประหยัด {pkg.discountPercent}%
                  </div>
                )}

                {/* Buy button */}
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchaseLoading !== null}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-kanit font-medium transition-all ${
                    pkg.isPopular
                      ? 'text-white bg-gradient-to-r from-[#FF6B9D] to-[#E63946] shadow-md hover:shadow-lg hover:-translate-y-0.5'
                      : 'text-[#E63946] bg-white border-2 border-[#FF6B9D] hover:bg-pink-50'
                  } ${purchaseLoading === pkg.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {purchaseLoading === pkg.id ? (
                    <>
                      <HeartIcon size={16} className="animate-pulse-heart" />
                      <span>กำลังดำเนินการ...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      <span>ซื้อเลย</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction History */}
      <div className="memory-card overflow-hidden">
        <button
          onClick={handleToggleHistory}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-pink-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            <span className="font-kanit font-medium text-gray-700">ประวัติการใช้เครดิต</span>
          </div>
          <span className="text-gray-400 text-sm">{showHistory ? 'ซ่อน' : 'แสดง'}</span>
        </button>

        {showHistory && (
          <div className="border-t border-pink-100">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <HeartLoader message="กำลังโหลด..." size="sm" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">ยังไม่มีประวัติ</p>
            ) : (
              <div className="divide-y divide-pink-50">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'purchase'
                          ? 'bg-green-50'
                          : tx.type === 'use'
                            ? 'bg-pink-50'
                            : 'bg-blue-50'
                      }`}>
                        {tx.type === 'purchase' ? (
                          <Plus size={14} className="text-green-600" />
                        ) : tx.type === 'use' ? (
                          <Minus size={14} className="text-[#E63946]" />
                        ) : (
                          <Plus size={14} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{tx.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${
                        tx.amount > 0 ? 'text-green-600' : 'text-[#E63946]'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                      <p className="text-xs text-gray-400">คงเหลือ {tx.balanceAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
