"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardChartsProps {
  analytics?: {
    dailyTrend?: any[];
    weeklyTrend?: any[];
  };
}

export function DashboardCharts({ analytics }: DashboardChartsProps) {
  // Use daily/weekly data or fallback to clean 7-day default
  const trendData =
    analytics?.weeklyTrend && analytics.weeklyTrend.length > 0
      ? analytics.weeklyTrend.map((d: any) => ({
          label: d.day || d.label || d.date,
          sales: d.sales || d.amount || 0,
        }))
      : [
          { label: "Mon", sales: 8400 },
          { label: "Tue", sales: 12500 },
          { label: "Wed", sales: 9800 },
          { label: "Thu", sales: 14200 },
          { label: "Fri", sales: 18600 },
          { label: "Sat", sales: 24500 },
          { label: "Today", sales: 6000 },
        ];

  const totalWeekSales = trendData.reduce((acc, curr) => acc + curr.sales, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg border border-slate-800 text-xs space-y-0.5">
          <p className="font-semibold text-slate-400">{label}</p>
          <p className="font-bold font-mono text-cyan-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Sales Revenue Summary
            </h3>
            <p className="text-[11px] text-slate-500">
              Weekly optical store sales trend
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-bold uppercase">
            Total 7-Day Revenue
          </span>
          <span className="font-bold text-slate-900 text-sm font-mono">
            {formatCurrency(totalWeekSales)}
          </span>
        </div>
      </div>

      {/* Clean Single Recharts Bar Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="sales"
              name="Sales"
              fill="#0891b2"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
