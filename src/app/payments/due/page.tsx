"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Search,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Printer,
  User,
  Zap,
  Clock,
  Check,
  X,
  ExternalLink,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getOrderNetPayable } from "@/lib/salesBreakdown";
import { ReceiptModal } from "@/components/ReceiptModal";
import { prefetchCustomerProfile } from "@/hooks/useCustomerProfile";

export default function PendingDuesPage() {
  const { shopId, tenantFetch } = useAuth();
  const { orders, setOrders, loading, refetch: fetchOrders } = useOrders(shopId, tenantFetch);

  const [searchQuery, setSearchQuery] = useState("");
  const [settlingOrderId, setSettlingOrderId] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [removingOrderIds, setRemovingOrderIds] = useState<Set<string>>(new Set());

  // Filter orders that have pending balance > 0
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === "CANCELLED") return false;
      const balance = parseFloat(String(o.balance_amount ?? o.pendingAmount ?? 0));
      return balance > 0.01;
    });
  }, [orders]);

  // Total Outstanding Balance across all pending orders
  const totalOutstandingBalance = useMemo(() => {
    return pendingOrders.reduce((sum, o) => {
      const balance = parseFloat(String(o.balance_amount ?? o.pendingAmount ?? 0));
      return sum + balance;
    }, 0);
  }, [pendingOrders]);

  // Search filtered pending orders
  const filteredPendingOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pendingOrders;

    return pendingOrders.filter((o) => {
      const billMatch = (o.bill_no || "").toLowerCase().includes(q);
      const nameMatch = (o.customer?.name || o.customerName || "").toLowerCase().includes(q);
      const phoneMatch = (o.customer?.phone || o.customerPhone || "").includes(q);
      return billMatch || nameMatch || phoneMatch;
    });
  }, [pendingOrders, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Single-Click Settle Action: Mark Full Balance as Paid (Cash)
  const handleCollectFullDue = async (order: any, paymentMode = "CASH") => {
    const orderId = order.id;
    const balance = parseFloat(String(order.balance_amount ?? order.pendingAmount ?? 0));
    if (balance <= 0) return;

    setSettlingOrderId(orderId);

    // Optimistic UI update: Animate removal
    setRemovingOrderIds((prev) => new Set(prev).add(orderId));

    try {
      const res = await tenantFetch(`/api/orders/${orderId}/pay-due`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: balance,
          paymentMode,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          `Payment of ${formatCurrency(balance)} collected! Bill #${order.bill_no} settled.`
        );

        // Update central orders state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  balance_amount: 0,
                  pendingAmount: 0,
                  paid_amount: (o.paid_amount || 0) + balance,
                  paidAmount: (o.paidAmount || 0) + balance,
                  status: "DELIVERED",
                }
              : o
          )
        );
      } else {
        // Revert optimistic removal on failure
        setRemovingOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
        alert(json.error || "Failed to record payment. Please try again.");
      }
    } catch (err: any) {
      setRemovingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      alert(err.message || "Failed to connect to server.");
    } finally {
      setSettlingOrderId(null);
    }
  };

  const handleWhatsAppReminder = (order: any) => {
    const customer = order.customer || {
      name: order.customerName,
      phone: order.customerPhone,
    };
    if (!customer?.phone) {
      alert("Customer mobile number not available.");
      return;
    }

    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const net = getOrderNetPayable(order);
    const balance = parseFloat(String(order.balance_amount ?? order.pendingAmount ?? 0));

    const message = `👓 *VISIONPULSE EYEWEAR STUDIO*
*Gentle Payment Balance Reminder*

Namaste *${customer.name || "Customer"}*,
This is a courteous update regarding your optical invoice *#${order.bill_no}*.

📋 *Bill No*: #${order.bill_no}
💰 *Total Bill*: ${formatCurrency(net)}
⚠️ *Pending Balance*: *${formatCurrency(balance)}*

Please visit our store to collect your spectacles and clear your pending due at your convenience.
📍 *Location*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Helpdesk*: +91 98201 12345`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100 [WebkitOverflowScrolling:touch]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full pb-24 md:pb-12">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <Link
            href="/dashboard"
            prefetch={true}
            className="font-bold text-slate-600 hover:text-cyan-700 flex items-center gap-1.5 text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>All Invoice Records</span>
            </Link>

            <Link
              href="/pos"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white shadow-xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ Create POS Bill</span>
            </Link>
          </div>
        </div>

        {/* Summary Header Banner */}
        <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-rose-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-[11px] font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3 text-rose-300" />
              <span>Pending Counter Dues</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Payment Collection & Balances
            </h2>
            <p className="text-xs text-rose-200/90 max-w-md">
              Live ledger of all unpaid and partial invoices. Settle full balances in a single click or send WhatsApp reminders.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                Total Outstanding
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white block mt-0.5">
                {formatCurrency(totalOutstandingBalance)}
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                Pending Bills
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-200 block mt-0.5">
                {pendingOrders.length}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer Name, Phone, or Bill #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
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

          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Showing <strong className="text-slate-900">{filteredPendingOrders.length}</strong> dues
          </span>
        </div>

        {/* Pending Dues List */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              <span className="animate-pulse font-medium">Checking pending balance records...</span>
            </div>
          ) : filteredPendingOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {searchQuery ? "No matching pending dues found" : "All Customer Accounts Settled! 🎉"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? "Try searching with another name, phone number, or clear the search input."
                    : "Zero pending balance across all customer bills. All cash and online payments are fully collected."}
                </p>
              </div>
              <Link
                href="/orders"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View All Invoices</span>
              </Link>
            </div>
          ) : (
            filteredPendingOrders.map((ord: any) => {
              const isRemoving = removingOrderIds.has(ord.id);
              const isSettling = settlingOrderId === ord.id;
              const net = getOrderNetPayable(ord);
              const paid = parseFloat(String(ord.paid_amount ?? ord.paidAmount ?? 0)) || 0;
              const balance = parseFloat(String(ord.balance_amount ?? ord.pendingAmount ?? 0)) || 0;
              const customer = ord.customer || {
                name: ord.customerName || "Customer",
                phone: ord.customerPhone || "No Phone",
              };
              const customerId = ord.customerId || customer.id;

              return (
                <div
                  key={ord.id}
                  className={`bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs transition-all duration-300 hover:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isRemoving ? "opacity-30 scale-95 pointer-events-none" : "opacity-100 scale-100"
                  }`}
                >
                  {/* Left: Customer Info, Bill #, Date */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {(customer.name || "CU").substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {customerId ? (
                          <Link
                            href={`/customers/${customerId}`}
                            prefetch={true}
                            onMouseEnter={() => prefetchCustomerProfile(customerId, tenantFetch, customer)}
                            onTouchStart={() => prefetchCustomerProfile(customerId, tenantFetch, customer)}
                            className="font-extrabold text-slate-900 text-sm hover:text-cyan-700 transition-colors flex items-center gap-1 group truncate"
                          >
                            <span>{customer.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-600 shrink-0" />
                          </Link>
                        ) : (
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">
                            {customer.name}
                          </h4>
                        )}
                        <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.2 rounded border border-cyan-100">
                          #{ord.bill_no}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                        {customer.phone && (
                          <a
                            href={`tel:${customer.phone}`}
                            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-cyan-700"
                          >
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{customer.phone}</span>
                          </a>
                        )}
                        <span>•</span>
                        <span className="font-sans">{formatDate(ord.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Financials (Total, Paid, Due Amount) */}
                  <div className="flex items-center gap-4 text-xs font-mono justify-between sm:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-sans font-bold uppercase text-slate-400 block">
                        Net Bill
                      </span>
                      <span className="font-bold text-slate-800 block">
                        {formatCurrency(net)}
                      </span>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-sans font-bold uppercase text-slate-400 block">
                        Already Paid
                      </span>
                      <span className="font-bold text-emerald-600 block">
                        {formatCurrency(paid)}
                      </span>
                    </div>

                    <div className="text-right bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                      <span className="text-[10px] font-sans font-bold uppercase text-rose-700 block">
                        Balance Due
                      </span>
                      <span className="text-sm sm:text-base font-black text-rose-600 font-mono block">
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions (Collect Cash, WhatsApp, Print) */}
                  <div className="flex items-center gap-2 justify-end pt-1 md:pt-0">
                    {/* WhatsApp Reminder Shortcut */}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppReminder(ord)}
                      className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* View Invoice Modal */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedReceiptOrder({
                          ...ord,
                          customer,
                        })
                      }
                      className="p-2 rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                      title="View / Print Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Prominent Mark as Paid (Cash) / Collect Full Due Button */}
                    <button
                      type="button"
                      disabled={isSettling}
                      onClick={() => handleCollectFullDue(ord, "CASH")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSettling ? "Settling..." : "Mark as Paid (Cash)"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
