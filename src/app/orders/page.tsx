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
  Pill,
  Phone,
  Calendar,
  Sparkles,
  Receipt,
  User,
  Stethoscope,
  AlertTriangle,
  Send,
  ChevronDown,
  Plus,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ThermalJobSlipModal } from "@/components/ThermalJobSlipModal";
import { formatDate, formatCurrency, getExpiryStatus } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const STAGES = [
  { key: "PLACED", label: "New Prescription Order", color: "border-blue-400 bg-blue-50 text-blue-900", badge: "bg-blue-100 text-blue-800" },
  { key: "PROCESSING", label: "Rx Verification & Packing", color: "border-cyan-400 bg-cyan-50 text-cyan-900", badge: "bg-cyan-100 text-cyan-800" },
  { key: "READY_FOR_PICKUP", label: "Ready at Counter", color: "border-purple-400 bg-purple-50 text-purple-900", badge: "bg-purple-100 text-purple-800" },
  { key: "DELIVERED", label: "Dispensed & Settled", color: "border-emerald-400 bg-emerald-50 text-emerald-900", badge: "bg-emerald-100 text-emerald-800" },
];

const NEXT_STAGE_MAP: Record<string, { key: string; label: string }> = {
  PLACED: { key: "PROCESSING", label: "Start Verification" },
  PROCESSING: { key: "READY_FOR_PICKUP", label: "Mark Ready at Counter" },
  LENS_PROCESSING: { key: "READY_FOR_PICKUP", label: "Mark Ready at Counter" },
  FITTING: { key: "READY_FOR_PICKUP", label: "Mark Ready at Counter" },
  READY_FOR_PICKUP: { key: "DELIVERED", label: "Dispense to Patient" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const { shopId, tenantFetch } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [shopId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch("/api/orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Status Change Logic with Balance Enforcement at Delivery
  const handleStageChange = async (orderId: string, targetStage: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Intercept if moving to DELIVERED and there is pending balance
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
          `Payment of ${formatCurrency(parseFloat(payAmount))} received! Bill #${balanceModalOrder.bill_no} marked as DISPENSED.`
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

    const itemsList = (order.items || [])
      .map(
        (it: any) => {
          const med = it.medicine || it.item || {};
          return `• ${med.name || med.brand || "Medicine"} (x${it.quantity} ${it.unitType === "LOOSE_TABLET" ? "tabs" : "units"})`;
        }
      )
      .join("\n");

    let message = "";

    if (type === "CONFIRMATION") {
      message = `💊 *PHARMAPULSE MEDICAL & POS*
*Medicine Bill Confirmation & Dispensing Slip*

Namaste *${order.customer.name}*,
Thank you for your order with PharmaPulse Medical Store!

📋 *Bill / Token No*: #${order.bill_no}
📅 *Date*: ${formatDate(order.createdAt)}

💰 *Payment Summary*:
• Total Bill: ₹${order.final_payable}
• Advance Received: ₹${order.paid_amount}
• Balance at Counter: ₹${order.balance_amount}

🔍 *Prescribed Medicines*:
${itemsList}

📍 *Store*: Main Hospital Road, Powai, Mumbai - 400076
📞 *Helpline*: +91 98201 12345
Your medicines are being prepared and verified by our pharmacist!`;
    } else if (type === "READY_FOR_PICKUP") {
      message = `💊 *PHARMAPULSE MEDICAL & POS*
*Aapki Dawai Ready Hai!* 🎉

Namaste *${order.customer.name}*,
Your prescription order *#${order.bill_no}* has been verified, packed, and is *READY FOR COUNTER PICKUP*.

💵 *Balance Due*: ₹${order.balance_amount}
🕒 *Store Timings*: 8:00 AM - 11:00 PM (Emergency Desk 24/7)
📍 *Address*: Main Hospital Road, Powai, Mumbai - 400076
📞 *Store Tel*: +91 98201 12345

Please visit our counter to collect your medicines. Thank you!`;
    } else if (type === "PAYMENT_RECEIPT") {
      message = `💊 *PHARMAPULSE MEDICAL & POS*
*Pharmacy Tax Invoice & Payment Receipt*

Namaste *${order.customer.name}*,
Thank you for collecting your medicines today!

🧾 *Invoice No*: #${order.bill_no}
💰 *Total Amount*: ₹${order.final_payable}
✅ *Payment Status*: Fully Settled (₹0 Balance)
🏥 *DL No*: DL-20B/21B-458920

Take medicines as advised by your doctor. Wish you a speedy recovery!`;
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
    const matchesStatus =
      statusFilter === "ALL" ||
      o.status === statusFilter ||
      (statusFilter === "PROCESSING" && (o.status === "LENS_PROCESSING" || o.status === "FITTING"));
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      o.bill_no.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.customer?.phone && o.customer.phone.includes(q)) ||
      (o.prescription?.doctorName && o.prescription.doctorName.toLowerCase().includes(q));

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

      <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 space-y-3.5">
        {/* Top Control Bar: Search, Filters & View Toggle */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bill #, Patient Name, Phone, Doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              <span>Pending Pickup</span>
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
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Dispensing Stages ({orders.length})</option>
              <option value="PLACED">Placed</option>
              <option value="PROCESSING">Rx Verification & Packing</option>
              <option value="READY_FOR_PICKUP">Ready at Counter</option>
              <option value="DELIVERED">Dispensed</option>
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
                <span>Kanban Queue</span>
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

        {/* VIEW 1: KANBAN PIPELINE */}
        {viewMode === "KANBAN" ? (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
            <div className="flex gap-3.5 h-full min-w-[1050px]">
              {STAGES.map((stage) => {
                const stageOrders = filtered.filter((o) => {
                  if (stage.key === "PROCESSING") {
                    return o.status === "PROCESSING" || o.status === "LENS_PROCESSING" || o.status === "FITTING";
                  }
                  return o.status === stage.key;
                });
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
                        ? "border-2 border-dashed border-teal-500 bg-teal-50/50 scale-[1.01]"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b border-slate-200 bg-white rounded-t-2xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
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
                          <p className="text-[9px] text-slate-400 mt-0.5">Drag & drop bills here</p>
                        </div>
                      ) : (
                        stageOrders.map((ord) => {
                          const orderDueStr = ord.delivery_due_date
                            ? new Date(ord.delivery_due_date).toISOString().split("T")[0]
                            : null;
                          const isDueToday = orderDueStr === todayStr;
                          const isOverdue =
                            orderDueStr && orderDueStr < todayStr && ord.status !== "DELIVERED";
                          const nextAction = NEXT_STAGE_MAP[ord.status] || NEXT_STAGE_MAP["PROCESSING"];

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
                              className={`p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-400 transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                                draggedOrderId === ord.id ? "opacity-50 scale-95" : ""
                              }`}
                            >
                              {/* Card Header: Bill No & Link */}
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/orders/${ord.id}`}
                                  className="font-black text-xs font-mono text-teal-800 hover:text-teal-950 hover:underline flex items-center gap-1"
                                >
                                  <span>{ord.bill_no}</span>
                                  <ArrowRight className="w-3 h-3 opacity-60" />
                                </Link>

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

                              {/* Patient Details */}
                              <div>
                                <p className="font-bold text-slate-900 text-xs leading-tight">
                                  {ord.customer?.name || "Walk-in Patient"}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{ord.customer?.phone}</span>
                                </p>
                              </div>

                              {/* Medicines Summary */}
                              <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                                <p className="truncate font-semibold text-slate-800">
                                  {ord.items
                                    ?.map(
                                      (i: any) => {
                                        const med = i.medicine || i.item || {};
                                        return `${med.name || med.brand || "Medicine"}`;
                                      }
                                    )
                                    .join(", ") || "Pharmacy Medicines"}
                                </p>
                                {ord.prescription && (
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-teal-700">
                                    <Stethoscope className="w-3 h-3" />
                                    <span>
                                      Dr. {ord.prescription.doctorName || "Staff"} • {ord.prescription.dosageInstructions || "Rx Attached"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Financial Summary */}
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                                <div>
                                  <span className="text-slate-400 text-[9px] block">Net Bill</span>
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

                              {/* Toolbar Actions */}
                              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setThermalSlipOrder(ord)}
                                    className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                                    title="Pharmacy 80mm Dispensing Slip"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setSelectedReceiptOrder(ord)}
                                    className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                                    title="GST Tax Invoice"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>

                                  {/* WhatsApp Dropdown */}
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
                                          1. Bill Confirmation
                                        </button>
                                        <button
                                          onClick={() => sendWhatsApp("READY_FOR_PICKUP", ord)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-teal-50 text-teal-700 font-semibold"
                                        >
                                          2. Ready for Pickup
                                        </button>
                                        <button
                                          onClick={() => sendWhatsApp("PAYMENT_RECEIPT", ord)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 font-semibold"
                                        >
                                          3. Final Tax Receipt
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {nextAction ? (
                                  <button
                                    onClick={() => handleStageChange(ord.id, nextAction.key)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                      nextAction.key === "DELIVERED"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                        : "bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
                                    }`}
                                  >
                                    {nextAction.label}
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Dispensed
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
          /* VIEW 2: TABLE VIEW */
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto w-full">
              <table className="w-full min-w-[850px] text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5">Bill / Order #</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Medicines & Doctor Rx</th>
                    <th className="p-3.5">Promised Pickup</th>
                    <th className="p-3.5 text-right">Net Payable</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Balance Due</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Loading medical orders...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
                          <Pill className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {orders.length === 0
                              ? "Bills: 0"
                              : "No orders match the selected filters"}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {orders.length === 0
                              ? "No medical bills recorded yet. Open the POS Terminal to start billing medicines."
                              : "Try adjusting the status filter tabs or reset the search."}
                          </p>
                          {orders.length === 0 && (
                            <Link
                              href="/pos"
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Create First Medical Bill</span>
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
                          <td className="p-3.5 font-bold font-mono text-teal-800 text-xs">
                            <Link href={`/orders/${ord.id}`} className="hover:underline">
                              {ord.bill_no}
                            </Link>
                          </td>

                          <td className="p-3.5">
                            <p className="font-semibold text-slate-800">
                              {ord.customer?.name || "Walk-in Patient"}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {ord.customer?.phone}
                            </p>
                          </td>

                          <td className="p-3.5 text-slate-600">
                            <p className="text-xs truncate max-w-xs font-medium text-slate-800">
                              {ord.items
                                ?.map(
                                  (i: any) => {
                                    const med = i.medicine || i.item || {};
                                    return `${i.quantity}x ${med.name || med.brand || "Medicine"}`;
                                  }
                                )
                                .join(", ")}
                            </p>
                            {ord.prescription && (
                              <span className="text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-bold mt-0.5 inline-block">
                                Rx: Dr. {ord.prescription.doctorName || "Physician"}
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
                              <option value="PROCESSING">Verification</option>
                              <option value="READY_FOR_PICKUP">Ready at Counter</option>
                              <option value="DELIVERED">Dispensed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setThermalSlipOrder(ord)}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                                title="Dispensing Slip"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedReceiptOrder(ord)}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                                title="Tax Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
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

      {/* Balance Payment Modal */}
      {balanceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Settle Balance Before Dispensing
              </h3>
              <button
                onClick={() => setBalanceModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCollectPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Bill Balance Due</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                >
                  <option value="UPI">UPI / QR Scan</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Transaction Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="UPI Ref ID, Card Last 4 digits..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalOrder(null)}
                  className="px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-1.5 rounded-lg font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  {paySubmitting ? "Settling..." : "Collect & Dispense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {thermalSlipOrder && (
        <ThermalJobSlipModal
          order={thermalSlipOrder}
          onClose={() => setThermalSlipOrder(null)}
        />
      )}

      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}