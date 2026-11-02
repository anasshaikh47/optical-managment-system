"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, PieChart as PieIcon, BarChart3, Layers, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardChartsProps {
  analytics: {
    dailyTrend: any[];
    weeklyTrend: any[];
    monthlyTrend: any[];
    topBrands: any[];
    topLensTypes: any[];
  };
}

const BRAND_COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
const LENS_COLORS = ["#0284c7", "#059669", "#d97706", "#7c3aed", "#e11d48"];

export function DashboardCharts({ analytics }: DashboardChartsProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [pieCategory, setPieCategory] = useState<"brands" | "lenses">("brands");

  const trendData =
    timeframe === "daily"
      ? analytics.dailyTrend || []
      : timeframe === "weekly"
      ? analytics.weeklyTrend || []
      : analytics.monthlyTrend || [];

  const pieData =
    pieCategory === "brands"
      ? (analytics.topBrands || []).map((b) => ({ name: b.brand, value: b.value, count: b.count }))
      : (analytics.topLensTypes || []).map((l) => ({ name: l.type, value: l.value, count: l.count }));

  const totalPieValue = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold font-mono">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalPieValue > 0 ? ((data.value / totalPieValue) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-bold text-cyan-400">{data.name}</p>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Sales Revenue:</span>
            <span className="font-bold text-white font-mono">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-400">
            <span>Share:</span>
            <span className="font-bold text-emerald-400">{percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Sales & Net Profit Trend (2 Columns) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Sales & Revenue Analytics
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Gross sales revenue vs calculated net margin across optical orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Area vs Bar Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setChartType("area")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartType === "area"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartType === "bar"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Bar
              </button>
            </div>

            {/* Timeframe Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTimeframe("daily")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  timeframe === "daily"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe("weekly")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  timeframe === "weekly"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe("monthly")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  timeframe === "monthly"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey={timeframe === "daily" ? "date" : timeframe === "weekly" ? "week" : "month"}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Gross Revenue"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Net Margin"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey={timeframe === "daily" ? "date" : timeframe === "weekly" ? "week" : "month"}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                />
                <Bar dataKey="sales" name="Gross Revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" name="Net Margin" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Top Brands & Lens Types (Donut/Pie Chart) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Optical Catalog Share
              </h3>
              <p className="text-[10px] text-slate-500">Volume distribution by sales</p>
            </div>
          </div>

          {/* Toggle between Brands vs Lens Types */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setPieCategory("brands")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                pieCategory === "brands"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Frames
            </button>
            <button
              onClick={() => setPieCategory("lenses")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                pieCategory === "lenses"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Lenses
            </button>
          </div>
        </div>

        {/* Donut Chart with Center Legend */}
        <div className="h-56 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      pieCategory === "brands"
                        ? BRAND_COLORS[index % BRAND_COLORS.length]
                        : LENS_COLORS[index % LENS_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {pieCategory === "brands" ? "Frame Brands" : "Power Lenses"}
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white font-mono">
              {formatCurrency(totalPieValue)}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {pieData.slice(0, 4).map((entry, idx) => {
            const color =
              pieCategory === "brands"
                ? BRAND_COLORS[idx % BRAND_COLORS.length]
                : LENS_COLORS[idx % LENS_COLORS.length];
            const percent =
              totalPieValue > 0 ? ((entry.value / totalPieValue) * 100).toFixed(0) : 0;

            return (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-slate-500">{formatCurrency(entry.value)}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 w-8 text-right">
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
