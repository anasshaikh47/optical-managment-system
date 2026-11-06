"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Clock,
  Glasses,
  AlertTriangle,
  ArrowRight,
  Phone,
  Printer,
  Eye,
  MessageCircle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  UserPlus,
  Search,
  Zap,
} from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ReceiptModal } from "@/components/ReceiptModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useAppUi } from "@/context/AppUiContext";
import { useDashboardData, DEFAULT_DASHBOARD_DATA } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const { shopId, tenantFetch } = useAuth();
  const { openNewCustomerModal, openQuickSearchModal } = useAppUi();
  const { data, loading, isRevalidating, refetch } = useDashboardData(shopId, tenantFetch);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  const kpis = data?.kpis || {};
  const recentOrders = data?.urgentOrders || [];

  const handleSendWhatsAppAlert = (order: any) => {
    const customer = order.customer;
    if (!customer?.phone) {
      alert("Customer phone number not available.");
      return;
    }

    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const customerName = customer.name || "Valued Customer";
    const billNo = order.bill_no;
    const balance = formatCurrency(order.balance_amount);

    let message = "";
    if (order.status === "READY_FOR_PICKUP") {
      message = `Namaste ${customerName}, aapka chashma ready hai! (Bill: ${billNo}). Pending balance: ${balance}. Store timing: 10 AM - 9:30 PM. Visit My Optics Shop!`;
    } else if (order.status === "LENS_PROCESSING" || order.status === "FITTING") {
      message = `Namaste ${customerName}, aapka spectacle order (${billNo}) lab edging / frame fitting process mein hai. Ready hote hi hum update bhejenge. - My Optics Shop`;
    } else if (order.status === "DELIVERED") {
      message = `Namaste ${customerName}, My Optics Shop se spectacles collect karne ke liye shukriya! Kisi bhi adjustment ke liye free store service uplabdh hai.`;
    } else {
      message = `Namaste ${customerName}, aapka spectacle order (${billNo}) confirm ho chuka hai. Expected delivery: ${formatDate(order.delivery_due_date)}. - My Optics Shop`;
    }

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    setWhatsappToast(`WhatsApp alert prepared for ${customerName} (${billNo})`);
    setTimeout(() => setWhatsappToast(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-12 space-y-4 sm:space-y-6">
      {/* Toast Feedback */}
      {whatsappToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl animate-in slide-in-from-top-2">
          <MessageCircle className="w-4 h-4 fill-white shrink-0" />
          <span>{whatsappToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: 4 QUICK ACTION CARDS (2x2 Grid)              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: + Add Customer */}
        <button
          type="button"
          onClick={openNewCustomerModal}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3 group-hover:scale-105 transition-transform">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              + Add Customer
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Patient checkup & Rx
            </p>
          </div>
        </button>

        {/* Card 2: Search Record */}
        <button
          type="button"
          onClick={openQuickSearchModal}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 mb-3 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              Search Record
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Find bills & past Rx
            </p>
          </div>
        </button>

        {/* Card 3: Inventory Stock */}
        <Link
          href="/inventory"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 mb-3 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              Inventory Stock
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Frames & power lenses
            </p>
          </div>
        </Link>

        {/* Card 4: Create Bill / POS (Highlighted active accent) */}
        <Link
          href="/pos"
          className="bg-cyan-700 hover:bg-cyan-800 text-white p-4 sm:p-5 rounded-2xl border border-cyan-600 shadow-xs flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/15 text-white flex items-center justify-center border border-white/20 mb-3 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-black text-white text-sm sm:text-base leading-tight">
                Create Bill / POS
              </h4>
              <span className="text-[9px] font-mono font-bold uppercase bg-white/20 text-white px-1.5 py-0.5 rounded">
                Instant
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-cyan-100 font-medium mt-0.5">
              Fast counter billing
            </p>
          </div>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: SALES BREAKDOWN DONUT CHART                   */}
      {/* ======================================================== */}
      <DashboardCharts analytics={data?.analytics} />

      {/* ======================================================== */}
      {/* SECTION 3: METRIC SUMMARY CARDS                          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Sales
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight">
              {formatCurrency(kpis.todaySales || 0)}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Payments collected today</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Metric 2: Pending Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Balance
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-1 font-mono tracking-tight">
              {formatCurrency(kpis.totalBalanceDue || 0)}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Due at counter pickup</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Metric 3: Ready for Pickup */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ready for Pickup
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-1 tracking-tight">
              {kpis.readyForPickupCount || 0}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
              <Glasses className="w-3 h-3" />
              <span>Glazed & passed inspection</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Glasses className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Metric 4: Low Stock Items */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Items
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-700 mt-1 tracking-tight">
              {kpis.lowStockCount || 0}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Below safety threshold</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. RECENT CUSTOMER ORDERS & GLASSES STATUS TABLE         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Title Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Glasses className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Recent Customer Orders & Glasses Status
              </h3>
              <p className="text-[11px] text-slate-500">
                Track lens edging progress, counter dues & send instant WhatsApp notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isRevalidating && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                Live Syncing
              </span>
            )}
            <Link
              href="/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors group shrink-0"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Orders Table Container: Scroll horizontally on mobile */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Customer & Bill</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Eyewear Spec</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Balance Due</th>
                <th className="p-3.5 text-center">Quick WhatsApp</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    Loading recent orders...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    No active orders found in store register. Click &ldquo;POS Terminal / New Bill&rdquo; to create a sale.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord: any) => {
                  const frameItem = ord.items?.find((i: any) => i.item?.type === "FRAME");
                  const lensItem = ord.items?.find((i: any) => i.item?.type === "LENS");

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Customer Name & Bill No */}
                      <td className="p-3.5">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-1.5"
                        >
                          <span>{ord.customer?.name || "Walk-in Customer"}</span>
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Bill: {ord.bill_no}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="p-3.5 font-mono text-slate-700 text-xs">
                        {ord.customer?.phone || "—"}
                      </td>

                      {/* Eyewear Spec */}
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {frameItem ? (
                          <span className="font-semibold text-slate-800">
                            {frameItem.item?.brand} {frameItem.item?.model}
                          </span>
                        ) : (
                          <span className="text-slate-400">Custom Frame</span>
                        )}
                        {lensItem && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            Lens: {lensItem.item?.brand} ({lensItem.item?.lens_index || "1.56"})
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            ord.status === "READY_FOR_PICKUP"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : ord.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.status === "LENS_PROCESSING" || ord.status === "FITTING"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
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

                      {/* Quick WhatsApp Alert Button */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppAlert(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] shadow-xs transition-colors cursor-pointer"
                          title="Send instant WhatsApp order status update"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white stroke-[#25D366]" />
                          <span>WhatsApp</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Print GST Tax Invoice / Counter Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/orders/${ord.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Order & Lab Prescription"
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
