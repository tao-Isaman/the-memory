'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Coins,
} from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';
import { useToast } from '@/hooks/useToast';

interface ReferralClaim {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  payment_method: string;
  payment_info: string;
  bank_name: string | null;
  account_name: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

interface ReferralStats {
  totalReferralCodes: number;
  totalReferredUsers: number;
  totalConversions: number;
  pendingClaims: number;
  totalClaimedAmount: number;
  topReferrers: {
    userId: string;
    email: string;
    referralCode: string;
    referredCount: number;
  }[];
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'rejected';

const ITEMS_PER_PAGE = 20;

export default function AdminReferralClaimsPage() {
  const { showToast } = useToast();
  const [allClaims, setAllClaims] = useState<ReferralClaim[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<{ [key: string]: string }>({});

  // Fetch stats
  useEffect(() => {
    setStatsLoading(true);
    fetch('/api/admin/referral-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch referral stats:', err);
        setStatsLoading(false);
      });
  }, []);

  // Fetch claims
  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/referral-claims?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setAllClaims(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch referral claims:', err);
        setLoading(false);
      });
  }, [statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filter and paginate
  const filteredClaims = useMemo(() => {
    let result = [...allClaims];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((claim) => claim.user_email.toLowerCase().includes(query));
    }

    return result;
  }, [allClaims, searchQuery]);

  const totalPages = Math.ceil(filteredClaims.length / ITEMS_PER_PAGE);
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClaims.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClaims, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleProcessClaim = async (claimId: string, newStatus: 'completed' | 'rejected') => {
    if (processingId) return; // Prevent double-click

    const adminNote = adminNoteInput[claimId]?.trim() || '';

    if (!confirm(`Are you sure you want to ${newStatus} this claim?`)) {
      return;
    }

    setProcessingId(claimId);

    try {
      const response = await fetch(`/api/admin/referral-claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_note: adminNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to update claim');
      }

      const updatedClaim = await response.json();

      // Update local state
      setAllClaims((prev) =>
        prev.map((claim) => (claim.id === claimId ? updatedClaim : claim))
      );

      // Clear admin note input
      setAdminNoteInput((prev) => {
        const newInputs = { ...prev };
        delete newInputs[claimId];
        return newInputs;
      });

      // Refresh stats
      fetch('/api/admin/referral-stats')
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch(console.error);
    } catch (error) {
      console.error('Error processing claim:', error);
      showToast('Failed to process claim. Please try again.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock size={14} />
            Pending
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle size={14} />
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return <span className="text-gray-500">{status}</span>;
    }
  };

  if (loading && statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <HeartLoader message="กำลังโหลด..." size="md" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Referral Claims</h1>
        <p className="text-gray-500">
          {filteredClaims.length} filtered / {allClaims.length} total claims
        </p>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Referral Codes</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalReferralCodes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Referred Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalReferredUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Conversions</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalConversions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Claims</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingClaims}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-100 rounded-lg">
                <DollarSign size={24} className="text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Claimed</p>
                <p className="text-2xl font-bold text-gray-800">฿{stats.totalClaimedAmount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Referrers Section */}
      {stats && stats.topReferrers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-800">Top Referrers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.topReferrers.map((referrer, index) => (
              <div
                key={referrer.userId}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? 'bg-yellow-500 text-white'
                      : index === 1
                      ? 'bg-gray-400 text-white'
                      : index === 2
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{referrer.email}</p>
                  <p className="text-xs text-gray-500">
                    <code className="bg-gray-200 px-1 rounded">{referrer.referralCode}</code> • {referrer.referredCount} referred
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {(['all', 'pending', 'completed', 'rejected'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User Email</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Payment Method</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Payment Info</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Processed</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedClaims.map((claim) => (
              <tr key={claim.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{claim.user_email}</div>
                  <div className="text-xs text-gray-400">{claim.user_id.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full">
                    <Coins size={14} className="text-green-600" />
                    <span className="font-bold text-green-600">฿{claim.amount}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700 capitalize">
                    {claim.payment_method === 'promptpay' ? 'PromptPay' : 'Bank Transfer'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {claim.payment_method === 'promptpay' ? (
                    <div className="text-sm text-gray-700">{claim.payment_info}</div>
                  ) : (
                    <div className="text-sm">
                      <div className="text-gray-700 font-medium">{claim.bank_name}</div>
                      <div className="text-gray-500">{claim.account_name}</div>
                      <div className="text-gray-400 text-xs">{claim.payment_info}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">{getStatusBadge(claim.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(claim.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {claim.processed_at
                    ? new Date(claim.processed_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                  {claim.admin_note && (
                    <div className="text-xs text-gray-400 mt-1 italic">{claim.admin_note}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {claim.status === 'pending' ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Admin note (optional)"
                        value={adminNoteInput[claim.id] || ''}
                        onChange={(e) =>
                          setAdminNoteInput((prev) => ({ ...prev, [claim.id]: e.target.value }))
                        }
                        className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcessClaim(claim.id, 'completed')}
                          disabled={processingId === claim.id}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcessClaim(claim.id, 'rejected')}
                          disabled={processingId === claim.id}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedClaims.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {allClaims.length === 0 ? 'No claims found' : 'No claims match your filters'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredClaims.length)} of {filteredClaims.length}
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
