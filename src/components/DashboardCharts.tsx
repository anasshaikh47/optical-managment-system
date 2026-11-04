"use client";

import { useState, useRef, useEffect } from "react";
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
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // Auto-dismiss active touch selection after 2.5s so it never gets permanently stuck
    touchTimeoutRef.current = setTimeout(() => {
      setActiveIndex(null);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  // Floating non-blocking tooltip badge
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
            <p className="font-bold text-slate-100 text-xs truncate max-w-[140px]">{data.label || data.name}</p>
          </div>
          <p className="font-black text-xs font-mono text-cyan-400">
            {formatCurrency(data.value)}{" "}
            <span className="text-[10px] text-slate-300 font-normal">({data.percentage}%)</span>
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

  const activeItem = activeIndex !== null ? breakdownData[activeIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Chart Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
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

        <div className="text-left sm:text-right">
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
        {/* The Circular Donut Visual with Responsive Aspect-Square Mobile Sizing */}
        <div className="lg:col-span-5 relative flex items-center justify-center w-full max-w-[280px] sm:max-w-[340px] mx-auto aspect-square select-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart style={{ outline: "none" }}>
              <Tooltip
                content={<CustomTooltip />}
                cursor={false}
                wrapperStyle={{
                  pointerEvents: "none",
                  zIndex: 40,
                  outline: "none",
                }}
              />
              <Pie
                data={breakdownData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={4}
                cornerRadius={5}
                onMouseEnter={(_, index) => handleSliceHover(index)}
                onMouseLeave={handleSliceLeave}
                onClick={(_, index) => handleSliceClick(index)}
                style={{ outline: "none" }}
              >
                {breakdownData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-150"
                    style={{
                      outline: "none",
                      WebkitTapHighlightColor: "transparent",
                      opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
                      filter: activeIndex === index ? "drop-shadow(0 2px 6px rgba(0,0,0,0.18))" : "none",
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Info in Donut (Always vertically & horizontally centered with clean backing and z-index) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-10 select-none">
            <div className="w-[124px] sm:w-[144px] aspect-square rounded-full bg-white/95 backdrop-blur-2xs flex flex-col items-center justify-center shadow-xs border border-slate-100/90 p-2 transition-all duration-200">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[110px]">
                {activeItem ? activeItem.name : "Total Sales"}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight mt-0.5">
                {formatCurrency(activeItem ? activeItem.value : totalValue)}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border transition-colors ${
                  activeItem
                    ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                    : "text-emerald-700 bg-emerald-50 border-emerald-200"
                }`}
              >
                {activeItem
                  ? `${activeItem.percentage}% Share`
                  : "Active Counter"}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Legend Cards (7 Cols on LG) */}
        <div className="lg:col-span-7 space-y-3">
          {breakdownData.map((item, idx) => (
            <div
              key={item.name}
              onMouseEnter={() => handleSliceHover(idx)}
              onMouseLeave={handleSliceLeave}
              onClick={() => handleSliceClick(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeIndex === idx
                  ? "bg-slate-50 border-slate-300 shadow-xs ring-1 ring-slate-200"
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
