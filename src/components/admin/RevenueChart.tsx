'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
    data: {
        date: string;
        amount: number;
    }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
    // Calculate total revenue in the period
    const totalRevenue = data.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">รายได้รวม (30 วันล่าสุด)</h3>
                <span className="text-2xl font-bold text-green-600">
                    ฿{totalRevenue.toLocaleString()}
                </span>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(value) => `฿${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                border: '1px solid #E5E7EB',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            formatter={(value: number | undefined) => [`฿${(value || 0).toLocaleString()}`, 'รายได้']}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#10B981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
