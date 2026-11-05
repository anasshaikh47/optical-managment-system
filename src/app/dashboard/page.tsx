"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Clock,
  Pill,
  AlertTriangle,
  ArrowRight,
  Phone,
  Printer,
  FileText,
  MessageCircle,
  CheckCircle2,
  Package,
  Sparkles,
  UserPlus,
  Search,
  Zap,
  Calendar,
  AlertCircle,
  ShieldPlus,
} from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ReceiptModal } from "@/components/ReceiptModal";
import { AddProductModal } from "@/components/AddProductModal";
import { formatCurrency, formatDate, getExpiryStatus } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useAppUi } from "@/context/AppUiContext";

export default function DashboardPage() {
  const { shopId, tenantFetch } = useAuth();
  const { openQuickSearchModal } = useAppUi();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    const handleCustomerCreated = () => {
      fetchDashboardData();
    };
    window.addEventListener("customer-created", handleCustomerCreated);
    return () => window.removeEventListener("customer-created", handleCustomerCreated);
  }, [shopId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch("/api/dashboard");
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
  const lowStockItems = data?.lowStockItems || [];
  const expiringItems = data?.expiringItems || [];

  const handleSendWhatsAppAlert = (order: any) => {
    const customer = order.customer;
    if (!customer?.phone) {
      alert("Patient phone number not available.");
      return;
    }

    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const customerName = customer.name || "Valued Customer";
    const billNo = order.bill_no;
    const balance = formatCurrency(order.balance_amount);

    const message = `Namaste ${customerName}, your medical bill (${billNo}) has been processed at PharmaPulse Chemist. Pending Balance: ${balance}. Please bring your original prescription for Schedule H medicines. Helpline: +91 98201 12345.`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");

    setWhatsappToast(`WhatsApp notification sent to ${customerName} (${billNo})`);
    setTimeout(() => setWhatsappToast(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-6 pb-28 sm:pb-32 lg:pb-12 space-y-4 sm:space-y-6">
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
        {/* Card 1: + Add Medicine */}
        <button
          type="button"
          onClick={() => setIsAddMedicineOpen(true)}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-3 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              + Add Medicine
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Batch, expiry & generic salt
            </p>
          </div>
        </button>

        {/* Card 2: Search Batch/Salt */}
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
              Search Batch/Salt
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Instant salt & rack locator
            </p>
          </div>
        </button>

        {/* Card 3: Stock & Expiry */}
        <Link
          href="/inventory"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 mb-3 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              Stock & Expiry
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Near expiry & stock levels
            </p>
          </div>
        </Link>

        {/* Card 4: Create Medical Bill */}
        <Link
          href="/pos"
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 sm:p-5 rounded-2xl border border-emerald-500 shadow-xs flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/15 text-white flex items-center justify-center border border-white/20 mb-3 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-black text-white text-sm sm:text-base leading-tight">
                Create Medical Bill
              </h4>
              <span className="text-[9px] font-mono font-bold uppercase bg-white/20 text-white px-1.5 py-0.5 rounded">
                Fast POS
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5">
              Strip & loose tablet billing
            </p>
          </div>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: SALES BREAKDOWN DONUT CHART                   */}
      {/* ======================================================== */}
      <DashboardCharts analytics={data?.analytics} />

      {/* ======================================================== */}
      {/* SECTION 3: 4 CORE PHARMACY METRIC SUMMARY CARDS          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Today's Pharma Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Pharma Sales
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

        {/* Metric 2: Pending Prescriptions */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Prescriptions
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-1 tracking-tight">
              {kpis.pendingPrescriptionsCount || 0} Rx
            </h3>
            <p className="text-[10px] sm:text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>Awaiting dispensing verification</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Metric 3: Expiring Batches Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Expiring Batches Count
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 mt-1 tracking-tight">
              {kpis.expiringBatchesCount || 0} Batches
            </h3>
            <p className="text-[10px] sm:text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Expiring within 60 days</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Metric 4: Low Stock Medicines */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Medicines
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-1 tracking-tight">
              {kpis.lowStockCount || 0} Items
            </h3>
            <p className="text-[10px] sm:text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Below minimum alert threshold</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 4: NEAR EXPIRY & LOW STOCK DUAL ALERT PANELS     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expiring Batches Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Calendar className="w-4 h-4" />
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                Near Expiry & Expired Alert
              </h4>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {expiringItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              All active medicine batches have &gt; 60 days validity.
            </p>
          ) : (
            <div className="space-y-2">
              {expiringItems.map((med: any) => {
                const exp = getExpiryStatus(med.expiryDate);
                return (
                  <div
                    key={med.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">
                        {med.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Batch: {med.batchNumber} • Rack: {med.rackLocation || "General"}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${exp.badgeClass}`}>
                      {exp.label} ({med.expiryDate})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low Stock Alert Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                Low Stock & Out of Stock Alert
              </h4>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              All medicines are well above minimum alert thresholds.
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((med: any) => {
                const qty = med.stripQuantity ?? med.stock_quantity ?? 0;
                const min = med.minStockAlert ?? med.min_alert_threshold ?? 10;
                const isOut = qty <= 0;
                return (
                  <div
                    key={med.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">
                        {med.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {med.genericSaltName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isOut
                            ? "bg-rose-100 text-rose-700 border-rose-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {isOut ? "OUT OF STOCK" : `${qty} left (Min: ${min})`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 5: RECENT MEDICAL BILLS & DISPENSING             */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Recent Medical Bills & Counter Sales
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time patient billing history and prescription logs
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Bills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No medical sales recorded yet. Click &quot;Create Medical Bill&quot; above to start billing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Bill No</th>
                  <th className="p-3.5">Patient Name</th>
                  <th className="p-3.5">Doctor / Clinic</th>
                  <th className="p-3.5">Items Dispensed</th>
                  <th className="p-3.5 text-right">Net Payable</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {order.bill_no}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{order.customer?.name || order.patientName || "Walk-in Patient"}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {order.customer?.phone}
                      </p>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {order.prescription?.doctorName || order.doctorName || "OTC Direct"}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">
                        {order.items?.length || 1} product(s)
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(order.final_payable)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.balance_amount === 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {order.balance_amount === 0 ? "PAID" : `DUE: ${formatCurrency(order.balance_amount)}`}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Print Medical Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {order.customer?.phone && (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppAlert(order)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Send WhatsApp Receipt"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      <AddProductModal
        isOpen={isAddMedicineOpen}
        onClose={() => setIsAddMedicineOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />

      {/* Invoice Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
