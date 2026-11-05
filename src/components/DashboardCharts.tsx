"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { PieChart as PieChartIcon, Pill, FlaskConical, Syringe, Package, Zap } from "lucide-react";
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
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const breakdownData = analytics?.salesBreakdown || [];
  const totalValue = breakdownData.reduce((acc, curr) => acc + curr.value, 0);
  const hasData = breakdownData.length > 0 && totalValue > 0;

  const handleSliceHover = (index: number) => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    setActiveIndex(index);
  };

  const handleSliceLeave = () => {
    setActiveIndex(null);
  };

  const handleSliceClick = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => {
      setActiveIndex(null);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl shadow-xl border border-slate-700/80 text-xs space-y-0.5 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <p className="font-bold text-slate-100 text-xs truncate max-w-[160px]">{data.label || data.name}</p>
          </div>
          <p className="font-black text-xs font-mono text-emerald-400">
            {formatCurrency(data.value)}{" "}
            <span className="text-[10px] text-slate-300 font-normal">({data.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("strip") || n.includes("tablet") || n.includes("capsule")) {
      return <Pill className="w-4 h-4 text-blue-600" />;
    }
    if (n.includes("syrup") || n.includes("liquid") || n.includes("bottle")) {
      return <FlaskConical className="w-4 h-4 text-emerald-600" />;
    }
    if (n.includes("ointment") || n.includes("injection") || n.includes("syringe")) {
      return <Syringe className="w-4 h-4 text-amber-600" />;
    }
    return <Package className="w-4 h-4 text-purple-600" />;
  };

  const activeItem = activeIndex !== null ? breakdownData[activeIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Chart Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <PieChartIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              Pharma Sales Breakdown by Category
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Revenue distribution across tablets, oral liquids, topicals & general health
            </p>
          </div>
        </div>

        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>New Medical Bill</span>
        </Link>
      </div>

      {/* Chart Content Area */}
      <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Interactive Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
          {hasData ? (
            <>
              <div className="w-full h-52 sm:h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(_, index) => handleSliceClick(index)}
                      onMouseEnter={(_, index) => handleSliceHover(index)}
                      onMouseLeave={handleSliceLeave}
                      cursor="pointer"
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={activeIndex === index ? 3 : 1.5}
                          style={{
                            transition: "all 0.2s ease-in-out",
                            transform: activeIndex === index ? "scale(1.05)" : "scale(1)",
                            transformOrigin: "center center",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  {activeItem ? (
                    <div className="text-center animate-in fade-in duration-150 px-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate max-w-[120px]">
                        {activeItem.label || activeItem.name}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 font-mono block">
                        {formatCurrency(activeItem.value)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        {activeItem.percentage}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Volume
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 font-mono block">
                        {formatCurrency(totalValue)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        Pharma Revenue
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-medium text-center mt-1">
                Tap or hover segment to inspect category
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center">
              <Pill className="w-8 h-8 mb-2 opacity-30 text-emerald-600" />
              <p className="font-semibold text-slate-600">No pharmacy sales recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Billing records will plot category distribution here.</p>
            </div>
          )}
        </div>

        {/* Right Column: Category Breakdown Cards */}
        <div className="lg:col-span-7 space-y-2.5">
          {breakdownData.map((item, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <div
                key={item.name}
                onClick={() => handleSliceClick(idx)}
                onMouseEnter={() => handleSliceHover(idx)}
                onMouseLeave={handleSliceLeave}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-50 border-emerald-500 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      {getCategoryIcon(item.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {item.label || item.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {item.count ? `${item.count} units dispensed` : `${item.percentage}% of store turnover`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-slate-900 text-xs sm:text-sm block">
                      {formatCurrency(item.value)}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded inline-block"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
