'use client';

import { useEffect, useState } from 'react';
import {
  Clock,
  Users,
  Timer,
  Repeat,
  LogIn,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import HeartLoader from '@/components/HeartLoader';

interface Totals {
  sessions: number;
  activeUsers: number;
  totalSeconds: number;
  avgSessionSeconds: number;
  secondsPerUser: number;
}
interface DailyRow {
  day: string;
  sessions: number;
  activeUsers: number;
  totalSeconds: number;
  avgSessionSeconds: number;
}
interface TopUser {
  userId: string;
  email: string;
  sessions: number;
  totalSeconds: number;
  lastSeenAt: string;
}
interface EngagementData {
  days: number;
  totals: Totals;
  daily: DailyRow[];
  topUsers: TopUser[];
  stickiness: { dau: number; mau: number };
}

const WINDOWS = [7, 30, 90];

/** Seconds -> the shortest human form. Admin reads these at a glance. */
function humanTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export default function AdminEngagementPage() {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/engagement?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to fetch engagement:', e);
        setLoading(false);
      });
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <HeartLoader message="กำลังโหลด..." size="md" />
      </div>
    );
  }

  if (!data?.totals) {
    return <div className="text-center py-12 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>;
  }

  const { totals, daily, topUsers, stickiness } = data;

  // DAU/MAU is the standard stickiness ratio: what share of monthly users show up daily.
  const stickyPct =
    stickiness.mau > 0 ? Math.round((stickiness.dau / stickiness.mau) * 100) : 0;

  const cards = [
    {
      label: 'เวลาที่ใช้ทั้งหมด',
      value: humanTime(totals.totalSeconds),
      icon: Clock,
      color: 'bg-indigo-500',
    },
    {
      label: 'เวลาเฉลี่ย / ครั้ง',
      value: humanTime(totals.avgSessionSeconds),
      icon: Timer,
      color: 'bg-emerald-500',
    },
    {
      label: 'เวลาเฉลี่ย / คน',
      value: humanTime(totals.secondsPerUser),
      icon: Users,
      color: 'bg-pink-500',
    },
    {
      label: 'จำนวนครั้งที่เข้าใช้',
      value: totals.sessions.toLocaleString(),
      icon: LogIn,
      color: 'bg-amber-500',
    },
    {
      label: `Stickiness (DAU/MAU)`,
      value: `${stickyPct}%`,
      icon: Repeat,
      color: 'bg-purple-500',
    },
  ];

  const chartData = (daily || []).map((d) => ({
    day: d.day?.slice(5), // MM-DD
    minutes: Math.round((d.totalSeconds || 0) / 60),
    users: d.activeUsers,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Time in App</h1>
          <p className="text-sm text-gray-500">
            เวลาที่ผู้ใช้ใช้งานในแอป (นับเฉพาะตอนเปิดหน้าจออยู่จริง)
          </p>
        </div>
        <div className="flex gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === w
                  ? 'bg-[#E63946] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className={`${c.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 truncate">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          เวลาที่ใช้ต่อวัน (นาที) + ผู้ใช้ที่ใช้งาน
        </h2>
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">ยังไม่มีข้อมูล</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
              />
              <Tooltip />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="minutes"
                name="นาที"
                stroke="#E63946"
                fill="#E6394622"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="users"
                name="ผู้ใช้"
                stroke="#457B9D"
                fill="#457B9D22"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">ผู้ใช้ที่ใช้เวลามากที่สุด</h2>
        </div>
        {(topUsers || []).length === 0 ? (
          <div className="text-center py-12 text-gray-500">ยังไม่มีข้อมูล</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  เวลารวม
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  ครั้งที่เข้า
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  ล่าสุด
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topUsers.map((u) => (
                <tr key={u.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{u.email}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#E63946]">
                    {humanTime(u.totalSeconds)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{u.sessions}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    {new Date(u.lastSeenAt).toLocaleDateString('th-TH', {
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
        )}
      </div>
    </div>
  );
}
