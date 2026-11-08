"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function CustomerProfileSkeleton() {
  return (
    <div
      className="min-h-screen w-full overflow-y-auto pb-32 sm:pb-36 bg-slate-100 animate-pulse [WebkitOverflowScrolling:touch]"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
        {/* Navigation & Action Bar Skeleton */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/customers"
            className="font-bold text-slate-400 flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Customers Directory</span>
          </Link>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="h-8 w-24 sm:w-28 bg-slate-200 rounded-xl" />
            <div className="h-8 w-24 sm:w-28 bg-slate-200 rounded-xl" />
            <div className="h-8 w-32 sm:w-36 bg-slate-200 rounded-xl" />
            <div className="h-8 w-28 sm:w-32 bg-slate-300 rounded-xl" />
          </div>
        </div>

        {/* Patient Profile Card & Lifetime KPIs Skeleton */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              {/* Avatar circle */}
              <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-40 bg-slate-200 rounded-md" />
                  <div className="h-4 w-12 bg-slate-100 rounded-md" />
                  <div className="h-4 w-24 bg-slate-100 rounded-full" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-3.5 w-28 bg-slate-100 rounded" />
                  <div className="h-3.5 w-36 bg-slate-100 rounded" />
                  <div className="h-3.5 w-24 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="h-2.5 w-20 bg-slate-200 rounded" />
                <div className="h-5 w-28 bg-slate-300 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 1: Prescriptions History Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-200 rounded" />
          </div>
          <div className="p-5 space-y-3">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-3.5 w-28 bg-slate-200 rounded" />
              </div>
              <div className="h-24 w-full bg-slate-200/60 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Section 2: Orders & Invoices Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="h-4 w-52 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
          </div>
          <div className="p-5 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 w-full bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
