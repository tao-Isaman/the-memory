'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  BookHeart,
  Layers,
  CreditCard,
  DollarSign,
  AlertCircle,
  Clock,
  Coins,
  TrendingDown,
  Image,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface CreditStats {
  totalSold: number;
  totalUsed: number;
  totalRefunded: number;
}

interface CartoonStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

interface RecentActivity {
  type: 'memory' | 'credit' | 'cartoon';
  userEmail: string;
  description: string;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalMemories: number;
  totalStories: number;
  paidMemories: number;
  failedPayments: number;
  pendingClaims: number;
  totalRevenue: number;
  creditStats: CreditStats;
  cartoonStats: CartoonStats;
  recentActivity: RecentActivity[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch admin stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <HeartLoader message="กำลังโหลด..." size="md" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString('th-TH')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'memory':
        return BookHeart;
      case 'credit':
        return Coins;
      case 'cartoon':
        return Image;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'memory':
        return 'bg-pink-100 text-pink-600';
      case 'credit':
        return 'bg-green-100 text-green-600';
      case 'cartoon':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const cartoonSuccessRate =
    stats?.cartoonStats && stats.cartoonStats.total > 0
      ? Math.round((stats.cartoonStats.completed / stats.cartoonStats.total) * 100)
      : 0;

  const statCards = [
    {
      label: 'ผู้ใช้งานทั้งหมด',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users',
    },
    {
      label: 'รายได้ทั้งหมด',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-emerald-500',
      href: null,
    },
    {
      label: 'Memories ทั้งหมด',
      value: stats?.totalMemories || 0,
      icon: BookHeart,
      color: 'bg-pink-500',
      href: '/admin/users',
    },
    {
      label: 'Stories ทั้งหมด',
      value: stats?.totalStories || 0,
      icon: Layers,
      color: 'bg-purple-500',
      href: null,
    },
    {
      label: 'Memories ที่ชำระแล้ว',
      value: stats?.paidMemories || 0,
      icon: CreditCard,
      color: 'bg-green-500',
      href: null,
    },
    {
      label: 'การชำระเงินล้มเหลว',
      value: stats?.failedPayments || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      href: null,
    },
    {
      label: 'คำขอถอนเงินรอดำเนินการ',
      value: stats?.pendingClaims || 0,
      icon: Clock,
      color: 'bg-orange-500',
      href: '/admin/referral-claims',
    },
    {
      label: 'เครดิตขายได้',
      value: stats?.creditStats.totalSold.toLocaleString() || 0,
      icon: Coins,
      color: 'bg-yellow-500',
      href: '/admin/credits',
    },
    {
      label: 'เครดิตที่ใช้ไป',
      value: stats?.creditStats.totalUsed.toLocaleString() || 0,
      icon: TrendingDown,
      color: 'bg-blue-400',
      href: '/admin/credits',
    },
    {
      label: 'รูปการ์ตูนทั้งหมด',
      value: `${stats?.cartoonStats.total || 0} (${cartoonSuccessRate}%)`,
      icon: Image,
      color: 'bg-indigo-500',
      href: '/admin/cartoons',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`${card.color} p-2.5 rounded-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{card.label}</p>
                  <p className="text-xl font-bold text-gray-800 truncate">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
              </div>
            </div>
          );

          return card.href ? (
            <Link key={card.label} href={card.href}>
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Credit Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Coins className="text-yellow-500" size={20} />
            สถิติเครดิต
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ขายได้</span>
              <span className="font-semibold text-green-600">
                {stats?.creditStats.totalSold.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ใช้ไป</span>
              <span className="font-semibold text-blue-600">
                {stats?.creditStats.totalUsed.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">คืนเงิน</span>
              <span className="font-semibold text-orange-600">
                {stats?.creditStats.totalRefunded.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Cartoon Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Image className="text-purple-500" size={20} />
            สถิติการ์ตูน
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <CheckCircle size={14} className="text-green-500" />
                สำเร็จ
              </span>
              <span className="font-semibold text-green-600">
                {stats?.cartoonStats.completed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <XCircle size={14} className="text-red-500" />
                ล้มเหลว
              </span>
              <span className="font-semibold text-red-600">
                {stats?.cartoonStats.failed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Loader size={14} className="text-orange-500" />
                รอดำเนินการ
              </span>
              <span className="font-semibold text-orange-600">
                {stats?.cartoonStats.pending || 0}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Success Rate</span>
                <span className="font-bold text-indigo-600">{cartoonSuccessRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/admin/users"
              className="block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center"
            >
              ดูรายชื่อผู้ใช้
            </Link>
            <Link
              href="/admin/referral-claims"
              className="block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center"
            >
              จัดการคำขอถอนเงิน
            </Link>
            <Link
              href="/admin/credits"
              className="block px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-center"
            >
              จัดการเครดิต
            </Link>
            <Link
              href="/admin/cartoons"
              className="block px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-center"
            >
              ดูรูปการ์ตูน
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Clock size={22} />
          กิจกรรมล่าสุด
        </h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`${getActivityColor(activity.type)} p-2 rounded-lg`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">{activity.userEmail}</p>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">ไม่มีกิจกรรมล่าสุด</p>
        )}
      </div>
    </div>
  );
}
