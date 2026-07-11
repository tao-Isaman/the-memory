'use client';

import { useEffect, useState, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, Image as ImageIcon, Sparkles, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface CartoonGeneration {
  id: string;
  userEmail: string;
  userId: string;
  originalImageUrl: string | null;
  cartoonImageUrl: string | null;
  creditsUsed: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface Stats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  successRate: number;
  totalCreditsUsed: number;
}

interface ApiResponse {
  stats: Stats;
  recentGenerations: CartoonGeneration[];
}

type StatusFilter = 'all' | 'completed' | 'failed' | 'pending';

const ITEMS_PER_PAGE = 20;

export default function AdminCartoonsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/admin/cartoons')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch cartoons:', err);
        setLoading(false);
      });
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Filter generations
  const filteredGenerations = useMemo(() => {
    if (!data) return [];

    let result = [...data.recentGenerations];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((gen) => gen.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((gen) =>
        gen.userEmail.toLowerCase().includes(query)
      );
    }

    return result;
  }, [data, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredGenerations.length / ITEMS_PER_PAGE);
  const paginatedGenerations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGenerations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGenerations, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle size={14} />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle size={14} />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock size={14} />
            Pending
          </span>
        );
      default:
        return null;
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
        Failed to load cartoon data
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Generations',
      value: data.stats.total,
      icon: Sparkles,
      color: 'bg-purple-500',
    },
    {
      label: 'Completed',
      value: data.stats.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Failed',
      value: data.stats.failed,
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      label: 'Pending',
      value: data.stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Success Rate',
      value: `${data.stats.successRate}%`,
      icon: Sparkles,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Credits Used',
      value: data.stats.totalCreditsUsed,
      icon: ImageIcon,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Cartoon Generations</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex flex-col gap-2">
                <div className={`${card.color} p-2 rounded-lg w-fit`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-800">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'completed', 'failed', 'pending'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                User
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                Credits
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Created
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Images
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedGenerations.map((gen) => (
              <tr key={gen.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{gen.userEmail}</div>
                  <div className="text-xs text-gray-400">{gen.userId.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {getStatusBadge(gen.status)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-medium text-gray-700">{gen.creditsUsed}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(gen.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {gen.originalImageUrl && (
                      <a
                        href={gen.originalImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                      >
                        <img
                          src={gen.originalImageUrl}
                          alt="Original"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 hover:border-blue-500 transition-colors"
                        />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Original
                        </span>
                      </a>
                    )}
                    {gen.cartoonImageUrl && (
                      <a
                        href={gen.cartoonImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                      >
                        <img
                          src={gen.cartoonImageUrl}
                          alt="Cartoon"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 hover:border-pink-500 transition-colors"
                        />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Cartoon
                        </span>
                      </a>
                    )}
                    {!gen.originalImageUrl && !gen.cartoonImageUrl && (
                      <span className="text-gray-400 text-sm">No images</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedGenerations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {data.recentGenerations.length === 0 ? 'No generations found' : 'No generations match your filters'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredGenerations.length)} of {filteredGenerations.length}
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
