'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, Users, CreditCard, Eye } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface RateRow {
  label: string;
  memories: number;
  paid: number;
  payRate: number;
}
interface Insights {
  days: number;
  funnel: { signedUp: number; created: number; paid: number };
  overallPayRate: number;
  byStoryCount: Array<{ bucket: string; memories: number; paid: number; payRate: number }>;
  byStoryType: Array<{ type: string; memories: number; paid: number; payRate: number }>;
  byTheme: Array<{ theme: string; memories: number; paid: number; payRate: number }>;
  byReferred: {
    referred: { memories: number; paid: number; payRate: number };
    organic: { memories: number; paid: number; payRate: number };
  };
  byProfileComplete: {
    complete: { memories: number; paid: number; payRate: number };
    incomplete: { memories: number; paid: number; payRate: number };
  };
  recipient: {
    sessions: number;
    avgDwellSecs: number;
    completionPct: number;
    dropoff: Array<{ story: number; reached: number }>;
  };
  revenue: {
    paidMemories: number;
    memoryRevenueThbEst: number;
    creditRevenueThb: number;
    payingUsers: number;
    daily: Array<{ day: string; paidMemories: number; revenueThbEst: number }>;
  };
}

const WINDOWS = [30, 90, 365];
const BAR = '#E63946';

function pct(n: number) {
  return `${(n ?? 0).toFixed(1)}%`;
}

/** Horizontal "pay rate by X" chart — the core driver visual. */
function DriverChart({
  title,
  rows,
  hint,
}: {
  title: string;
  rows: RateRow[];
  hint?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.payRate));
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
      {hint && <p className="text-xs text-gray-400 mb-3">{hint}</p>}
      <ResponsiveContainer width="100%" height={Math.max(140, rows.length * 42)}>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 40 }}>
          <XAxis type="number" domain={[0, Math.ceil(max * 1.15)]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fontSize: 12, fill: '#4B5563' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, 'Pay rate']}
            labelFormatter={(label) => {
              const row = rows.find((r) => r.label === label);
              return row ? `${label} — ${row.paid}/${row.memories} paid` : String(label);
            }}
          />
          <Bar dataKey="payRate" radius={[0, 6, 6, 0]} label={{ position: 'right', formatter: (v) => `${v}%`, fontSize: 12, fill: '#6B7280' }}>
            {rows.map((r, i) => (
              <Cell key={i} fill={BAR} fillOpacity={0.35 + 0.65 * (r.payRate / max)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminInsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/insights?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Failed to load insights:', e);
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
  if (!data?.funnel) {
    return <div className="text-center py-12 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>;
  }

  const { funnel, byReferred, byProfileComplete, recipient, revenue } = data;
  const createRate = funnel.signedUp ? (100 * funnel.created) / funnel.signedUp : 0;
  const payOfCreated = funnel.created ? (100 * funnel.paid) / funnel.created : 0;

  const storyCountRows: RateRow[] = data.byStoryCount.map((r) => ({
    label: `${r.bucket} stories`,
    memories: r.memories,
    paid: r.paid,
    payRate: r.payRate,
  }));
  const storyTypeRows: RateRow[] = data.byStoryType.map((r) => ({
    label: r.type,
    memories: r.memories,
    paid: r.paid,
    payRate: r.payRate,
  }));
  const themeRows: RateRow[] = data.byTheme.map((r) => ({
    label: r.theme,
    memories: r.memories,
    paid: r.paid,
    payRate: r.payRate,
  }));
  const attrRows: RateRow[] = [
    { label: 'Referred', ...byReferred.referred },
    { label: 'Organic', ...byReferred.organic },
    { label: 'Profile ✓', ...byProfileComplete.complete },
    { label: 'Profile ✗', ...byProfileComplete.incomplete },
  ].map((r) => ({ label: r.label, memories: r.memories, paid: r.paid, payRate: r.payRate }));

  const dropoffData = recipient.dropoff.map((d) => ({
    story: `#${d.story + 1}`,
    reached: d.reached,
  }));
  const revenueData = revenue.daily.map((d) => ({
    day: d.day?.slice(5),
    thb: d.revenueThbEst,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Insights</h1>
          <p className="text-sm text-gray-500">อะไรทำให้ลูกค้าจ่ายเงิน + ฟันเนล + การรับชม</p>
        </div>
        <div className="flex gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === w ? 'bg-[#E63946] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'สมัคร (signup)', value: funnel.signedUp.toLocaleString(), sub: '', icon: Users, color: 'bg-slate-500' },
          { label: 'สร้างความทรงจำ', value: funnel.created.toLocaleString(), sub: `${createRate.toFixed(0)}% ของผู้สมัคร`, icon: TrendingUp, color: 'bg-amber-500' },
          { label: 'จ่ายเงิน', value: funnel.paid.toLocaleString(), sub: `${payOfCreated.toFixed(0)}% ของผู้สร้าง`, icon: CreditCard, color: 'bg-emerald-500' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`${c.color} p-3 rounded-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 truncate">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                  {c.sub && <p className="text-xs text-gray-400">{c.sub}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pay drivers — the headline */}
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-xl font-bold text-gray-800">อะไรทำให้จ่ายเงิน (Pay drivers)</h2>
        <span className="text-sm text-gray-400">เฉลี่ยรวม {pct(data.overallPayRate)}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DriverChart
          title="ตามจำนวนเรื่องราว"
          hint="ยิ่งมีเรื่องราวมาก ยิ่งจ่ายมากขึ้นชัดเจน"
          rows={storyCountRows}
        />
        <DriverChart
          title="ตามชนิดเรื่องราวที่มีในความทรงจำ"
          hint="อัตราการจ่ายของความทรงจำที่มีเรื่องราวชนิดนั้นๆ"
          rows={storyTypeRows}
        />
        <DriverChart title="ตามธีม / โอกาส" rows={themeRows} />
        <DriverChart
          title="ตามคุณสมบัติผู้ใช้"
          hint="ผู้ใช้ที่มาจากโค้ดแนะนำ / กรอกโปรไฟล์ครบ"
          rows={attrRows}
        />
      </div>

      {/* Recipient engagement + revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={18} className="text-[#457B9D]" />
            <h3 className="font-bold text-gray-800">การรับชมของผู้รับ</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            ดูจบ {pct(recipient.completionPct)} · เฉลี่ย {recipient.avgDwellSecs}s · {recipient.sessions.toLocaleString()} ครั้ง
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dropoffData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="story" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip formatter={(v) => [Number(v).toLocaleString(), 'ดูถึง']} />
              <Bar dataKey="reached" fill="#457B9D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">จำนวนผู้รับที่ดูถึงเรื่องราวลำดับที่ N (drop-off)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-1">รายได้ต่อวัน (ประมาณ)</h3>
          <p className="text-xs text-gray-400 mb-3">
            ความทรงจำ ~฿{revenue.memoryRevenueThbEst.toLocaleString()} (ประมาณ ฿99/ชิ้น) · เครดิต ฿{revenue.creditRevenueThb.toLocaleString()} · {revenue.payingUsers.toLocaleString()} ผู้จ่าย
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip formatter={(v) => [`฿${Number(v).toLocaleString()}`, 'รายได้ (ประมาณ)']} />
              <Area type="monotone" dataKey="thb" stroke="#E63946" fill="#E6394622" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
