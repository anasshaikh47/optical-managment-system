"use client";

import { useState, useRef, useEffect } from "react";
import {
  Printer,
  X,
  Glasses,
  CheckCircle2,
  Phone,
  MapPin,
  IndianRupee,
  MessageSquare,
  FileText,
  Receipt,
  Building,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, formatDiopter, formatAdd, formatAxis, normalizeRx } from "@/lib/utils";

export interface ReceiptModalProps {
  order: any;
  onClose: () => void;
  onGoToDashboard?: () => void;
}

export function ReceiptModal({ order, onClose, onGoToDashboard }: ReceiptModalProps) {
  const [printFormat, setPrintFormat] = useState<"A4_INVOICE" | "THERMAL_80MM">("A4_INVOICE");
  const printRef = useRef<HTMLDivElement>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const custPhone = order.customer?.phone || order.customerPhone || "";
    if (!custPhone) return;
    let cleanPhone = custPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const itemsSummary = order.items
      ?.map(
        (it: any) =>
          `• ${it.item ? `${it.item.brand} - ${it.item.model || it.item.type}` : "Eyewear Item"} (x${it.quantity}) - ₹${it.subtotal}`
      )
      .join("\n") || "• Eyewear Purchase";

    const deliveryFormatted = order.delivery_due_date
      ? new Date(order.delivery_due_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "2 Days";

    let rxSummary = "";
    const safeRx = normalizeRx(order.prescription);
    if (safeRx.hasRx) {
      rxSummary = `\n👁️ *Prescription Specs*:
• OD (Right): ${safeRx.formatted.od.summary}
• OS (Left): ${safeRx.formatted.os.summary}
• Lens Type: ${safeRx.formatted.lensDesign}
• PD: ${safeRx.pd_distance !== "—" ? `${safeRx.pd_distance}mm` : "Standard"}`;
    }

    const customerName = order.customer?.name || order.customerName || "Customer";
    const message = `👓 *VISIONPULSE EYEWEAR STUDIO*
Precision Clinical Optometry & Premium Eyewear

Dear *${customerName}*,
Thank you for your order! Here are your GST Tax Invoice & Lab Job details:

🧾 *Bill / Job Order*: #${order.bill_no}
📅 *Ready for Delivery*: ${deliveryFormatted}

💰 *Payment Breakdown*:
• Net Payable: ₹${order.final_payable ?? order.total_amount ?? 0}
• Advance Received: ₹${order.paid_amount ?? 0}
• Balance Due at Pickup: ₹${order.balance_amount ?? 0}

📦 *Items*:
${itemsSummary}
${rxSummary}

📍 *Store Location*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Helpline*: +91 98201 12345`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const safeRx = normalizeRx(order.prescription);
  const rx = safeRx.hasRx ? safeRx : null;

  // Calculate CGST and SGST amounts (half of tax_amount each for intra-state Maharashtra 27)
  const totalTax = order.tax_amount || 0;
  const cgstAmount = totalTax / 2;
  const sgstAmount = totalTax / 2;
  const taxableSubtotal = Math.max(0, order.total_amount - (order.discount_amount || 0));
  const finalPayable = order.final_payable ?? order.totalAmount ?? order.total_amount ?? 0;
  const paidAmount = order.paid_amount ?? order.paidAmount ?? 0;
  const balanceDue = order.balance_amount ?? order.pendingAmount ?? order.balanceAmount ?? 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150 modal-print-backdrop">
      {/* Strict Print Media Rules */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  body * {
    visibility: hidden !important;
  }
  #printable-invoice, #printable-invoice * {
    visibility: visible !important;
  }
  #printable-invoice {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: ${printFormat === "THERMAL_80MM" ? "4mm 3mm" : "10mm 12mm"} !important;
    background: #ffffff !important;
    box-sizing: border-box !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  @page {
    size: ${printFormat === "THERMAL_80MM" ? "80mm auto" : "A4 portrait"};
    margin: 0;
  }
  html, body {
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  header, nav, .bottom-nav, button, .no-print {
    display: none !important;
  }
}
`,
        }}
      />
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 modal-print-wrapper ${
          printFormat === "A4_INVOICE" ? "max-w-4xl" : "max-w-md"
        }`}
      >
        {/* ======================================================== */}
        {/* 1. TOP RESPONSIVE HEADER & FORMAT SELECTOR BAR           */}
        {/* ======================================================== */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 bg-slate-50 print:hidden no-print space-y-2.5 shrink-0">
          {/* Top Row: Title, Bill Badge & Close Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                Optical Print & Tax Invoicing
              </h3>
              <span className="hidden xs:inline-block px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-mono text-[10px] font-bold">
                #{order.bill_no}
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close invoice modal"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Row: Full-Width Format Switcher & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Format Toggle Tabs: Full-width on mobile */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setPrintFormat("A4_INVOICE")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  printFormat === "A4_INVOICE"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Standard A4 GST</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("THERMAL_80MM")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  printFormat === "THERMAL_80MM"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">80mm POS Slip</span>
              </button>
            </div>

            {/* Quick Actions (Desktop & Tablet shortcuts) */}
            <div className="hidden sm:flex items-center gap-2">
              {order.customer?.phone && (
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>WhatsApp</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>Print {printFormat === "A4_INVOICE" ? "A4" : "Slip"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PRINTABLE DOCUMENT CONTENT AREA                       */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 flex justify-center pb-8 sm:pb-6 print:bg-white print:p-0 print:m-0 modal-print-content">
          {/* ======================================================== */}
          {/* TEMPLATE 1: STANDARD A4 GST TAX INVOICE                 */}
          {/* ======================================================== */}
          {printFormat === "A4_INVOICE" ? (
            <div
              id="printable-invoice"
              ref={printRef}
              className="invoice-print-container w-full max-w-[800px] bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200 text-slate-800 font-sans text-xs print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              {/* Header: Seller & Invoice Banner */}
              <div className="flex items-start justify-between gap-3 mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                    <Glasses className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-wider leading-tight">
                      VISION<span className="text-cyan-600">PULSE</span> EYEWEAR STUDIO
                    </h1>
                    <p className="text-[10px] font-semibold text-slate-600 leading-tight">
                      Precision Clinical Optometry & Premium Eyewear
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                      Galleria Arcade, Powai, Mumbai - 400076, Maharashtra
                    </p>
                    <p className="text-[9px] font-mono text-slate-700 leading-tight">
                      <strong>GSTIN:</strong> 27AABCV1234F1Z8 • <strong>State Code:</strong> 27 (Maharashtra)
                    </p>
                    <p className="text-[9px] text-slate-500 leading-tight">
                      Tel: +91 98201 12345 • Email: billing@visionpulse.in
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider rounded">
                    TAX INVOICE
                  </span>
                  <p className="text-[11px] font-mono font-bold text-slate-900 mt-1 leading-tight">
                    Invoice No: {order.bill_no}
                  </p>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    Date: {formatDateTime(order.createdAt)}
                  </p>
                  {order.delivery_due_date && (
                    <p className="text-[10px] font-bold text-cyan-800 mt-0.5 leading-tight">
                      Promised Ready: {formatDate(order.delivery_due_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer details & Bill details grid: compact 2-column flex */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-[11px] leading-tight">
                <div>
                  <h4 className="font-bold text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                    Bill To / Patient Details:
                  </h4>
                  <p className="font-bold text-slate-900 text-xs leading-tight">
                    {order.customer ? order.customer.name : "Walk-in Retail Guest"}
                  </p>
                  <p className="font-mono text-slate-700 mt-0.5 leading-tight">
                    Phone: {order.customer?.phone || "—"}
                  </p>
                  {order.customer?.email && (
                    <p className="text-slate-600 truncate leading-tight">{order.customer.email}</p>
                  )}
                  {order.customer?.address && (
                    <p className="text-slate-600 truncate leading-tight">{order.customer.address}</p>
                  )}
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                    Place of Supply: <strong>Maharashtra (27)</strong>
                  </p>
                </div>

                <div className="text-right">
                  <h4 className="font-bold text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">
                    Invoice & Payment Status:
                  </h4>
                  <p className="font-mono text-[11px] leading-tight">
                    Order Status: <strong className="uppercase text-slate-900">{order.status?.replace("_", " ")}</strong>
                  </p>
                  <p className="text-slate-600 mt-0.5 leading-tight">
                    Payment Type: {balanceDue === 0 ? "Full Payment Settled" : "Advance Deposit"}
                  </p>
                  <p className="text-slate-600 font-mono leading-tight">
                    Payment Method: {order.payments?.[0]?.method || "UPI / Counter"}
                  </p>
                </div>
              </div>

              {/* Optical Prescription Matrix Table (If attached) */}
              {safeRx.hasRx && (
                <div className="border border-cyan-200 bg-cyan-50/40 rounded-lg p-2 mb-3 text-[10px] leading-tight">
                  <div className="flex items-center justify-between text-cyan-900 font-bold text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <Glasses className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                      Refraction Prescription Record
                    </span>
                    <span className="text-[9px] font-sans font-normal text-cyan-800">
                      Optometrist: {safeRx.optometristName || "Dr. Staff"}
                    </span>
                  </div>

                  <div className="w-full overflow-hidden rounded border border-cyan-300">
                    <table className="w-full text-[9px] text-center border-collapse font-mono" style={{ tableLayout: "fixed" }}>
                      <thead className="bg-cyan-100 text-cyan-950 uppercase font-sans font-bold">
                        <tr>
                          <th className="py-0.5 px-1 border-r border-cyan-300 text-left pl-1.5 w-[16%]">Eye</th>
                          <th className="py-0.5 px-1 border-r border-cyan-300 w-[14%]">SPH (D)</th>
                          <th className="py-0.5 px-1 border-r border-cyan-300 w-[14%]">CYL (D)</th>
                          <th className="py-0.5 px-1 border-r border-cyan-300 w-[14%]">AXIS (°)</th>
                          <th className="py-0.5 px-1 border-r border-cyan-300 w-[14%]">ADD</th>
                          <th className="py-0.5 px-1 border-r border-cyan-300 w-[14%]">PD (Dist)</th>
                          <th className="py-0.5 px-1 w-[14%]">PD (Near)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr className="border-t border-cyan-200">
                          <td className="py-0.5 px-1 border-r border-cyan-300 font-sans font-bold text-left pl-1.5 text-cyan-950">
                            OD (Right)
                          </td>
                          <td className="py-0.5 px-1 border-r border-cyan-300 font-bold">{safeRx.formatted.od.sph}</td>
                          <td className="py-0.5 px-1 border-r border-cyan-300">{safeRx.formatted.od.cyl}</td>
                          <td className="py-0.5 px-1 border-r border-cyan-300">{safeRx.formatted.od.axis}</td>
                          <td className="py-0.5 px-1 border-r border-cyan-300 font-bold text-cyan-700">
                            {safeRx.formatted.od.add}
                          </td>
                          <td className="py-0.5 px-1 border-r border-cyan-300">{safeRx.pd_distance !== "—" ? `${safeRx.pd_distance} mm` : "—"}</td>
                          <td className="py-0.5 px-1">{safeRx.pd_near !== "—" ? `${safeRx.pd_near} mm` : "—"}</td>
                        </tr>
                        <tr className="border-t border-cyan-200">
                          <td className="py-0.5 px-1 border-r border-cyan-300 font-sans font-bold text-left pl-1.5 text-cyan-950">
                            OS (Left)
                          </td>
                          <td className="py-0.5 px-1 border-r border-cyan-300 font-bold">{safeRx.formatted.os.sph}</td>
                          <td className="py-0.5 px-1 border-r border-cyan-300">{safeRx.formatted.os.cyl}</td>
                          <td className="py-0.5 px-1 border-r border-cyan-300">{safeRx.formatted.os.axis}</td>
                          <td className="py-0.5 px-1 border-r border-cyan-300 font-bold text-cyan-700">
                            {safeRx.formatted.os.add}
                          </td>
                          <td className="py-0.5 px-1 border-r border-cyan-300">{safeRx.pd_distance !== "—" ? `${safeRx.pd_distance} mm` : "—"}</td>
                          <td className="py-0.5 px-1">{safeRx.pd_near !== "—" ? `${safeRx.pd_near} mm` : "—"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[9px] text-cyan-900 mt-1">
                    Lens Design: <strong className="uppercase">{safeRx.formatted.lensDesign}</strong>
                    {safeRx.notes && <span> • Notes: {safeRx.notes}</span>}
                  </p>
                </div>
              )}

              {/* Items Table: Fixed Layout, Exact Percentages, py-1.5 px-2 text-[11px] */}
              <div className="w-full rounded-lg border border-slate-200 overflow-hidden mb-3">
                <table className="w-full text-left text-[11px] border-collapse" style={{ tableLayout: "fixed", width: "100%" }}>
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "38%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[9px]">
                    <tr>
                      <th className="py-1.5 px-2 border-r border-slate-300 text-center" style={{ wordBreak: "break-word" }}>#</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 text-left" style={{ wordBreak: "break-word" }}>Item Description</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 text-center" style={{ wordBreak: "break-word" }}>HSN</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 text-center" style={{ wordBreak: "break-word" }}>Qty</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 text-right" style={{ wordBreak: "break-word" }}>Unit Rate</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 text-right" style={{ wordBreak: "break-word" }}>Taxable</th>
                      <th className="py-1.5 px-2 text-right min-w-[90px] whitespace-nowrap">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items?.map((it: any, idx: number) => {
                      const hsn = it.item?.type === "FRAME" ? "9003" : "9001";
                      const extra = (it.coating_charges || 0) + (it.fitting_charges || 0);
                      const taxable = it.subtotal || (it.unit_price * (it.quantity || 1) + extra);

                      return (
                        <tr key={it.id || idx}>
                          <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-[10px]" style={{ wordBreak: "break-word" }}>
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-300" style={{ wordBreak: "break-word" }}>
                            <p className="font-bold text-slate-900 leading-snug">
                              {it.item?.brand} - {it.item?.model || it.item?.type}
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono leading-tight">
                              SKU: {it.item?.sku || "—"} {it.item?.size ? `• Size: ${it.item.size}` : ""} {extra > 0 ? `• Fit/Coat: ${formatCurrency(extra)}` : ""}
                            </p>
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-[10px]" style={{ wordBreak: "break-word" }}>
                            {hsn}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold" style={{ wordBreak: "break-word" }}>
                            {it.quantity || 1}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono" style={{ wordBreak: "break-word" }}>
                            {formatCurrency(it.unit_price)}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono" style={{ wordBreak: "break-word" }}>
                            {formatCurrency(taxable)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-black font-mono min-w-[90px] whitespace-nowrap">
                            {formatCurrency(taxable)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tax Breakup & Settlement Cards: 2-column clean compact grid */}
              <div className="grid grid-cols-2 gap-3 text-[11px] mb-3">
                {/* GST Tax Breakdown Card */}
                <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-700">
                      GST Tax Breakup (Intra-State: 27)
                    </h4>
                    <span className="text-[9px] font-bold text-cyan-800 bg-cyan-100/70 px-1.5 py-0.5 rounded-full">
                      HSN 9001 / 9003
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-700">
                    <span className="text-slate-600">Taxable Value:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(taxableSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-700">
                    <span className="text-slate-600">Central GST (CGST 6%):</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-700">
                    <span className="text-slate-600">State GST (SGST 6%):</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(sgstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span className="text-slate-800 font-extrabold">Total GST Tax (12%):</span>
                    <span className="font-mono text-cyan-900 font-black">{formatCurrency(totalTax)}</span>
                  </div>
                </div>

                {/* Net Bill Settlement & Payment Ledger Card */}
                <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-1">
                  <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-700">
                      Settlement & Ledger
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {order.payments?.[0]?.method || "UPI / Counter"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-600">
                    <span>Item Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-800">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between items-center py-0.5 text-emerald-700 font-medium">
                      <span>Store Discount:</span>
                      <span className="font-mono font-bold">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-0.5 text-slate-600">
                    <span>Total Tax (GST 12%):</span>
                    <span className="font-mono font-semibold text-slate-800">+{formatCurrency(totalTax)}</span>
                  </div>

                  {/* Highlights */}
                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between items-center px-2 py-1 rounded-md bg-slate-900 text-white font-bold">
                      <span className="text-[10px] uppercase tracking-wide text-slate-300 font-bold">
                        Net Payable:
                      </span>
                      <span className="font-mono text-xs font-black text-cyan-300">
                        {formatCurrency(finalPayable)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                      <span className="text-[10px] flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        Advance Paid:
                      </span>
                      <span className="font-mono text-xs font-extrabold text-emerald-700">
                        {formatCurrency(paidAmount)}
                      </span>
                    </div>

                    <div className={`flex justify-between items-center px-2 py-1 rounded-md border font-bold ${
                      balanceDue > 0
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : "bg-slate-100 border-slate-200 text-slate-700"
                    }`}>
                      <span className={`text-[10px] ${balanceDue > 0 ? "text-rose-700" : "text-slate-600"}`}>
                        Balance Due at Pickup:
                      </span>
                      <span className={`font-mono text-xs font-extrabold ${balanceDue > 0 ? "text-rose-700" : "text-slate-800"}`}>
                        {formatCurrency(balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions and Authorized Signatory Stamp Box: Compact Footer */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-[9px] text-gray-600 mt-2">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-slate-800 uppercase text-[9px]">Terms & Conditions:</h5>
                  <p>1. 1-Year warranty against frame manufacturing defects.</p>
                  <p>2. Optical power adaptation guarantee for 14 days from delivery.</p>
                  <p>3. Custom cut lenses cannot be returned once edged and glazed.</p>
                  <p>4. Subject to Mumbai Jurisdiction only.</p>
                </div>

                <div className="flex flex-col items-end justify-between min-h-[3.5rem]">
                  <p className="font-bold text-slate-800 uppercase text-[9px]">
                    For VISIONPULSE EYEWEAR STUDIO
                  </p>
                  <div className="text-center pt-5 border-t border-slate-400 w-36">
                    <p className="font-bold text-slate-700 text-[9px]">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TEMPLATE 2: 80MM / 58MM ESC/POS COMPACT THERMAL RECEIPT  */
            /* ======================================================== */
            <div
              id="printable-invoice"
              ref={printRef}
              className="w-full max-w-[340px] bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-[11px] text-black space-y-3 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              {/* Store Branding */}
              <div className="text-center pb-2 border-b-2 border-dashed border-black">
                <h2 className="text-sm font-black tracking-wider uppercase">
                  VISIONPULSE EYEWEAR STUDIO
                </h2>
                <p className="text-[10px]">
                  Galleria Arcade, Powai, Mumbai - 400076
                </p>
                <p className="text-[10px] mt-0.5">GSTIN: 27AABCV1234F1Z8 • Tel: 98201 12345</p>
              </div>

              {/* Barcode & Bill Info */}
              <div className="text-center py-1.5 bg-slate-50 border border-slate-200 rounded">
                <p className="text-xs font-black tracking-widest">*{order.bill_no}*</p>
                <p className="text-[9px] text-slate-600 mt-0.5">{formatDateTime(order.createdAt)}</p>
              </div>

              {/* Customer */}
              <div className="space-y-1 border-b border-dashed border-black pb-2 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">CUSTOMER:</span>
                  <span className="font-black text-black">{order.customer?.name || "Walk-in Guest"}</span>
                </div>
                {order.customer?.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">PHONE:</span>
                    <span>{order.customer.phone}</span>
                  </div>
                )}
                {order.delivery_due_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">READY BY:</span>
                    <span className="font-black text-black">{formatDate(order.delivery_due_date)}</span>
                  </div>
                )}
              </div>

              {/* Brief Prescription Specs if available */}
              {safeRx.hasRx && (
                <div className="border-b border-dashed border-black pb-2 text-[10px] space-y-0.5">
                  <p className="font-black">REFRACTION RX:</p>
                  <p>OD: {safeRx.formatted.od.summary}</p>
                  <p>OS: {safeRx.formatted.os.summary}</p>
                  <p>PD: {safeRx.pd_distance !== "—" ? `${safeRx.pd_distance}mm` : "Standard"} • {safeRx.formatted.lensDesign}</p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-black pb-2">
                <div className="flex justify-between font-black text-[10px] uppercase text-slate-700">
                  <span>ITEM</span>
                  <span>AMT</span>
                </div>
                {order.items?.map((it: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold truncate max-w-[200px]">
                        {it.quantity}x {it.item?.brand} {it.item?.model || it.item?.type}
                      </span>
                      <span className="font-mono">{formatCurrency(it.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-1.5 border-b border-dashed border-black pb-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">SUBTOTAL:</span>
                  <span className="font-mono">{formatCurrency(order.total_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-emerald-800">
                    <span>DISCOUNT:</span>
                    <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[10px] text-slate-600">
                  <span>CGST (6%):</span>
                  <span className="font-mono">{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-600">
                  <span>SGST (6%):</span>
                  <span className="font-mono">{formatCurrency(sgstAmount)}</span>
                </div>
                <div className="flex justify-between items-center font-black text-xs pt-1.5 border-t border-black">
                  <span>NET PAYABLE:</span>
                  <span className="font-mono">{formatCurrency(order.final_payable)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-emerald-800">
                  <span>PAID:</span>
                  <span className="font-mono">{formatCurrency(order.paid_amount)}</span>
                </div>
                {order.balance_amount > 0 && (
                  <div className="flex justify-between items-center font-black text-xs pt-0.5 text-rose-800">
                    <span>BALANCE DUE:</span>
                    <span className="font-mono">{formatCurrency(order.balance_amount)}</span>
                  </div>
                )}
              </div>

              {/* Thermal Receipt Footer */}
              <div className="text-center pt-2 text-[9px] space-y-1">
                <p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
                <p>1-Year frame warranty against manufacturing defects.</p>
                <p className="font-mono text-[8px] text-slate-500">Powered by VisionPulse POS</p>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 4. STICKY & ACCESSIBLE MODAL FOOTER                      */}
        {/* ======================================================== */}
        <div className="sticky bottom-0 z-20 shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 bg-white/95 backdrop-blur-md flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-lg print:hidden no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>New Bill / Reset POS</span>
            </button>
            {onGoToDashboard && (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 active:scale-95 border border-cyan-200 transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
                <span>Go to Dashboard</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {order.customer?.phone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Send WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 active:scale-95 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print {printFormat === "A4_INVOICE" ? "A4 GST Invoice" : "80mm POS Slip"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
