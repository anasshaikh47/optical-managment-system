"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Glasses,
  IndianRupee,
  Clock,
  ArrowRight,
  Phone,
  Printer,
  ChevronRight,
  Plus,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ReceiptModal } from "@/components/ReceiptModal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {};
  const recentOrders = data?.urgentOrders || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="VisionPulse Optical Dashboard"
        subtitle="Live Store Register Overview & Daily Sales Summary"
      >
        {/* Big Clear Button: New Bill / POS */}
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-700 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Bill / POS</span>
        </Link>
      </Header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* ======================================================== */}
        {/* 1. FOUR PRIMARY CLEAR METRIC CARDS                       */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Today's Sales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Today&apos;s Sales
              </p>
              <h3 className="text-xl font-black text-slate-900 mt-1 font-mono">
                {formatCurrency(kpis.todaySales || 0)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                Payments collected today
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 2: Pending Payment Balance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Balance
              </p>
              <h3 className="text-xl font-black text-rose-600 mt-1 font-mono">
                {formatCurrency(kpis.totalBalanceDue || 0)}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Due at customer pickup
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 3: Ready for Delivery */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ready for Delivery
              </p>
              <h3 className="text-xl font-black text-purple-700 mt-1">
                {kpis.readyForPickupCount || 0} Glasses
              </h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">
                Glazed & passed inspection
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Glasses className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 4: Total Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Orders
              </p>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {kpis.totalOrders || 0} Orders
              </h3>
              <p className="text-[11px] text-cyan-700 font-semibold mt-1">
                Lifetime customer orders
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. SALES SUMMARY BAR CHART                               */}
        {/* ======================================================== */}
        <DashboardCharts analytics={data?.analytics} />

        {/* ======================================================== */}
        {/* 3. NEAT SIMPLE TABLE: RECENT ORDERS                      */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Recent Store Orders
              </h3>
              <p className="text-[11px] text-slate-500">
                Latest customer spectacle jobs and counter balances
              </p>
            </div>

            <Link
              href="/orders"
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Simplified Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No active orders found. Click &ldquo;New Bill / POS&rdquo; to create your first bill.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      {/* Customer Name & Bill No */}
                      <td className="p-3.5">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="font-bold text-slate-900 hover:text-cyan-700 hover:underline text-xs flex items-center gap-1.5"
                        >
                          <span>{ord.customer?.name || "Walk-in Customer"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({ord.bill_no})
                          </span>
                        </Link>
                      </td>

                      {/* Phone */}
                      <td className="p-3.5 font-mono text-slate-700 text-xs">
                        {ord.customer?.phone || "—"}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === "READY_FOR_PICKUP"
                              ? "bg-purple-100 text-purple-800"
                              : ord.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "LENS_PROCESSING" || ord.status === "FITTING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ord.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Balance Due */}
                      <td className="p-3.5 text-right font-bold text-xs font-mono">
                        {ord.balance_amount > 0 ? (
                          <span className="text-rose-600">
                            {formatCurrency(ord.balance_amount)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">
                            Settled
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Print GST Invoice / Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/orders/${ord.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
