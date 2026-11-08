"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Printer,
  CheckCircle2,
  Eye,
  Filter,
  CreditCard,
  X,
  Kanban,
  Table as TableIcon,
  MessageSquare,
  Clock,
  ArrowRight,
  Glasses,
  Phone,
  Calendar,
  Receipt,
  User,
  Wrench,
  AlertTriangle,
  ChevronDown,
  Plus,
  FileText,
  Zap,
  ExternalLink,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ThermalJobSlipModal } from "@/components/ThermalJobSlipModal";
import { formatDate, formatDateTime, formatCurrency, formatDiopter } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { getOrderNetPayable } from "@/lib/salesBreakdown";
import { prefetchCustomerProfile } from "@/hooks/useCustomerProfile";

export type LedgerPeriod = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL_TIME";

const STAGES = [
  { key: "PLACED", label: "New Order Placed", color: "border-blue-400 bg-blue-50 text-blue-900", badge: "bg-blue-100 text-blue-800" },
  { key: "LENS_PROCESSING", label: "Lens Lab Glazing", color: "border-cyan-400 bg-cyan-50 text-cyan-900", badge: "bg-cyan-100 text-cyan-800" },
  { key: "FITTING", label: "Frame Fitting & Mount", color: "border-amber-400 bg-amber-50 text-amber-900", badge: "bg-amber-100 text-amber-800" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup", color: "border-purple-400 bg-purple-50 text-purple-900", badge: "bg-purple-100 text-purple-800" },
  { key: "DELIVERED", label: "Delivered & Settled", color: "border-emerald-400 bg-emerald-50 text-emerald-900", badge: "bg-emerald-100 text-emerald-800" },
];

const NEXT_STAGE_MAP: Record<string, { key: string; label: string }> = {
  PLACED: { key: "LENS_PROCESSING", label: "Start Lab Glazing" },
  LENS_PROCESSING: { key: "FITTING", label: "Move to Fitting" },
  FITTING: { key: "READY_FOR_PICKUP", label: "Mark QA Ready" },
  READY_FOR_PICKUP: { key: "DELIVERED", label: "Deliver to Patient" },
};

function formatInvoiceTimestamp(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, ${timeStr}`;
}

function isDateInPeriod(dateStr: string | null | undefined, period: LedgerPeriod): boolean {
  if (!dateStr) return false;
  if (period === "ALL_TIME") return true;

  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === "TODAY") {
    return d >= startOfToday && d <= endOfToday;
  }
  if (period === "YESTERDAY") {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return d >= startOfYesterday && d <= endOfYesterday;
  }
  if (period === "THIS_WEEK") {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
    return d >= startOfWeek && d <= endOfToday;
  }
  if (period === "THIS_MONTH") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return d >= startOfMonth && d <= endOfToday;
  }
  return true;
}

export default function OrdersPage() {
  const { shopId, tenantFetch } = useAuth();
  const { orders, setOrders, loading, refetch: fetchOrders } = useOrders(shopId, tenantFetch);

  // View state: LEDGER (Default comprehensive cards) vs KANBAN (Lab Pipeline)
  const [viewMode, setViewMode] = useState<"LEDGER" | "KANBAN">("LEDGER");
  const [activePeriod, setActivePeriod] = useState<LedgerPeriod>("TODAY");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dueTodayOnly, setDueTodayOnly] = useState(false);

  // Modals & Slips
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [thermalSlipOrder, setThermalSlipOrder] = useState<any | null>(null);

  // Balance Payment Settlement Modal
  const [balanceModalOrder, setBalanceModalOrder] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);

  // Drag and Drop state (for Kanban view)
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);

  // Multi-Period Summary Metrics (Computed in <5ms via useMemo)
  const periodStats = useMemo(() => {
    const periods: LedgerPeriod[] = ["TODAY", "YESTERDAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME"];
    const stats: Record<LedgerPeriod, { count: number; totalRevenue: number; paidCollected: number }> = {
      TODAY: { count: 0, totalRevenue: 0, paidCollected: 0 },
      YESTERDAY: { count: 0, totalRevenue: 0, paidCollected: 0 },
      THIS_WEEK: { count: 0, totalRevenue: 0, paidCollected: 0 },
      THIS_MONTH: { count: 0, totalRevenue: 0, paidCollected: 0 },
      ALL_TIME: { count: 0, totalRevenue: 0, paidCollected: 0 },
    };

    orders.forEach((o) => {
      if (o.status === "CANCELLED") return;
      const net = getOrderNetPayable(o);
      const paid = parseFloat(o.paid_amount ?? o.paidAmount) || 0;

      periods.forEach((p) => {
        if (isDateInPeriod(o.createdAt, p)) {
          stats[p].count += 1;
          stats[p].totalRevenue += net;
          stats[p].paidCollected += paid;
        }
      });
    });

    return stats;
  }, [orders]);

  // Due Today Counter
  const todayStr = new Date().toISOString().split("T")[0];
  const dueTodayCount = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === "DELIVERED" || o.status === "CANCELLED") return false;
      if (!o.delivery_due_date) return false;
      const dStr = new Date(o.delivery_due_date).toISOString().split("T")[0];
      return dStr <= todayStr;
    }).length;
  }, [orders, todayStr]);

  // Filtered Orders for active Period & Search
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return orders.filter((o) => {
      // Period filter (applies primarily to Ledger mode)
      if (viewMode === "LEDGER" && !isDateInPeriod(o.createdAt, activePeriod)) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && o.status !== statusFilter) {
        return false;
      }

      // Due Today filter
      if (dueTodayOnly) {
        const orderDueStr = o.delivery_due_date
          ? new Date(o.delivery_due_date).toISOString().split("T")[0]
          : "";
        if (!orderDueStr || orderDueStr > todayStr || o.status === "DELIVERED" || o.status === "CANCELLED") {
          return false;
        }
      }

      // Search match (Bill number, patient name, patient phone)
      if (q !== "") {
        const billMatch = (o.bill_no || "").toLowerCase().includes(q);
        const nameMatch = (o.customer?.name || o.customerName || "").toLowerCase().includes(q);
        const phoneMatch = (o.customer?.phone || o.customerPhone || "").includes(q);
        if (!billMatch && !nameMatch && !phoneMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, viewMode, activePeriod, statusFilter, dueTodayOnly, searchQuery, todayStr]);

  // Status Change Logic with Balance Enforcement at Delivery
  const handleStageChange = async (orderId: string, targetStage: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (targetStage === "DELIVERED" && (order.balance_amount || 0) > 0) {
      setBalanceModalOrder(order);
      setPayAmount((order.balance_amount || 0).toString());
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: targetStage } : o))
    );

    try {
      const res = await tenantFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStage }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
      fetchOrders();
    }
  };

  // Collect Balance & Complete Delivery
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalOrder) return;

    setPaySubmitting(true);
    try {
      const res = await tenantFetch(`/api/orders/${balanceModalOrder.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          method: payMethod,
          transaction_ref: transactionRef,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccessNotice(
          `Payment of ${formatCurrency(parseFloat(payAmount))} received! Order #${balanceModalOrder.bill_no} marked as DELIVERED.`
        );
        setTimeout(() => setPaymentSuccessNotice(null), 5000);
        setBalanceModalOrder(null);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaySubmitting(false);
    }
  };

  // WhatsApp Share Invoice Action
  const handleWhatsAppShare = (order: any) => {
    const customer = order.customer || {
      name: order.customerName,
      phone: order.customerPhone,
    };
    if (!customer?.phone) {
      alert("Customer mobile number not recorded for this bill.");
      return;
    }
    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const net = getOrderNetPayable(order);
    const paid = parseFloat(order.paid_amount ?? order.paidAmount) || 0;
    const balance = parseFloat(order.balance_amount ?? order.pendingAmount) || 0;

    const itemsSummary = getItemsSummary(order);

    const message = `👓 *VISIONPULSE EYEWEAR STUDIO*
*GST Tax Invoice & Order Receipt*

Namaste *${customer.name || "Customer"}*,
Thank you for your visit to VisionPulse Eyewear Studio!

📋 *Bill No*: #${order.bill_no}
📅 *Date*: ${formatDate(order.createdAt)}
💰 *Net Payable*: ${formatCurrency(net)}
💵 *Amount Paid*: ${formatCurrency(paid)}
${balance > 0 ? `⚠️ *Balance at Collection*: ${formatCurrency(balance)}` : `✅ *Payment Status*: Paid in Full`}

🛍️ *Purchased Items*:
${itemsSummary}

📍 *Store*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Helpdesk*: +91 98201 12345
We look forward to serving you again!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const getItemsSummary = (order: any) => {
    const items =
      order.items && order.items.length > 0
        ? order.items
        : Array.isArray(order.itemsJson)
        ? order.itemsJson
        : [];

    if (items.length === 0) return "Eyewear Products (1 item)";

    const summaryParts = items.map((oi: any) => {
      const qty = oi.quantity || 1;
      const brand = oi.item?.brand || oi.brand || "";
      const model = oi.item?.model || oi.model || "";
      const type = oi.item?.type || oi.type || "";
      const name = `${brand} ${model || type}`.trim() || "Item";
      return `${qty}x ${name}`;
    });

    return summaryParts.join(", ");
  };

  const getPaymentBadge = (order: any) => {
    const balance = parseFloat(order.balance_amount ?? order.pendingAmount) || 0;
    const paid = parseFloat(order.paid_amount ?? order.paidAmount) || 0;

    if (balance <= 0) {
      return {
        label: "Paid Full",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (paid > 0) {
      return {
        label: `Partial (Due ${formatCurrency(balance)})`,
        classes: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    return {
      label: `Unpaid (${formatCurrency(balance)})`,
      classes: "bg-rose-50 text-rose-700 border-rose-200",
    };
  };

  const PERIOD_CONFIG: Array<{ key: LedgerPeriod; label: string; icon: any }> = [
    { key: "TODAY", label: "Today", icon: Clock },
    { key: "YESTERDAY", label: "Yesterday", icon: Calendar },
    { key: "THIS_WEEK", label: "This Week", icon: Calendar },
    { key: "THIS_MONTH", label: "This Month", icon: Calendar },
    { key: "ALL_TIME", label: "All Time", icon: FileText },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      {/* Success Notification Banner */}
      {paymentSuccessNotice && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{paymentSuccessNotice}</span>
          </div>
          <button
            onClick={() => setPaymentSuccessNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 md:p-6 pb-24 md:pb-6 space-y-3.5">
        {/* ======================================================== */}
        {/* HEADER SECTION: Title, Subtitle, Search & View Toggle    */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-100">
                <FileText className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                  Sales & Invoice Records
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Live transaction ledger across all customers
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Bill No (VP-), Name, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Ledger Cards vs Kanban Pipeline */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("LEDGER")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "LEDGER"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ledger Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("KANBAN")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "KANBAN"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Lab Pipeline</span>
              </button>
            </div>

            {/* Create POS Bill Action */}
            <Link
              href="/pos"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white shadow-xs transition-colors whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ Create POS Bill</span>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TOP PERIOD FILTER BOXES (Interactive Pills / Cards)      */}
        {/* ======================================================== */}
        {viewMode === "LEDGER" && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [WebkitOverflowScrolling:touch] no-scrollbar">
            {PERIOD_CONFIG.map(({ key, label, icon: Icon }) => {
              const stat = periodStats[key];
              const isActive = activePeriod === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePeriod(key)}
                  className={`shrink-0 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border transition-all text-left cursor-pointer min-w-[160px] sm:min-w-[175px] ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-cyan-500/25"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/90 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? "bg-white/15 text-cyan-300" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block leading-tight ${isActive ? "text-slate-100" : "text-slate-900"}`}>
                        {label}
                      </span>
                      <span className={`text-[10px] font-medium block mt-0.5 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                        {stat.count} {stat.count === 1 ? "Bill" : "Bills"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right pl-2 border-l border-slate-200/40">
                    <span className={`text-xs font-black font-mono block ${isActive ? "text-cyan-300" : "text-slate-900"}`}>
                      {formatCurrency(stat.totalRevenue)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Filter Bar: Status & Overdue toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Filter Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stages ({orders.length})</option>
              <option value="PLACED">Placed</option>
              <option value="LENS_PROCESSING">Lens Glazing / Lab</option>
              <option value="FITTING">Frame Fitting</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={() => setDueTodayOnly(!dueTodayOnly)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                dueTodayOnly
                  ? "bg-rose-50 border-rose-300 text-rose-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Due Today</span>
              {dueTodayCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                  {dueTodayCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-500">
            Showing <strong className="text-slate-900">{filtered.length}</strong> matching records
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: MASTER INVOICE LEDGER CARDS                      */}
        {/* ======================================================== */}
        {viewMode === "LEDGER" ? (
          <div className="flex-1 overflow-y-auto space-y-3 pb-24 md:pb-6">
            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
                <span className="animate-pulse font-medium">Loading sales & invoice records...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Receipt className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    No Invoice Records Found
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                    {searchQuery
                      ? "No bills matched your search query. Try clearing the search input."
                      : `No invoices recorded for the selected period (${activePeriod.replace("_", " ")}). Ring up your counter sales on POS Terminal.`}
                  </p>
                </div>
                <Link
                  href="/pos"
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Bill / POS</span>
                </Link>
              </div>
            ) : (
              filtered.map((ord: any) => {
                const netPayable = getOrderNetPayable(ord);
                const paid = parseFloat(ord.paid_amount ?? ord.paidAmount) || 0;
                const balance = parseFloat(ord.balance_amount ?? ord.pendingAmount) || 0;
                const paymentBadge = getPaymentBadge(ord);
                const customer = ord.customer || {
                  name: ord.customerName || "Customer",
                  phone: ord.customerPhone || "No Phone",
                };
                const customerId = ord.customerId || customer.id;
                const itemsSummary = getItemsSummary(ord);
                const stageObj = STAGES.find((s) => s.key === ord.status) || {
                  label: ord.status,
                  badge: "bg-slate-100 text-slate-700",
                };

                return (
                  <div
                    key={ord.id}
                    className="py-2.5 px-3 mb-2 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-1.5"
                  >
                    {/* Line 1: Bill No (#VP-2026-...) • Customer Name • Date/Time (Left) & Total Amount (Right bold) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                        <span className="font-mono font-bold text-xs text-cyan-800 shrink-0">
                          #{ord.bill_no}
                        </span>
                        <span className="text-slate-300 text-xs shrink-0">•</span>
                        {customerId ? (
                          <Link
                            href={`/customers/${customerId}`}
                            prefetch={true}
                            onMouseEnter={() => prefetchCustomerProfile(customerId, tenantFetch, customer)}
                            onTouchStart={() => prefetchCustomerProfile(customerId, tenantFetch, customer)}
                            className="font-bold text-xs text-slate-900 hover:text-cyan-700 truncate transition-colors"
                          >
                            {customer.name}
                          </Link>
                        ) : (
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {customer.name}
                          </span>
                        )}
                        <span className="text-slate-300 text-xs shrink-0">•</span>
                        <span className="text-[11px] text-slate-500 shrink-0 font-medium font-sans">
                          {formatInvoiceTimestamp(ord.createdAt)}
                        </span>
                      </div>

                      {/* Right side: Bold Net Amount */}
                      <div className="text-right shrink-0">
                        <span className="font-black font-mono text-sm text-slate-900">
                          {formatCurrency(netPayable)}
                        </span>
                      </div>
                    </div>

                    {/* Line 2: Items summary (compact line-clamp-1) & Payment Badge + Icon Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                        <span className="text-[11px] text-slate-500 truncate line-clamp-1 font-medium">
                          {itemsSummary}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Payment Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${paymentBadge.classes}`}
                        >
                          {paymentBadge.label}
                        </span>

                        {/* WhatsApp Quick Share Icon Button */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(ord)}
                          className="p-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          title="Share Invoice via WhatsApp"
                          aria-label="Share Invoice via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* View / Reprint Invoice Icon Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReceiptOrder({
                              ...ord,
                              customer,
                            })
                          }
                          className="p-1 rounded-lg text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
                          title="View / Reprint Invoice"
                          aria-label="View / Reprint Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Collect Balance Action Button if Due */}
                        {balance > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setBalanceModalOrder(ord);
                              setPayAmount(balance.toString());
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Collect Balance"
                          >
                            Collect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: KANBAN LAB PIPELINE VIEW                         */
          /* ======================================================== */
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
            <div className="flex gap-3.5 h-full min-w-[1240px]">
              {STAGES.map((stage) => {
                const stageOrders = filtered.filter((o) => o.status === stage.key);
                const isDropTarget = dropTargetStage === stage.key;

                return (
                  <div
                    key={stage.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTargetStage(stage.key);
                    }}
                    onDragLeave={() => {
                      if (dropTargetStage === stage.key) setDropTargetStage(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropTargetStage(null);
                      if (draggedOrderId) {
                        handleStageChange(draggedOrderId, stage.key);
                        setDraggedOrderId(null);
                      }
                    }}
                    className={`flex-1 flex flex-col rounded-2xl border transition-all h-full overflow-hidden ${
                      isDropTarget
                        ? "border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-400/30"
                        : "bg-slate-50/70 border-slate-200"
                    }`}
                  >
                    {/* Stage Header */}
                    <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            stage.key === "DELIVERED"
                              ? "bg-emerald-500"
                              : stage.key === "READY_FOR_PICKUP"
                              ? "bg-purple-500"
                              : stage.key === "FITTING"
                              ? "bg-amber-500"
                              : stage.key === "LENS_PROCESSING"
                              ? "bg-cyan-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                          {stage.label}
                        </h4>
                      </div>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {stageOrders.length}
                      </span>
                    </div>

                    {/* Stage Cards Container */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                      {stageOrders.length === 0 ? (
                        <div className="h-28 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
                          No orders in this stage
                        </div>
                      ) : (
                        stageOrders.map((ord: any) => {
                          const net = getOrderNetPayable(ord);
                          const customer = ord.customer || {
                            name: ord.customerName || "Customer",
                            phone: ord.customerPhone || "No Phone",
                          };
                          const nextAction = NEXT_STAGE_MAP[ord.status];

                          return (
                            <div
                              key={ord.id}
                              draggable
                              onDragStart={() => setDraggedOrderId(ord.id)}
                              onDragEnd={() => {
                                setDraggedOrderId(null);
                                setDropTargetStage(null);
                              }}
                              className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-cyan-800">
                                  #{ord.bill_no}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {formatDate(ord.createdAt)}
                                </span>
                              </div>

                              <div>
                                <h5 className="font-bold text-xs text-slate-900 truncate">
                                  {customer.name}
                                </h5>
                                <p className="font-mono text-[11px] text-slate-500">
                                  {customer.phone}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 font-mono">
                                <span className="font-black text-slate-900">
                                  {formatCurrency(net)}
                                </span>
                                {ord.balance_amount > 0 ? (
                                  <span className="text-[10px] text-rose-600 font-bold">
                                    Due: {formatCurrency(ord.balance_amount)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-bold">
                                    Paid
                                  </span>
                                )}
                              </div>

                              {nextAction && (
                                <button
                                  type="button"
                                  onClick={() => handleStageChange(ord.id, nextAction.key)}
                                  className="w-full mt-1 py-1 rounded-lg text-[11px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                >
                                  <span>{nextAction.label}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: REPRINT / VIEW INVOICE (Isolated Print Modal)   */}
      {/* ======================================================== */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 2: 80MM THERMAL JOB SLIP                           */}
      {/* ======================================================== */}
      {thermalSlipOrder && (
        <ThermalJobSlipModal
          order={thermalSlipOrder}
          onClose={() => setThermalSlipOrder(null)}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 3: BALANCE PAYMENT COLLECTION & SETTLEMENT         */}
      {/* ======================================================== */}
      {balanceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-700" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Collect Outstanding Balance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBalanceModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bill Number:</span>
                <span className="font-mono font-bold text-slate-900">#{balanceModalOrder.bill_no}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">
                  {balanceModalOrder.customer?.name || balanceModalOrder.customerName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Pending Due:</span>
                <span className="font-mono font-black text-rose-600">
                  {formatCurrency(balanceModalOrder.balance_amount || 0)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Amount to Collect (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash Counter</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Transaction / UTR Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cheque No."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {paySubmitting ? "Recording Payment..." : "Record Payment & Deliver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
