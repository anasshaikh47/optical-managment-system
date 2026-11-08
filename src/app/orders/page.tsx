"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  Check,
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
  Sparkles,
  Receipt,
  User,
  Wrench,
  AlertTriangle,
  Send,
  ChevronDown,
  Plus,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ThermalJobSlipModal } from "@/components/ThermalJobSlipModal";
import { formatDate, formatCurrency, formatDiopter } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/hooks/useOrders";

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

export default function OrdersPage() {
  const { shopId, tenantFetch } = useAuth();
  const { orders, setOrders, loading, refetch: fetchOrders } = useOrders(shopId, tenantFetch);
  const [viewMode, setViewMode] = useState<"KANBAN" | "TABLE">("KANBAN");
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

  // Drag and Drop state
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);

  // WhatsApp active dropdown popup menu
  const [activeWaMenuId, setActiveWaMenuId] = useState<string | null>(null);

  // Status Change Logic with Balance Enforcement at Delivery
  const handleStageChange = async (orderId: string, targetStage: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Intercept if moving to DELIVERED and there is pending balance!
    if (targetStage === "DELIVERED" && order.balance_amount > 0) {
      setBalanceModalOrder(order);
      setPayAmount(order.balance_amount.toString());
      return;
    }

    // Optimistic UI update
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
        fetchOrders(); // Revert on failure
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

  // One-Click WhatsApp Action Handler
  const sendWhatsApp = (
    type: "CONFIRMATION" | "READY_FOR_PICKUP" | "PAYMENT_RECEIPT",
    order: any
  ) => {
    setActiveWaMenuId(null);
    if (!order.customer?.phone) return;
    let cleanPhone = order.customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const promisedDate = order.delivery_due_date
      ? new Date(order.delivery_due_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "2 Days";

    const itemsList = (order.items || [])
      .map(
        (it: any) =>
          `• ${it.item ? `${it.item.brand} - ${it.item.model || it.item.type}` : "Eyewear"} (x${it.quantity})`
      )
      .join("\n");

    let message = "";

    if (type === "CONFIRMATION") {
      message = `👓 *VISIONPULSE EYEWEAR STUDIO*
*Booking Confirmation & Order Details*

Namaste *${order.customer.name}*,
Thank you for your order with VisionPulse!

📋 *Bill / Job No*: #${order.bill_no}
📅 *Promised Ready Date*: ${promisedDate}

💰 *Payment Summary*:
• Total Net Bill: ₹${order.final_payable}
• Advance Received: ₹${order.paid_amount}
• Balance at Pickup: ₹${order.balance_amount}

🔍 *Eyewear Specs*:
${itemsList}

📍 *Store*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Helpline*: +91 98201 12345
We will notify you the moment your lenses are edged and ready!`;
    } else if (type === "READY_FOR_PICKUP") {
      message = `👓 *VISIONPULSE EYEWEAR STUDIO*
*Aapka Chashma Ready Hai!* 🎉

Namaste *${order.customer.name}*,
Good news! Your custom eyewear order *#${order.bill_no}* has passed our lab optical quality checks and is *READY FOR PICKUP*.

💵 *Balance Due*: ₹${order.balance_amount}
🕒 *Store Timings*: 10:00 AM - 10:00 PM (Open All 7 Days)
📍 *Address*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Store Tel*: +91 98201 12345

Please visit us for final frame alignment and collection. See you soon!`;
    } else if (type === "PAYMENT_RECEIPT") {
      message = `👓 *VISIONPULSE EYEWEAR STUDIO*
*Payment Receipt & Delivery Confirmation*

Namaste *${order.customer.name}*,
Thank you for collecting your spectacles today!

🧾 *Invoice No*: #${order.bill_no}
💰 *Total Amount*: ₹${order.final_payable}
✅ *Payment Status*: Fully Settled (₹0 Balance)
🛡️ *Warranty*: 1-Year Frame Warranty & 1-Year Coating Guarantee against peeling.

Thank you for choosing VisionPulse Eyewear Studio. For any adjustment or cleaning, feel free to visit us anytime!`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Due Today Counter
  const todayStr = new Date().toISOString().split("T")[0];
  const dueTodayCount = orders.filter((o) => {
    if (o.status === "DELIVERED" || o.status === "CANCELLED") return false;
    if (!o.delivery_due_date) return false;
    const dStr = new Date(o.delivery_due_date).toISOString().split("T")[0];
    return dStr <= todayStr;
  }).length;

  // Filtered Orders
  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      o.bill_no.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.customer?.phone && o.customer.phone.includes(q));

    const orderDueStr = o.delivery_due_date
      ? new Date(o.delivery_due_date).toISOString().split("T")[0]
      : "";
    const matchesDueToday =
      !dueTodayOnly ||
      (orderDueStr && orderDueStr <= todayStr && o.status !== "DELIVERED" && o.status !== "CANCELLED");

    return matchesStatus && matchesSearch && matchesDueToday;
  });

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
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 pb-24 md:pb-6 space-y-3.5">
        {/* Top Control Bar: Search, Filters & View Toggle */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Bill No (VP-), Patient Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due Today Quick Filter */}
            <button
              onClick={() => setDueTodayOnly(!dueTodayOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dueTodayOnly
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Due Today / Overdue</span>
              {dueTodayCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    dueTodayOnly ? "bg-white text-rose-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {dueTodayCount}
                </span>
              )}
            </button>

            {/* Status Dropdown Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">All Stages ({orders.length})</option>
              <option value="PLACED">Placed</option>
              <option value="LENS_PROCESSING">Lens Glazing / Lab</option>
              <option value="FITTING">Frame Fitting</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || statusFilter !== "ALL" || dueTodayOnly) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setDueTodayOnly(false);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline px-1"
              >
                Reset
              </button>
            )}

            {/* View Mode Toggle: Kanban vs Table */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("KANBAN")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "KANBAN"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "TABLE"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabular View</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: VISUAL ORDER PIPELINE (KANBAN BOARD)            */}
        {/* ======================================================== */}
        {viewMode === "KANBAN" ? (
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
                    onDragLeave={() => setDropTargetStage(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropTargetStage(null);
                      const orderId = e.dataTransfer.getData("orderId");
                      if (orderId) {
                        handleStageChange(orderId, stage.key);
                      }
                    }}
                    className={`flex-1 flex flex-col rounded-2xl border transition-all duration-150 min-w-[240px] max-w-[290px] ${
                      isDropTarget
                        ? "border-2 border-dashed border-cyan-500 bg-cyan-50/50 scale-[1.01]"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b border-slate-200 bg-white rounded-t-2xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                        <h4 className="font-bold text-slate-900 text-xs truncate">
                          {stage.label}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stage.badge}`}>
                        {stageOrders.length}
                      </span>
                    </div>

                    {/* Column Cards Container */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                      {stageOrders.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/50">
                          <p className="text-[11px]">No orders in this stage</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Drag & drop cards here</p>
                        </div>
                      ) : (
                        stageOrders.map((ord) => {
                          const orderDueStr = ord.delivery_due_date
                            ? new Date(ord.delivery_due_date).toISOString().split("T")[0]
                            : null;
                          const isDueToday = orderDueStr === todayStr;
                          const isOverdue =
                            orderDueStr && orderDueStr < todayStr && ord.status !== "DELIVERED";
                          const nextAction = NEXT_STAGE_MAP[ord.status];

                          return (
                            <div
                              key={ord.id}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData("orderId", ord.id);
                                setDraggedOrderId(ord.id);
                              }}
                              onDragEnd={() => {
                                setDraggedOrderId(null);
                                setDropTargetStage(null);
                              }}
                              className={`p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-cyan-400 transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                                draggedOrderId === ord.id ? "opacity-50 scale-95" : ""
                              }`}
                            >
                              {/* Card Header: Bill No & Link to Details */}
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/orders/${ord.id}`}
                                  className="font-black text-xs font-mono text-cyan-800 hover:text-cyan-950 hover:underline flex items-center gap-1"
                                >
                                  <span>{ord.bill_no}</span>
                                  <ArrowRight className="w-3 h-3 opacity-60" />
                                </Link>

                                {/* Promised Delivery Date Badge */}
                                {ord.delivery_due_date && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                                      isOverdue
                                        ? "bg-rose-100 text-rose-800 font-black animate-pulse"
                                        : isDueToday
                                        ? "bg-amber-100 text-amber-800 font-black"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {isOverdue ? "Overdue" : isDueToday ? "Due Today" : formatDate(ord.delivery_due_date)}
                                  </span>
                                )}
                              </div>

                              {/* Customer Details */}
                              <div>
                                <p className="font-bold text-slate-900 text-xs leading-tight">
                                  {ord.customer?.name || "Walk-in Guest"}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{ord.customer?.phone}</span>
                                </p>
                              </div>

                              {/* Eyewear Items Summary */}
                              <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                                <p className="truncate font-semibold text-slate-800">
                                  {ord.items
                                    ?.map(
                                      (i: any) =>
                                        `${i.item?.brand} - ${i.item?.model || i.item?.type}`
                                    )
                                    .join(", ") || "Eyewear Specs"}
                                </p>
                                {ord.prescription && (
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-700">
                                    <Glasses className="w-3 h-3" />
                                    <span>
                                      Rx: OD SPH {formatDiopter(ord.prescription.od_sph)} | OS SPH {formatDiopter(ord.prescription.os_sph)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Financial Summary */}
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                                <div>
                                  <span className="text-slate-400 text-[9px] block">Net Total</span>
                                  <span className="font-bold text-slate-900">
                                    {formatCurrency(ord.final_payable)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400 text-[9px] block">Balance</span>
                                  {ord.balance_amount > 0 ? (
                                    <span className="font-extrabold text-rose-600">
                                      Due {formatCurrency(ord.balance_amount)}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-emerald-600 text-[10px]">
                                      Paid Full
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Card Action Toolbar */}
                              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                                <div className="flex items-center gap-1">
                                  {/* Thermal Slip Button */}
                                  <button
                                    onClick={() => setThermalSlipOrder(ord)}
                                    className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-slate-100"
                                    title="Workshop Thermal Slip (80mm)"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Print Invoice Button */}
                                  <button
                                    onClick={() => setSelectedReceiptOrder(ord)}
                                    className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-slate-100"
                                    title="GST Tax Invoice"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>

                                  {/* One-Click WhatsApp Dropdown Menu */}
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setActiveWaMenuId(
                                          activeWaMenuId === ord.id ? null : ord.id
                                        )
                                      }
                                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                                      title="WhatsApp Patient Updates"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>

                                    {activeWaMenuId === ord.id && (
                                      <div className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-30 text-[10px] space-y-0.5 animate-in fade-in">
                                        <button
                                          onClick={() => sendWhatsApp("CONFIRMATION", ord)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold"
                                        >
                                          1. Booking Confirmation
                                        </button>
                                        <button
                                          onClick={() => sendWhatsApp("READY_FOR_PICKUP", ord)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-purple-700 font-semibold"
                                        >
                                          2. Aapka Chashma Ready Hai!
                                        </button>
                                        <button
                                          onClick={() => sendWhatsApp("PAYMENT_RECEIPT", ord)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 font-semibold"
                                        >
                                          3. Final Payment Receipt
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Next Stage Single-Click Action Button */}
                                {nextAction ? (
                                  <button
                                    onClick={() => handleStageChange(ord.id, nextAction.key)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                      nextAction.key === "DELIVERED"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                        : "bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200"
                                    }`}
                                  >
                                    {nextAction.label}
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Completed
                                  </span>
                                )}
                              </div>
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
        ) : (
          /* ======================================================== */
          /* VIEW 2: DETAILED ORDERS TABLE VIEW                      */
          /* ======================================================== */
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto w-full">
              <table className="w-full min-w-[850px] text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5">Bill / Order #</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Items & Prescription</th>
                    <th className="p-3.5">Promised Delivery</th>
                    <th className="p-3.5 text-right">Net Payable</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Balance Due</th>
                    <th className="p-3.5 text-center">Tracking Status</th>
                    <th className="p-3.5 text-center">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
                          <Glasses className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {orders.length === 0
                              ? "Orders: 0"
                              : "No orders match the selected filters"}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {orders.length === 0
                              ? "No optical orders or spectacle jobs recorded yet. Open the POS Terminal to register counter sales and track lens glazing."
                              : "Try adjusting the status filter tabs or clear the search criteria."}
                          </p>
                          {orders.length === 0 && (
                            <Link
                              href="/pos"
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Create First Bill / Sale</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((ord) => {
                      const orderDueStr = ord.delivery_due_date
                        ? new Date(ord.delivery_due_date).toISOString().split("T")[0]
                        : null;
                      const isDueToday = orderDueStr === todayStr;
                      const isOverdue =
                        orderDueStr && orderDueStr < todayStr && ord.status !== "DELIVERED";

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold font-mono text-cyan-800 text-xs">
                            <Link href={`/orders/${ord.id}`} className="hover:underline">
                              {ord.bill_no}
                            </Link>
                          </td>

                          <td className="p-3.5">
                            <p className="font-semibold text-slate-800">
                              {ord.customer?.name || "Walk-in Guest"}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {ord.customer?.phone}
                            </p>
                          </td>

                          <td className="p-3.5 text-slate-600">
                            <p className="text-xs truncate max-w-xs font-medium text-slate-800">
                              {ord.items
                                ?.map(
                                  (i: any) =>
                                    `${i.quantity}x ${i.item?.brand} ${i.item?.model || i.item?.type}`
                                )
                                .join(", ")}
                            </p>
                            {ord.prescription && (
                              <span className="text-[9px] text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded font-bold mt-0.5 inline-block">
                                Rx Attached (OD SPH {formatDiopter(ord.prescription.od_sph)})
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                isOverdue
                                  ? "bg-rose-100 text-rose-800 font-black animate-pulse"
                                  : isDueToday
                                  ? "bg-amber-100 text-amber-800 font-black"
                                  : "text-slate-600 bg-slate-100"
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {ord.delivery_due_date ? formatDate(ord.delivery_due_date) : "—"}
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-bold text-slate-900">
                            {formatCurrency(ord.final_payable)}
                          </td>

                          <td className="p-3.5 text-right font-semibold text-emerald-600">
                            {formatCurrency(ord.paid_amount)}
                          </td>

                          <td className="p-3.5 text-right font-bold">
                            {ord.balance_amount > 0 ? (
                              <span className="text-rose-600">
                                {formatCurrency(ord.balance_amount)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold">Paid Full</span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <select
                              value={ord.status}
                              onChange={(e) => handleStageChange(ord.id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-300 focus:outline-none"
                            >
                              <option value="PLACED">Placed</option>
                              <option value="LENS_PROCESSING">Lens Glazing</option>
                              <option value="FITTING">Fitting</option>
                              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Thermal Slip */}
                              <button
                                onClick={() => setThermalSlipOrder(ord)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-slate-100"
                                title="Print 80mm Workshop Thermal Slip"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>

                              {/* Invoice Slip */}
                              <button
                                onClick={() => setSelectedReceiptOrder(ord)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-slate-100"
                                title="Print GST Tax Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Ready WhatsApp button */}
                              <button
                                onClick={() => sendWhatsApp("READY_FOR_PICKUP", ord)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                title="Send 'Aapka Chashma Ready Hai' WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Balance Settlement Button */}
                              {ord.balance_amount > 0 && (
                                <button
                                  onClick={() => {
                                    setBalanceModalOrder(ord);
                                    setPayAmount(ord.balance_amount.toString());
                                  }}
                                  className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-colors"
                                >
                                  Collect ₹{ord.balance_amount}
                                </button>
                              )}

                              {/* View Details Link */}
                              <Link
                                href={`/orders/${ord.id}`}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-slate-100"
                                title="Open Full Details Card"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BALANCE SETTLEMENT AT DELIVERY MODAL                    */}
      {/* ======================================================== */}
      {balanceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Balance Settlement at Delivery
                </h3>
              </div>
              <button
                onClick={() => setBalanceModalOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Collecting final balance for Order <strong>#{balanceModalOrder.bill_no}</strong> (Patient:{" "}
              <strong>{balanceModalOrder.customer?.name}</strong>).
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Net Order Total:</span>
                <span className="font-semibold">{formatCurrency(balanceModalOrder.final_payable)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Advance Paid Previously:</span>
                <span className="font-semibold">{formatCurrency(balanceModalOrder.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-black text-sm pt-1 border-t border-slate-200">
                <span>Pending Balance Due:</span>
                <span>{formatCurrency(balanceModalOrder.balance_amount)}</span>
              </div>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={balanceModalOrder.balance_amount}
                  required
                  value={payAmount}
                  onFocus={(e) => { if (payAmount === "0") setPayAmount(""); else e.target.select(); }} onBlur={() => { if (payAmount === "" || isNaN(Number(payAmount))) setPayAmount(balanceModalOrder.balance_amount.toString()); }} onChange={(e) => setPayAmount(e.target.value.replace(/^0+(?=\d)/, ""))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-black text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["UPI", "CASH", "CARD"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-1.5 rounded-lg font-bold text-xs border transition-all ${
                        payMethod === m
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod !== "CASH" && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Transaction / Auth Reference
                  </label>
                  <input
                    type="text"
                    placeholder="UPI Ref ID / Card Txn Code"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalOrder(null)}
                  className="px-3 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-2 rounded-lg text-white font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {paySubmitting
                      ? "Recording..."
                      : `Settle ₹${payAmount} & Mark Delivered`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable GST Tax Invoice Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* Thermal Workshop Lab Ticket Slip Modal */}
      {thermalSlipOrder && (
        <ThermalJobSlipModal
          order={thermalSlipOrder}
          onClose={() => setThermalSlipOrder(null)}
        />
      )}
    </div>
  );
}
