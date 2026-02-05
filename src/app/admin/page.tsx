'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BookHeart, Layers, CreditCard } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface AdminStats {
  totalUsers: number;
  totalMemories: number;
  totalStories: number;
  paidMemories: number;
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

  const statCards = [
    {
      label: 'ผู้ใช้งานทั้งหมด',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users',
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
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {card.value.toLocaleString()}
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

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Users size={18} />
            ดูรายชื่อผู้ใช้
          </Link>
        </div>
      </div>
    </div>
  );
}
