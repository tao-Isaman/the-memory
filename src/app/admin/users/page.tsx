'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, BookHeart, CreditCard } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface User {
  id: string;
  user_id: string;
  user_email: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  memoryCount: number;
  paidMemoryCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch users:', err);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Users</h1>
        <p className="text-gray-500">{users.length} users</p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Referral Code</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Memories</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Paid</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Joined</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{user.user_email}</div>
                  <div className="text-xs text-gray-400">{user.user_id.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm text-pink-600">
                    {user.referral_code}
                  </code>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <BookHeart size={16} className="text-pink-500" />
                    <span className="font-medium">{user.memoryCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CreditCard size={16} className="text-green-500" />
                    <span className="font-medium text-green-600">{user.paidMemoryCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/admin/users/${user.user_id}/memories`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Eye size={14} />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
