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
  Glasses,
  User,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wrench,
  Check,
  Award,
  Sparkles,
  ChevronRight,
  Eye,
  Save,
  Send,
  X,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ThermalJobSlipModal } from "@/components/ThermalJobSlipModal";
import { formatDate, formatDateTime, formatCurrency, formatDiopter, formatAdd, formatAxis, normalizeRx } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const STAGES = [
  { key: "PLACED", label: "Order Placed" },
  { key: "LENS_PROCESSING", label: "Lens Lab Glazing" },
  { key: "FITTING", label: "Frame Fitting" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { key: "DELIVERED", label: "Delivered" },
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

  // Technician Lab Notes Editing
  const [labNotes, setLabNotes] = useState("");
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
        setLabNotes(data.data.prescription?.notes || "");
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

    // If moving to DELIVERED and there is pending balance, require settlement!
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
        body: JSON.stringify({ notes: labNotes }),
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-100 items-center justify-center text-slate-400 text-xs">
        Loading order details...
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
            <ArrowLeft className="w-4 h-4" /> Return to Orders Pipeline
          </Link>
        </div>
      </div>
    );
  }

  const safeRx = normalizeRx(order.prescription);
  const rx = safeRx.hasRx ? safeRx : null;
  const frameItem = order.items?.find((i: any) => i.item?.type === "FRAME")?.item;
  const lensItem = order.items?.find((i: any) => i.item?.type === "LENS")?.item;

  const currentStageIndex = STAGES.findIndex((s) => s.key === order.status);

  // Delivery Due Date alerts
  const todayStr = new Date().toISOString().split("T")[0];
  const orderDueStr = order.delivery_due_date
    ? new Date(order.delivery_due_date).toISOString().split("T")[0]
    : null;
  const isDueToday = orderDueStr === todayStr;
  const isOverdue = orderDueStr && orderDueStr < todayStr && order.status !== "DELIVERED";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4">
        {/* Navigation Breadcrumb & Action Toolbar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/orders"
              className="font-bold text-slate-500 hover:text-cyan-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Orders Pipeline</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-mono font-bold text-slate-900">{order.bill_no}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ml-1 ${
                order.status === "DELIVERED"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.status === "READY_FOR_PICKUP"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-cyan-100 text-cyan-800"
              }`}
            >
              {order.status.replace("_", " ")}
            </span>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Workshop Thermal Slip */}
            <button
              onClick={() => setShowThermalModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal Lab Ticket</span>
            </button>

            {/* GST Tax Invoice */}
            <button
              onClick={() => setShowReceiptModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>GST Tax Invoice</span>
            </button>

            {/* WhatsApp Updates Dropdown */}
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
                    1. Booking Confirmation
                  </button>
                  <button
                    onClick={() => sendWhatsApp("READY_FOR_PICKUP")}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-purple-50 text-purple-700 font-semibold"
                  >
                    2. Ready for Pickup
                  </button>
                  <button
                    onClick={() => sendWhatsApp("PAYMENT_RECEIPT")}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 font-semibold"
                  >
                    3. Final Payment Receipt
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
              <Wrench className="w-4 h-4 text-cyan-600" />
              Optical Glazing & Delivery Workflow Pipeline
            </span>
            <span className="text-[11px] text-slate-400">Click any stage to update job status</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <button
                  key={stage.key}
                  onClick={() => handleUpdateStatus(stage.key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? "border-cyan-500 bg-cyan-50/70 shadow-sm ring-2 ring-cyan-500/20"
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
                      <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
                    ) : isPast ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : null}
                  </div>
                  <p
                    className={`text-xs font-bold ${
                      isCurrent
                        ? "text-cyan-900"
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

        {/* Two-Column Grid: Left Lab & Eyewear Specs, Right Customer & Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ======================================================== */}
          {/* LEFT 2 COLUMNS: LAB & FITTING DETAILS CARD               */}
          {/* ======================================================== */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lab & Refraction Prescription Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                    <Glasses className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Optical Prescription & Lab Glazing Matrix
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Standard diopter measurements & optical lab edger parameters
                    </p>
                  </div>
                </div>

                {rx && (
                  <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded">
                    Optom: {rx.optometristName || "Dr. Staff"}
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4 text-xs">
                {rx ? (
                  <>
                    {/* OD & OS Refraction Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-center text-xs font-mono border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-sans font-bold text-[10px]">
                          <tr>
                            <th className="p-2 text-left pl-3">Eye</th>
                            <th className="p-2">SPH</th>
                            <th className="p-2">CYL</th>
                            <th className="p-2">AXIS</th>
                            <th className="p-2">ADD</th>
                            <th className="p-2">PD (Dist)</th>
                            <th className="p-2">PD (Near)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2.5 text-left pl-3 font-sans font-bold text-cyan-800">
                              OD (Right)
                            </td>
                            <td className="p-2.5 font-bold">{safeRx.formatted.od.sph}</td>
                            <td className="p-2.5">{safeRx.formatted.od.cyl}</td>
                            <td className="p-2.5">{safeRx.formatted.od.axis}</td>
                            <td className="p-2.5 text-cyan-700 font-bold">
                              {safeRx.formatted.od.add}
                            </td>
                            <td className="p-2.5">{safeRx.pd_distance !== "—" ? `${safeRx.pd_distance} mm` : "63.0 mm"}</td>
                            <td className="p-2.5">{safeRx.pd_near !== "—" ? `${safeRx.pd_near} mm` : "60.0 mm"}</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-left pl-3 font-sans font-bold text-blue-800">
                              OS (Left)
                            </td>
                            <td className="p-2.5 font-bold">{safeRx.formatted.os.sph}</td>
                            <td className="p-2.5">{safeRx.formatted.os.cyl}</td>
                            <td className="p-2.5">{safeRx.formatted.os.axis}</td>
                            <td className="p-2.5 text-cyan-700 font-bold">
                              {safeRx.formatted.os.add}
                            </td>
                            <td className="p-2.5">{safeRx.pd_distance !== "—" ? `${safeRx.pd_distance} mm` : "63.0 mm"}</td>
                            <td className="p-2.5">{safeRx.pd_near !== "—" ? `${safeRx.pd_near} mm` : "60.0 mm"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Lens Type & Refractive Index Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Optical Design
                        </span>
                        <span className="font-bold text-slate-900 uppercase">
                          {safeRx.formatted.lensDesign}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Pupillary Distance
                        </span>
                        <span className="font-bold text-slate-900">
                          {safeRx.pd_distance !== "—" ? `${safeRx.pd_distance} mm (Dist)` : "63 mm (Dist)"} • {safeRx.pd_near !== "—" ? `${safeRx.pd_near} mm (Near)` : "60 mm (Near)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Lens Material / Index
                        </span>
                        <span className="font-bold text-slate-900">
                          {lensItem?.lens_index ? `Index ${lensItem.lens_index}` : "Index 1.56 Mid-Index"}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">
                    No refraction prescription attached. Over-the-counter spectacle purchase.
                  </p>
                )}

                {/* Frame Details */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs uppercase mb-2 flex items-center gap-1.5">
                    <Glasses className="w-3.5 h-3.5 text-cyan-600" />
                    Selected Spectacle Frame Details
                  </h4>

                  {frameItem ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">Brand</span>
                        <span className="font-bold text-slate-900">{frameItem.brand}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">Model</span>
                        <span className="font-bold text-slate-900">{frameItem.model || frameItem.sku}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">Color / Size</span>
                        <span className="font-semibold text-slate-800">
                          {frameItem.color || "Standard"} • {frameItem.size || "52-18-140"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">SKU Barcode</span>
                        <span className="font-mono font-bold text-slate-700">{frameItem.sku}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-xs">
                      Customer&apos;s Own Frame (B.Y.O.F) / Glazing Only
                    </p>
                  )}
                </div>

                {/* Technician Lab Notes Area */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-cyan-600" />
                      Workshop Technician Lab Notes
                    </label>
                    {notesSavedAlert && (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved to Database!
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={labNotes}
                    onChange={(e) => setLabNotes(e.target.value)}
                    placeholder="Log edging notes, bevel specs, axis verification (e.g., Edged on Nidek LE-9000, 1.67 high index bevel, fit checked)..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingNotes ? "Saving..." : "Save Lab Notes"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Order Line Items ({order.items?.length || 0})
                </h4>
                <span className="text-xs font-bold text-slate-900">
                  Subtotal: {formatCurrency(order.total_amount)}
                </span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[550px] text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-right">Coating & Fitting</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items?.map((it: any) => {
                      const extra = (it.coating_charges || 0) + (it.fitting_charges || 0);
                      return (
                        <tr key={it.id}>
                          <td className="p-3 font-semibold text-slate-800">
                            {it.item?.brand} - {it.item?.model || it.item?.type}
                            <span className="text-[10px] text-slate-400 font-mono block">
                              SKU: {it.item?.sku}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            {it.quantity}
                          </td>
                          <td className="p-3 text-right text-slate-700">
                            {formatCurrency(it.unit_price)}
                          </td>
                          <td className="p-3 text-right text-slate-500">
                            {extra > 0 ? formatCurrency(extra) : "—"}
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

          {/* ======================================================== */}
          {/* RIGHT COLUMN: CUSTOMER & FINANCIAL LEDGER                */}
          {/* ======================================================== */}
          <div className="space-y-4">
            {/* Customer & Delivery Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-600" /> Patient Profile
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full inline-flex items-center gap-1">
                  <Award className="w-2.5 h-2.5" /> {order.customer?.loyalty_points || 0} pts
                </span>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  {order.customer?.name || "Walk-in Guest"}
                </h4>
                <p className="text-slate-600 font-mono mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <a
                    href={`tel:${order.customer?.phone}`}
                    className="hover:text-cyan-700 underline"
                  >
                    {order.customer?.phone}
                  </a>
                </p>
                {order.customer?.email && (
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{order.customer.email}</span>
                  </p>
                )}
                {order.customer?.address && (
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{order.customer.address}</span>
                  </p>
                )}
              </div>

              {/* Delivery Due Date Alert Banner */}
              <div
                className={`p-3 rounded-xl border space-y-0.5 ${
                  isOverdue
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : isDueToday
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Promised Delivery:
                  </span>
                  <span className="font-black">
                    {order.delivery_due_date ? formatDate(order.delivery_due_date) : "Standard (2 Days)"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {isOverdue
                    ? "Job is overdue. Expedite lab fitting immediately."
                    : isDueToday
                    ? "Customer is expecting eyewear ready today."
                    : "On schedule for workshop completion."}
                </p>
              </div>
            </div>

            {/* Financial Ledger & Balance Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-600" /> Financial Ledger
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.balance_amount === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {order.balance_amount === 0 ? "PAID FULL" : "BALANCE PENDING"}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Privilege:</span>
                    <span className="font-semibold">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST Amount (12%):</span>
                  <span className="font-semibold">{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Final Net Payable:</span>
                  <span className="text-cyan-700 font-black">{formatCurrency(order.final_payable)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Total Received:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(order.paid_amount)}</span>
                </div>
                {order.balance_amount > 0 && (
                  <div className="flex justify-between text-rose-700 font-black text-sm bg-rose-50 p-2 rounded-lg">
                    <span>Balance Due at Pickup:</span>
                    <span>{formatCurrency(order.balance_amount)}</span>
                  </div>
                )}
              </div>

              {/* Collect Balance Action Button */}
              {order.balance_amount > 0 && (
                <button
                  onClick={() => {
                    setPayAmount(order.balance_amount.toString());
                    setIsBalanceModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect Remaining Balance ({formatCurrency(order.balance_amount)})</span>
                </button>
              )}

              {/* Payment History Log */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Recorded Transactions ({order.payments?.length || 0})
                </span>

                {order.payments?.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {order.payments?.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {p.method} • <span className="uppercase text-[9px] bg-slate-200 px-1 py-0.2 rounded font-mono">{p.payment_type}</span>
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {formatDateTime(p.createdAt)}
                            {p.transaction_ref && <span> • Ref: {p.transaction_ref}</span>}
                          </p>
                        </div>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Settlement Modal */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Collect Balance Payment</h3>
              </div>
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Order #{order.bill_no} for <strong>{order.customer?.name}</strong>.
            </p>

            <form onSubmit={handleCollectPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={order.balance_amount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
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
                  onClick={() => setIsBalanceModalOpen(false)}
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

      {/* GST Tax Invoice Slip Modal */}
      {showReceiptModal && (
        <ReceiptModal order={order} onClose={() => setShowReceiptModal(false)} />
      )}

      {/* 80mm Workshop Thermal Lab Slip Modal */}
      {showThermalModal && (
        <ThermalJobSlipModal order={order} onClose={() => setShowThermalModal(false)} />
      )}
    </div>
  );
}
