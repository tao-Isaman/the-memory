'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Layers, CheckCircle, Clock, XCircle } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface Memory {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'failed';
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  storyCount: number;
}

interface User {
  user_id: string;
  user_email: string;
  referral_code: string;
  created_at: string;
}

export default function UserMemoriesPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/memories`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setMemories(data.memories);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch user memories:', err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <HeartLoader message="กำลังโหลด..." size="md" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle size={12} />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
            <Clock size={12} />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            <XCircle size={12} />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Back button and header */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={18} />
        Back to Users
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{user?.user_email}</h1>
          <p className="text-gray-500 mt-1">
            Referral Code: <code className="bg-gray-100 px-2 py-0.5 rounded text-pink-600">{user?.referral_code}</code>
          </p>
        </div>
        <p className="text-gray-500">{memories.length} memories</p>
      </div>

      {/* Memories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Title</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Stories</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Paid At</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {memories.map((memory) => (
              <tr key={memory.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{memory.title}</div>
                  <div className="text-xs text-gray-400">{memory.id.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {getStatusBadge(memory.status)}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Layers size={16} className="text-purple-500" />
                    <span className="font-medium">{memory.storyCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(memory.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {memory.paid_at
                    ? new Date(memory.paid_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/admin/memories/${memory.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                  >
                    <Eye size={14} />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {memories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No memories found
          </div>
        )}
      </div>
    </div>
  );
}
