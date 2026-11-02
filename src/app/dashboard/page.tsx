"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Glasses,
  Wrench,
  Package,
  Users,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
  Phone,
  MessageCircle,
  Printer,
  ChevronRight,
  Filter,
  UserPlus,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Header } from "@/components/Header";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ReceiptModal } from "@/components/ReceiptModal";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Table filtering & Modals
  const [activeTableFilter, setActiveTableFilter] = useState<"ALL" | "READY" | "WORKSHOP" | "BALANCE">("ALL");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isNewRxOpen, setIsNewRxOpen] = useState(false);

  const urgentTableRef = useRef<HTMLDivElement>(null);

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
  const urgentOrders = data?.urgentOrders || [];

  // Filter urgent table
  const filteredUrgentOrders = urgentOrders.filter((order: any) => {
    if (activeTableFilter === "READY") return order.status === "READY_FOR_PICKUP";
    if (activeTableFilter === "WORKSHOP") return order.status === "FITTING" || order.status === "LENS_PROCESSING";
    if (activeTableFilter === "BALANCE") return order.balance_amount > 0;
    return true;
  });

  const scrollToUrgentTable = (filter: "ALL" | "READY" | "WORKSHOP" | "BALANCE") => {
    setActiveTableFilter(filter);
    urgentTableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Generate WhatsApp Direct Link
  const getWhatsAppLink = (order: any) => {
    const rawPhone = order.customer?.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, ""); // e.g. 919820123456
    const custName = order.customer?.name || "Valued Customer";
    const billNo = order.bill_no;
    const balance = formatCurrency(order.balance_amount);

    let message = "";
    if (order.status === "READY_FOR_PICKUP") {
      message = `Hello ${custName}, your eyewear order (${billNo}) is READY for pickup at VisionPulse Studio! Balance payable at counter: ${balance}. We look forward to fitting you. Store location: Galleria Arcade, Powai.`;
    } else if (order.status === "FITTING" || order.status === "LENS_PROCESSING") {
      message = `Hello ${custName}, your spectacle order (${billNo}) is currently progressing in our optical workshop. Estimated completion: ${formatDate(order.delivery_due_date)}. We will notify you once ready for pickup!`;
    } else {
      message = `Hello ${custName}, thank you for choosing VisionPulse. Regarding your order ${billNo}, please feel free to reach out to us if you need any assistance.`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Header with Quick Refresh */}
      <Header
        title="VisionPulse Main Dashboard"
        subtitle="Executive KPI Monitor, Visual Analytics & Urgent Order Action Center"
      >
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : ""}`} />
        </button>
      </Header>

      {/* Main Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* ========================================================= */}
        {/* SECTION 1: TOP KPI METRIC CARDS (6 Grid layout) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* 1. Today's Sales */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Today's Sales
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(kpis.todaySales || 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-[10px]">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-2.5 h-2.5" />
                +{kpis.salesChangePercent || 14.5}%
              </span>
              <span className="text-slate-400">vs yesterday</span>
            </div>
          </div>

          {/* 2. Total Net Profit */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Total Net Profit
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(kpis.totalNetProfit || 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>~48.5% Gross Margin</span>
            </div>
          </div>

          {/* 3. Pending Balances (Click-to-filter action) */}
          <button
            onClick={() => scrollToUrgentTable("BALANCE")}
            className="text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Pending Balances
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {formatCurrency(kpis.totalBalanceDue || 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
              <span>Click to view orders</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 4. Ready for Pickup */}
          <button
            onClick={() => scrollToUrgentTable("READY")}
            className="text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-cyan-400 dark:hover:border-cyan-500 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Ready for Pickup
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {kpis.readyForPickupCount || 0}
              </h3>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <p className="mt-2 text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold">
              Spectacles glazed & QC verified
            </p>
          </button>

          {/* 5. Low Stock Alert (Alert State Color) */}
          <Link
            href="/inventory"
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs hover:border-rose-400 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Low Stock Alert
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {kpis.lowStockCount || 0} Items
            </h3>
            <p className="mt-2 text-[10px] text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <span>Threshold breached</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </Link>

          {/* 6. Today's Delivery Due */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Delivery Due Today
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {kpis.dueTodayCount || 0} Orders
            </h3>
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Workshop dispatch priority
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: QUICK ACTION STICKY / FLOATING BAR */}
        {/* ========================================================= */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3.5 rounded-2xl shadow-lg border border-slate-700/50 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs tracking-wider uppercase">
                VisionPulse Fast Counter
              </h4>
              <p className="text-[10px] text-slate-400">
                1-Click shortcuts for optometry front-desk & glazier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Action Button */}
            <Link
              href="/pos"
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-md shadow-cyan-500/25 transition-all hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-slate-950" />
              <span>New Bill / POS</span>
            </Link>

            {/* Add Customer Button */}
            <button
              onClick={() => setIsNewCustomerOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Customer</span>
            </button>

            {/* New Prescription Button */}
            <button
              onClick={() => setIsNewRxOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Glasses className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Prescription</span>
            </button>

            {/* Order Tracker Button */}
            <button
              onClick={() => scrollToUrgentTable("ALL")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Order Tracker</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: VISUAL ANALYTICS (RECHARTS SECTION) */}
        {/* ========================================================= */}
        {data?.analytics && <DashboardCharts analytics={data.analytics} />}

        {/* ========================================================= */}
        {/* SECTION 4: URGENT ORDERS & READY GLASSES TABLE */}
        {/* ========================================================= */}
        <div
          ref={urgentTableRef}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4"
        >
          {/* Table Header & Interactive Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Urgent Orders & Ready Spectacles Action Center
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatch orders, follow-up on customer pickup & notify patients directly on WhatsApp
              </p>
            </div>

            {/* Table Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { key: "ALL", label: `All Active (${urgentOrders.length})` },
                { key: "READY", label: `Ready for Pickup (${kpis.readyForPickupCount || 0})` },
                { key: "WORKSHOP", label: "In Workshop (Fitting/Lab)" },
                { key: "BALANCE", label: "Balance Pending" },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setActiveTableFilter(pill.key as any)}
                  className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeTableFilter === pill.key
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgent Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Bill No</th>
                  <th className="p-3">Patient Name & Phone</th>
                  <th className="p-3">Eyewear Configuration</th>
                  <th className="p-3 text-center">Tracking Status</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Quick WhatsApp Action</th>
                  <th className="p-3 text-center">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUrgentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                      No urgent orders match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredUrgentOrders.map((ord: any) => {
                    const isReady = ord.status === "READY_FOR_PICKUP";
                    const isFitting = ord.status === "FITTING";
                    const isProcessing = ord.status === "LENS_PROCESSING";

                    return (
                      <tr
                        key={ord.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Bill No */}
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {ord.bill_no}
                        </td>

                        {/* Patient info */}
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {ord.customer?.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {ord.customer?.phone}
                          </p>
                        </td>

                        {/* Items ordered */}
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          <p className="font-semibold text-xs leading-snug line-clamp-1">
                            {ord.items?.map((i: any) => `${i.item?.brand} ${i.item?.model || i.item?.type}`).join(", ")}
                          </p>
                          {ord.prescription && (
                            <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                              Refraction Specs Attached
                            </span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isReady
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                : isFitting
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300"
                                : isProcessing
                                ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {ord.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                          <p className="font-semibold text-slate-900 dark:text-slate-200">
                            {formatDate(ord.delivery_due_date)}
                          </p>
                        </td>

                        {/* Balance Due */}
                        <td className="p-3 text-right">
                          {ord.balance_amount > 0 ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                              {formatCurrency(ord.balance_amount)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              Paid Full
                            </span>
                          )}
                        </td>

                        {/* WhatsApp Action Button */}
                        <td className="p-3 text-center">
                          <a
                            href={getWhatsAppLink(ord)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all hover:scale-105"
                            title="Send status message to patient on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>{isReady ? "Ready Alert" : "Send Update"}</span>
                          </a>
                        </td>

                        {/* Print Receipt */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Print GST Invoice / Job Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <PrescriptionModal
        isOpen={isNewRxOpen}
        onClose={() => setIsNewRxOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}
