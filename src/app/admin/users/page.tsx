'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Eye, BookHeart, CreditCard, Search, Filter, SortAsc, SortDesc, ChevronLeft, ChevronRight } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface User {
  id: string;
  user_id: string;
  user_email: string;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  memoryCount: number;
  paidMemoryCount: number;
  hasReferralCode: boolean;
}

type SortField = 'created_at' | 'memoryCount' | 'paidMemoryCount' | 'user_email';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMemories, setFilterMemories] = useState<'all' | 'with' | 'without'>('all');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [filterReferral, setFilterReferral] = useState<'all' | 'with' | 'without'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setAllUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch users:', err);
        setLoading(false);
      });
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMemories, filterPaid, filterReferral, sortField, sortOrder]);

  // Filter and sort all users
  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.user_email.toLowerCase().includes(query) ||
          (user.referral_code && user.referral_code.toLowerCase().includes(query))
      );
    }

    // Memory filter
    if (filterMemories === 'with') {
      result = result.filter((user) => user.memoryCount > 0);
    } else if (filterMemories === 'without') {
      result = result.filter((user) => user.memoryCount === 0);
    }

    // Paid filter
    if (filterPaid === 'paid') {
      result = result.filter((user) => user.paidMemoryCount > 0);
    } else if (filterPaid === 'unpaid') {
      result = result.filter((user) => user.paidMemoryCount === 0);
    }

    // Referral filter
    if (filterReferral === 'with') {
      result = result.filter((user) => user.hasReferralCode);
    } else if (filterReferral === 'without') {
      result = result.filter((user) => !user.hasReferralCode);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'memoryCount':
          comparison = a.memoryCount - b.memoryCount;
          break;
        case 'paidMemoryCount':
          comparison = a.paidMemoryCount - b.paidMemoryCount;
          break;
        case 'user_email':
          comparison = a.user_email.localeCompare(b.user_email);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [allUsers, searchQuery, filterMemories, filterPaid, filterReferral, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Users</h1>
        <p className="text-gray-500">
          {filteredUsers.length} filtered / {allUsers.length} total users
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or referral code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Memory Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterMemories}
              onChange={(e) => setFilterMemories(e.target.value as 'all' | 'with' | 'without')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Memories</option>
              <option value="with">Has Memories</option>
              <option value="without">No Memories</option>
            </select>
          </div>

          {/* Paid Filter */}
          <select
            value={filterPaid}
            onChange={(e) => setFilterPaid(e.target.value as 'all' | 'paid' | 'unpaid')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Has Paid</option>
            <option value="unpaid">Never Paid</option>
          </select>

          {/* Referral Filter */}
          <select
            value={filterReferral}
            onChange={(e) => setFilterReferral(e.target.value as 'all' | 'with' | 'without')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Referral</option>
            <option value="with">Has Code</option>
            <option value="without">No Code</option>
          </select>

          {/* Sort */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="created_at">Sort by Date</option>
            <option value="user_email">Sort by Email</option>
            <option value="memoryCount">Sort by Memories</option>
            <option value="paidMemoryCount">Sort by Paid</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="text-left px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('user_email')}
              >
                Email {sortField === 'user_email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Referral Code</th>
              <th
                className="text-center px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('memoryCount')}
              >
                Memories {sortField === 'memoryCount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-center px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('paidMemoryCount')}
              >
                Paid {sortField === 'paidMemoryCount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-left px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('created_at')}
              >
                Joined {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{user.user_email}</div>
                  <div className="text-xs text-gray-400">{user.user_id.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4">
                  {user.referral_code ? (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm text-pink-600">
                      {user.referral_code}
                    </code>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
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

        {paginatedUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {allUsers.length === 0 ? 'No users found' : 'No users match your filters'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
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

            {/* Page numbers */}
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
    </div>
  );
}
