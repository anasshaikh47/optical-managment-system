"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Receipt,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pill,
  User,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Stethoscope,
  Check,
  Award,
  Sparkles,
  ChevronRight,
  Building,
  Save,
  Send,
  X,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ThermalJobSlipModal } from "@/components/ThermalJobSlipModal";
import { formatDate, formatDateTime, formatCurrency, getExpiryStatus } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const STAGES = [
  { key: "PLACED", label: "Bill / Order Placed" },
  { key: "PROCESSING", label: "Rx Verification & Packing" },
  { key: "READY_FOR_PICKUP", label: "Ready at Counter" },
  { key: "DELIVERED", label: "Dispensed" },
];

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = use(params);

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showThermalModal, setShowThermalModal] = useState(false);

  // Pharmacist Notes Editing
  const [pharmacistNotes, setPharmacistNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedAlert, setNotesSavedAlert] = useState(false);

  // Balance Payment Settlement Modal
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  // WhatsApp active dropdown popup menu
  const [showWaMenu, setShowWaMenu] = useState(false);

  const { shopId, tenantFetch } = useAuth();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, shopId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setPharmacistNotes(data.data.prescription?.notes || data.data.notes || "");
      } else {
        setError(data.error || "Failed to load order details");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;

    if (newStatus === "DELIVERED" && order.balance_amount > 0) {
      setPayAmount(order.balance_amount.toString());
      setIsBalanceModalOpen(true);
      return;
    }

    try {
      const res = await tenantFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await tenantFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: pharmacistNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setNotesSavedAlert(true);
        setTimeout(() => setNotesSavedAlert(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setPaySubmitting(true);
    try {
      const res = await tenantFetch(`/api/orders/${orderId}/payments`, {
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
        setIsBalanceModalOpen(false);
        fetchOrderDetails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaySubmitting(false);
    }
  };

  const sendWhatsApp = (type: "CONFIRMATION" | "READY_FOR_PICKUP" | "PAYMENT_RECEIPT") => {
    setShowWaMenu(false);
    if (!order?.customer?.phone) return;
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-100 items-center justify-center text-slate-400 text-xs">
        Loading medical order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-100 p-6">
        <div className="p-8 text-center text-rose-600 bg-white rounded-2xl border border-rose-200 mt-4 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="font-bold">{error || "Order not found."}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Orders Queue
          </Link>
        </div>
      </div>
    );
  }

  const rx = order.prescription;
  const currentStageIndex = STAGES.findIndex((s) => {
    if (s.key === "PROCESSING") {
      return order.status === "PROCESSING" || order.status === "LENS_PROCESSING" || order.status === "FITTING";
    }
    return s.key === order.status;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4">
        {/* Navigation Breadcrumb & Action Toolbar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/orders"
              className="font-bold text-slate-500 hover:text-teal-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Orders Queue</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-mono font-bold text-slate-900">{order.bill_no}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ml-1 ${
                order.status === "DELIVERED"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.status === "READY_FOR_PICKUP"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-teal-100 text-teal-800"
              }`}
            >
              {order.status.replace("_", " ")}
            </span>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowThermalModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>80mm Dispensing Slip</span>
            </button>

            <button
              onClick={() => setShowReceiptModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>GST Tax Invoice</span>
            </button>

            {/* WhatsApp Updates */}
            <div className="relative">
              <button
                onClick={() => setShowWaMenu(!showWaMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Updates</span>
              </button>

              {showWaMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-xs space-y-1 animate-in fade-in">
                  <button
                    onClick={() => sendWhatsApp("CONFIRMATION")}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold"
                  >
                    1. Bill Confirmation
                  </button>
                  <button
                    onClick={() => sendWhatsApp("READY_FOR_PICKUP")}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-teal-50 text-teal-700 font-semibold"
                  >
                    2. Ready for Pickup
                  </button>
                  <button
                    onClick={() => sendWhatsApp("PAYMENT_RECEIPT")}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 font-semibold"
                  >
                    3. Final Tax Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visual Workflow Pipeline Stepper */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-600" />
              Pharmacy Dispensing & Delivery Workflow
            </span>
            <span className="text-[11px] text-slate-400">Click any stage to update bill status</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <button
                  key={stage.key}
                  onClick={() => handleUpdateStatus(stage.key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? "border-teal-500 bg-teal-50/70 shadow-sm ring-2 ring-teal-500/20"
                      : isPast
                      ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      Step 0{idx + 1}
                    </span>
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                    ) : isPast ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : null}
                  </div>
                  <p
                    className={`text-xs font-bold ${
                      isCurrent
                        ? "text-teal-900"
                        : isPast
                        ? "text-emerald-900"
                        : "text-slate-700"
                    }`}
                  >
                    {stage.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Grid: Left Rx & Medicines, Right Customer & Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Doctor Prescription Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Doctor Prescription & Dosage Regimen
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Physician reference, medical registration & clinical instructions
                    </p>
                  </div>
                </div>

                {rx && rx.doctorName && (
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
                    Dr. {rx.doctorName}
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4 text-xs">
                {rx ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Prescribing Doctor
                      </span>
                      <span className="font-bold text-slate-900">
                        Dr. {rx.doctorName || "Registered Physician"}
                      </span>
                      {rx.doctorRegNo && (
                        <span className="text-[10px] text-teal-700 font-mono block">
                          Reg: {rx.doctorRegNo}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Clinic / Hospital
                      </span>
                      <span className="font-bold text-slate-900">
                        {rx.clinicOrHospital || "Private Clinic Consultation"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Dosage Regimen
                      </span>
                      <span className="font-bold text-teal-800">
                        {rx.dosageInstructions || "As Directed by Doctor"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">
                    No doctor prescription attached. Over-the-counter medicine sale.
                  </p>
                )}

                {/* Pharmacist Dispensing Notes */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-600" />
                      Registered Pharmacist Dispensing & Caution Notes
                    </label>
                    {notesSavedAlert && (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved!
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={pharmacistNotes}
                    onChange={(e) => setPharmacistNotes(e.target.value)}
                    placeholder="Log dispensing notes, substitution cautions, allergy warnings, or batch checks..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Billed Medicines ({order.items?.length || 0})
                </h4>
                <span className="text-xs font-bold text-slate-900">
                  Subtotal: {formatCurrency(order.total_amount)}
                </span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[550px] text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-3">Medicine Description</th>
                      <th className="p-3">Batch & Expiry</th>
                      <th className="p-3 text-center">Unit / Qty</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items?.map((it: any) => {
                      const med = it.medicine || it.item || {};
                      const name = med.name || med.brand || "Medicine Item";
                      const salt = med.genericSaltName || med.model || "";
                      const batch = it.batchNumber || med.batchNumber || "B-101";
                      const exp = it.expiryDate || med.expiryDate || "";
                      const expiry = getExpiryStatus(exp);

                      return (
                        <tr key={it.id}>
                          <td className="p-3 font-semibold text-slate-800">
                            <div>{name}</div>
                            {salt && <span className="text-[10px] text-slate-500">{salt}</span>}
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <span>B: {batch}</span>
                            {exp && (
                              <span className={`ml-2 px-1 py-0.2 rounded border font-bold text-[10px] ${expiry.badgeClass}`}>
                                {exp}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            {it.quantity} {it.unitType === "LOOSE_TABLET" ? "tabs" : "units"}
                          </td>
                          <td className="p-3 text-right text-slate-700">
                            {formatCurrency(it.unit_price)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatCurrency(it.subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CUSTOMER & FINANCIAL LEDGER */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" /> Patient Profile
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full inline-flex items-center gap-1">
                  <Award className="w-2.5 h-2.5" /> {order.customer?.loyalty_points || 0} pts
                </span>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  {order.customer?.name || "Walk-in Patient"}
                </h4>
                <p className="text-slate-600 font-mono mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <a
                    href={`tel:${order.customer?.phone}`}
                    className="hover:text-teal-700 underline"
                  >
                    {order.customer?.phone || "—"}
                  </a>
                </p>
                {order.customer?.address && (
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{order.customer.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Financial Ledger
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.balance_amount === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {order.balance_amount === 0 ? "PAID FULL" : "BALANCE DUE"}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-semibold">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax:</span>
                  <span className="font-semibold">{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-100">
                  <span>Net Payable:</span>
                  <span>{formatCurrency(order.final_payable)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(order.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-black">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(order.balance_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Payment Modal */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Settle Balance Before Dispensing
              </h3>
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCollectPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Balance Amount</label>
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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(false)}
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

      {showThermalModal && (
        <ThermalJobSlipModal
          order={order}
          onClose={() => setShowThermalModal(false)}
        />
      )}

      {showReceiptModal && (
        <ReceiptModal
          order={order}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}