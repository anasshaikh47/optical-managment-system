"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { PieChart as PieChartIcon, Glasses, Layers, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardChartsProps {
  analytics?: {
    salesBreakdown?: Array<{
      name: string;
      label?: string;
      value: number;
      percentage: number;
      color: string;
      count?: number;
    }>;
  };
}

export function DashboardCharts({ analytics }: DashboardChartsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const breakdownData =
    analytics?.salesBreakdown && analytics.salesBreakdown.length > 0
      ? analytics.salesBreakdown
      : [
          {
            name: "Frames",
            label: "Spectacle Frames",
            value: 18500,
            percentage: 55,
            color: "#2563EB",
            count: 5,
          },
          {
            name: "Lenses",
            label: "Prescription Lenses",
            value: 11800,
            percentage: 35,
            color: "#10B981",
            count: 4,
          },
          {
            name: "Services/Repairing",
            label: "Fitting, Lab & Repairs",
            value: 3400,
            percentage: 10,
            color: "#F59E0B",
            count: 3,
          },
        ];

  const totalValue = breakdownData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <p className="font-bold text-slate-100">{data.label || data.name}</p>
          </div>
          <p className="font-black text-sm font-mono text-cyan-400">
            {formatCurrency(data.value)}
          </p>
          <p className="text-[10px] text-slate-400">
            Share: <strong className="text-white">{data.percentage}%</strong> of total sales
          </p>
        </div>
      );
    }
    return null;
  };

  const getCategoryIcon = (name: string) => {
    if (name.toLowerCase().includes("frame")) {
      return <Glasses className="w-4 h-4 text-blue-600" />;
    }
    if (name.toLowerCase().includes("lens")) {
      return <Layers className="w-4 h-4 text-emerald-600" />;
    }
    return <Wrench className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      {/* Chart Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <PieChartIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Sales Breakdown
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Revenue distribution across Frames vs Lenses vs Services & Repairing
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Revenue Audited
          </span>
          <span className="font-black text-slate-900 text-base font-mono">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Main Visual: Single Circular Donut Graph & Detailed Legend Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-5">
        {/* The Circular Donut Visual (5 Cols on LG) */}
        <div className="lg:col-span-5 relative flex items-center justify-center h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={breakdownData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={104}
                paddingAngle={4}
                cornerRadius={5}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {breakdownData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="transition-all duration-200 cursor-pointer hover:opacity-90"
                    style={{
                      transform:
                        activeIndex === index ? "scale(1.03)" : "scale(1)",
                      transformOrigin: "center center",
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Info in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Sales
            </span>
            <span className="text-lg font-black text-slate-900 font-mono tracking-tight mt-0.5">
              {formatCurrency(totalValue)}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full mt-1 border border-emerald-200">
              Active Counter
            </span>
          </div>
        </div>

        {/* Breakdown Legend Cards (7 Cols on LG) */}
        <div className="lg:col-span-7 space-y-3">
          {breakdownData.map((item, idx) => (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeIndex === idx
                  ? "bg-slate-50 border-slate-300 shadow-xs"
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${item.color}15`,
                    }}
                  >
                    {getCategoryIcon(item.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>{item.label || item.name}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.percentage}%
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {item.name === "Frames"
                        ? "Prescription frames, sunglasses & designer eyewear"
                        : item.name === "Lenses"
                        ? "Single vision, bifocal & digital progressive lenses"
                        : "Workshop edging, ARC coatings & frame repairs"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-sm font-mono text-slate-900">
                    {formatCurrency(item.value)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {item.count ? `${item.count} items recorded` : "Recorded in ledger"}
                  </p>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
