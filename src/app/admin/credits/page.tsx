'use client';

import { useEffect, useState, useMemo } from 'react';
import { Coins, TrendingUp, TrendingDown, RotateCcw, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface PackageWithSales {
  id: string;
  name: string;
  priceTHB: number;
  credits: number;
  salesCount: number;
  revenue: number;
}

interface RecentTransaction {
  id: string;
  userEmail: string;
  type: 'purchase' | 'use' | 'refund';
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface TopUser {
  userEmail: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}

interface Summary {
  totalCreditsSold: number;
  totalCreditsUsed: number;
  totalCreditsRefunded: number;
  totalRevenueTHB: number;
}

interface CreditsData {
  packages: PackageWithSales[];
  recentTransactions: RecentTransaction[];
  topUsers: TopUser[];
  summary: Summary;
}

const ITEMS_PER_PAGE = 20;

export default function AdminCreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/admin/credits')
      .then((res) => res.json())
      .then((responseData) => {
        setData(responseData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch credits data:', err);
        setLoading(false);
      });
  }, []);

  const totalPages = Math.ceil((data?.recentTransactions.length || 0) / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    if (!data) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.recentTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <HeartLoader message="กำลังโหลด..." size="md" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        ไม่สามารถโหลดข้อมูลได้
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Credits ที่ขายได้',
      value: data.summary.totalCreditsSold.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Credits ที่ใช้ไป',
      value: data.summary.totalCreditsUsed.toLocaleString(),
      icon: TrendingDown,
      color: 'bg-red-500',
    },
    {
      label: 'Credits คืนเงิน',
      value: data.summary.totalCreditsRefunded.toLocaleString(),
      icon: RotateCcw,
      color: 'bg-blue-500',
    },
    {
      label: 'รายได้จาก Credits',
      value: `฿${data.summary.totalRevenueTHB.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-pink-500',
    },
  ];

  const getTypeBadge = (type: 'purchase' | 'use' | 'refund') => {
    switch (type) {
      case 'purchase':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">ซื้อ</span>;
      case 'use':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">ใช้</span>;
      case 'refund':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">คืนเงิน</span>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Credits System</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Package Performance</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Package</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Credits</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Sales</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{pkg.name}</td>
                <td className="px-6 py-4 text-right text-gray-600">฿{pkg.priceTHB.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Coins size={14} className="text-yellow-500" />
                    <span className="font-medium">{pkg.credits.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-800">{pkg.salesCount.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-bold text-green-600">฿{pkg.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.packages.length === 0 && (
          <div className="text-center py-12 text-gray-500">ไม่มี package</div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Balance After</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">{tx.userEmail}</td>
                <td className="px-6 py-4 text-center">{getTypeBadge(tx.type)}</td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-medium ${
                      tx.type === 'purchase' || tx.type === 'refund'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'use' ? '-' : '+'}
                    {Math.abs(tx.amount).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-800">
                  {tx.balanceAfter.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{tx.description || '-'}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">
                  {new Date(tx.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">ไม่มีรายการ</div>
        )}
      </div>

      {/* Pagination for Transactions */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, data.recentTransactions.length)} of{' '}
            {data.recentTransactions.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-pink-500 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Top Users by Balance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Top Users by Balance</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Balance</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Total Purchased</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Total Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.topUsers.map((user, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">{user.userEmail}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Coins size={14} className="text-yellow-500" />
                    <span className="font-bold text-gray-800">{user.balance.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-green-600">
                  {user.totalPurchased.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-medium text-red-600">
                  {user.totalUsed.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.topUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">ไม่มีผู้ใช้</div>
        )}
      </div>
    </div>
  );
}
