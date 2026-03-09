'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Users } from 'lucide-react';

interface DemographyData {
  gender: { name: string; value: number }[];
  relationshipStatus: { name: string; value: number }[];
  occasionType: { name: string; value: number }[];
  ageGroups: { name: string; value: number }[];
  topJobs: { name: string; value: number }[];
  profileCompletion: { total: number; completed: number; rate: number };
}

interface DemographyChartsProps {
  data: DemographyData;
}

const GENDER_COLORS: Record<string, string> = {
  'ชาย': '#3B82F6',
  'หญิง': '#EC4899',
  'อื่นๆ': '#8B5CF6',
  'ไม่ระบุ': '#D1D5DB',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  'โสด': '#22C55E',
  'มีแฟน': '#8B5CF6',
  'แต่งงาน': '#F59E0B',
  'อื่นๆ': '#6B7280',
  'ไม่ระบุ': '#D1D5DB',
};

const OCCASION_COLORS: Record<string, string> = {
  'วาเลนไทน์': '#EF4444',
  'วันครบรอบ': '#D4A017',
  'วันเกิด': '#F97316',
  'อื่นๆ': '#6B7280',
  'ไม่ระบุ': '#D1D5DB',
};

const FALLBACK_COLORS = [
  '#3B82F6', '#EC4899', '#8B5CF6', '#22C55E', '#F59E0B',
  '#EF4444', '#F97316', '#6B7280', '#D1D5DB',
];

function getColor(colorMap: Record<string, string>, name: string, index: number): string {
  return colorMap[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Custom label rendered in the center of a donut chart
function DonutCenterLabel({
  cx,
  cy,
  total,
}: {
  cx: number;
  cy: number;
  total: number;
}) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" fontSize={22} fontWeight={700} fill="#1F2937">
        {total.toLocaleString()}
      </tspan>
      <tspan x={cx} dy={20} fontSize={11} fill="#6B7280">
        คน
      </tspan>
    </text>
  );
}

interface DonutChartProps {
  title: string;
  data: { name: string; value: number }[];
  colorMap: Record<string, string>;
}

function DonutChart({ title, data, colorMap }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">{title}</h4>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          ไม่มีข้อมูล
        </div>
      ) : (
        <>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColor(colorMap, entry.name, index)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number | undefined) => [
                    `${(value ?? 0).toLocaleString()} คน`,
                    '',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Center label rendered via absolute positioning to avoid SVG coordination issues */}
          <div className="relative -mt-[180px] h-[180px] flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 leading-none">
                {total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">คน</p>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-1.5">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColor(colorMap, entry.name, index) }}
                  />
                  <span className="text-xs text-gray-600 truncate">{entry.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800 ml-2 flex-shrink-0">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DemographyCharts({ data }: DemographyChartsProps) {
  const hasAnyData =
    data.gender.some((d) => d.value > 0) ||
    data.ageGroups.some((d) => d.name !== 'ไม่ระบุ' && d.value > 0) ||
    data.topJobs.length > 0;

  const ageBarData = data.ageGroups.filter((d) => d.name !== 'ไม่ระบุ' && d.value > 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {/* Section header */}
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Users size={22} className="text-blue-500" />
        ข้อมูลประชากรผู้ใช้
      </h2>

      {!hasAnyData ? (
        <p className="text-center text-gray-400 py-12">ไม่มีข้อมูล</p>
      ) : (
        <div className="space-y-8">
          {/* Row 1: 3 donut charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <DonutChart
              title="เพศ"
              data={data.gender}
              colorMap={GENDER_COLORS}
            />
            <DonutChart
              title="สถานะความสัมพันธ์"
              data={data.relationshipStatus}
              colorMap={RELATIONSHIP_COLORS}
            />
            <DonutChart
              title="โอกาสที่ใช้งาน"
              data={data.occasionType}
              colorMap={OCCASION_COLORS}
            />
          </div>

          {/* Row 2: Age distribution bar chart */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">การกระจายตามอายุ</h4>
            {ageBarData.every((d) => d.value === 0) ? (
              <p className="text-center text-gray-400 py-8 text-sm">ไม่มีข้อมูล</p>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageBarData}
                    margin={{ top: 24, right: 16, left: 0, bottom: 0 }}
                    barCategoryGap="35%"
                  >
                    <defs>
                      <linearGradient id="ageBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B9D" stopOpacity={1} />
                        <stop offset="100%" stopColor="#E63946" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        fontSize: '13px',
                      }}
                      formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()} คน`, 'จำนวน']}
                    />
                    <Bar dataKey="value" fill="url(#ageBarGradient)" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        style={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(val: any) => {
                          const n = Number(val ?? 0);
                          return n > 0 ? n.toLocaleString() : '';
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Row 3: Profile completion + Top jobs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Profile completion */}
            <div className="border border-gray-100 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                การกรอกข้อมูลโปรไฟล์ครบถ้วน
              </h4>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-3xl font-bold text-gray-800">
                  {data.profileCompletion.rate}%
                </span>
                <span className="text-sm text-gray-500 mb-1">
                  ({data.profileCompletion.completed.toLocaleString()} /{' '}
                  {data.profileCompletion.total.toLocaleString()} คน)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-green-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, data.profileCompletion.rate)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ผู้ใช้ที่รับเครดิตจากการกรอกข้อมูลโปรไฟล์ครบ
              </p>
            </div>

            {/* Top jobs */}
            <div className="border border-gray-100 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">อาชีพยอดนิยม</h4>
              {data.topJobs.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">ไม่มีข้อมูล</p>
              ) : (
                <ol className="space-y-2">
                  {data.topJobs.map((job, index) => (
                    <li key={job.name} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-gray-400 text-right flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 truncate">{job.name}</span>
                      <span className="flex-shrink-0 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {job.value.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
