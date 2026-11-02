"use client";

import { useState, useRef } from "react";
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
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, formatDiopter } from "@/lib/utils";

interface ReceiptModalProps {
  order: any;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const [printFormat, setPrintFormat] = useState<"A4_INVOICE" | "THERMAL_80MM">("A4_INVOICE");
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!order.customer?.phone) return;
    let cleanPhone = order.customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const itemsSummary = order.items
      ?.map(
        (it: any) =>
          `• ${it.item ? `${it.item.brand} - ${it.item.model || it.item.type}` : "Eyewear Item"} (x${it.quantity}) - ₹${it.subtotal}`
      )
      .join("\n");

    const deliveryFormatted = order.delivery_due_date
      ? new Date(order.delivery_due_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "2 Days";

    let rxSummary = "";
    if (order.prescription) {
      const rx = order.prescription;
      rxSummary = `\n👁️ *Prescription Specs*:
• OD (Right): SPH ${formatDiopter(rx.od_sph)} | CYL ${formatDiopter(rx.od_cyl)} x ${rx.od_axis || 0}° ${rx.od_add ? `| ADD +${rx.od_add.toFixed(2)}` : ""}
• OS (Left): SPH ${formatDiopter(rx.os_sph)} | CYL ${formatDiopter(rx.os_cyl)} x ${rx.os_axis || 0}° ${rx.os_add ? `| ADD +${rx.os_add.toFixed(2)}` : ""}
• Lens Type: ${(rx.lens_type || "Single Vision").replace("_", " ")}
• PD: ${rx.pd_distance || "63"}mm`;
    }

    const message = `👓 *VISIONPULSE EYEWEAR STUDIO*
Precision Clinical Optometry & Premium Eyewear

Dear *${order.customer.name}*,
Thank you for your order! Here are your GST Tax Invoice & Lab Job details:

🧾 *Bill / Job Order*: #${order.bill_no}
📅 *Ready for Delivery*: ${deliveryFormatted}

💰 *Payment Breakdown*:
• Net Payable: ₹${order.final_payable}
• Advance Received: ₹${order.paid_amount}
• Balance Due at Pickup: ₹${order.balance_amount}

📦 *Items*:
${itemsSummary}
${rxSummary}

📍 *Store Location*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Helpline*: +91 98201 12345`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const rx = order.prescription;

  // Calculate CGST and SGST amounts (half of tax_amount each for intra-state Maharashtra 27)
  const totalTax = order.tax_amount || 0;
  const cgstAmount = totalTax / 2;
  const sgstAmount = totalTax / 2;
  const taxableSubtotal = Math.max(0, order.total_amount - (order.discount_amount || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 ${
          printFormat === "A4_INVOICE" ? "max-w-4xl" : "max-w-md"
        }`}
      >
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50 print:hidden gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-slate-800 text-sm">
              Optical Print & Tax Invoicing Engine
            </h3>
          </div>

          {/* Format Toggle: Standard A4 vs 80mm POS Thermal */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat("A4_INVOICE")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  printFormat === "A4_INVOICE"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4 GST Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("THERMAL_80MM")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  printFormat === "THERMAL_80MM"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm POS Receipt</span>
              </button>
            </div>

            {order.customer?.phone && (
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {printFormat === "A4_INVOICE" ? "A4" : "Receipt"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:bg-white print:p-0 print:m-0">
          {/* ======================================================== */}
          {/* TEMPLATE 1: STANDARD A4 GST TAX INVOICE                 */}
          {/* ======================================================== */}
          {printFormat === "A4_INVOICE" ? (
            <div
              ref={printRef}
              className="w-full max-w-[800px] bg-white p-8 rounded-xl shadow-xs border border-slate-200 text-slate-800 font-sans text-xs space-y-4 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              {/* Header: Seller & Invoice Banner */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Glasses className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-wider">
                      VISION<span className="text-cyan-600">PULSE</span> EYEWEAR STUDIO
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600">
                      Precision Clinical Optometry & Premium Eyewear
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Galleria Arcade, Powai, Mumbai - 400076, Maharashtra
                    </p>
                    <p className="text-[10px] font-mono text-slate-700">
                      <strong>GSTIN:</strong> 27AABCV1234F1Z8 • <strong>State Code:</strong> 27 (Maharashtra)
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Tel: +91 98201 12345 • Email: billing@visionpulse.in
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded">
                    TAX INVOICE
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1.5">
                    Invoice No: {order.bill_no}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Date: {formatDateTime(order.createdAt)}
                  </p>
                  {order.delivery_due_date && (
                    <p className="text-[11px] font-bold text-cyan-800 mt-0.5">
                      Promised Ready: {formatDate(order.delivery_due_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Two-Column Seller & Buyer Tax Information */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    Bill To / Patient Details:
                  </h4>
                  <p className="font-bold text-slate-900 text-sm">
                    {order.customer ? order.customer.name : "Walk-in Retail Guest"}
                  </p>
                  <p className="font-mono text-slate-700 mt-0.5">
                    Phone: {order.customer?.phone || "—"}
                  </p>
                  {order.customer?.email && (
                    <p className="text-slate-600">{order.customer.email}</p>
                  )}
                  {order.customer?.address && (
                    <p className="text-slate-600">{order.customer.address}</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Place of Supply: <strong>Maharashtra (27)</strong>
                  </p>
                </div>

                <div className="text-right">
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    Invoice & Payment Status:
                  </h4>
                  <p className="font-mono text-xs">
                    Order Status: <strong className="uppercase">{order.status.replace("_", " ")}</strong>
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Payment Type: {order.balance_amount === 0 ? "Full Payment Settled" : "Advance Deposit"}
                  </p>
                  <p className="text-slate-600 font-mono">
                    Payment Method: {order.payments?.[0]?.method || "UPI / Counter"}
                  </p>
                </div>
              </div>

              {/* Optical Prescription Matrix Table (If attached) */}
              {rx && (
                <div className="border border-cyan-200 bg-cyan-50/40 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-cyan-900 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <Glasses className="w-3.5 h-3.5 text-cyan-700" />
                      Refraction Prescription Record
                    </span>
                    <span className="text-[10px] font-sans">
                      Optometrist: {rx.optometristName || "Dr. Staff"}
                    </span>
                  </div>

                  <table className="w-full text-[10px] text-center border-collapse border border-cyan-300 font-mono">
                    <thead className="bg-cyan-100 text-cyan-950 uppercase font-sans font-bold">
                      <tr>
                        <th className="p-1 border border-cyan-300 text-left pl-2">Eye</th>
                        <th className="p-1 border border-cyan-300">SPH (D)</th>
                        <th className="p-1 border border-cyan-300">CYL (D)</th>
                        <th className="p-1 border border-cyan-300">AXIS (°)</th>
                        <th className="p-1 border border-cyan-300">ADD</th>
                        <th className="p-1 border border-cyan-300">PD (Dist)</th>
                        <th className="p-1 border border-cyan-300">PD (Near)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="p-1 border border-cyan-300 font-sans font-bold text-left pl-2 text-cyan-950">
                          OD (Right)
                        </td>
                        <td className="p-1 border border-cyan-300 font-bold">{formatDiopter(rx.od_sph)}</td>
                        <td className="p-1 border border-cyan-300">{formatDiopter(rx.od_cyl)}</td>
                        <td className="p-1 border border-cyan-300">{rx.od_axis !== null ? `${rx.od_axis}°` : "—"}</td>
                        <td className="p-1 border border-cyan-300 font-bold text-cyan-700">
                          {rx.od_add ? `+${rx.od_add.toFixed(2)}` : "—"}
                        </td>
                        <td className="p-1 border border-cyan-300">{rx.pd_distance || "—"} mm</td>
                        <td className="p-1 border border-cyan-300">{rx.pd_near || "—"} mm</td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-cyan-300 font-sans font-bold text-left pl-2 text-cyan-950">
                          OS (Left)
                        </td>
                        <td className="p-1 border border-cyan-300 font-bold">{formatDiopter(rx.os_sph)}</td>
                        <td className="p-1 border border-cyan-300">{formatDiopter(rx.os_cyl)}</td>
                        <td className="p-1 border border-cyan-300">{rx.os_axis !== null ? `${rx.os_axis}°` : "—"}</td>
                        <td className="p-1 border border-cyan-300 font-bold text-cyan-700">
                          {rx.os_add ? `+${rx.os_add.toFixed(2)}` : "—"}
                        </td>
                        <td className="p-1 border border-cyan-300">{rx.pd_distance || "—"} mm</td>
                        <td className="p-1 border border-cyan-300">{rx.pd_near || "—"} mm</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-[10px] text-cyan-900">
                    Lens Design: <strong className="uppercase">{(rx.lens_type || "Single Vision").replace("_", " ")}</strong>
                    {rx.notes && <span> • Notes: {rx.notes}</span>}
                  </p>
                </div>
              )}

              {/* Line Items Table with HSN, Rates, CGST/SGST Breakdown */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-8">#</th>
                      <th className="p-2 border-r border-slate-300">Item Description</th>
                      <th className="p-2 border-r border-slate-300 text-center">HSN</th>
                      <th className="p-2 border-r border-slate-300 text-center">Qty</th>
                      <th className="p-2 border-r border-slate-300 text-right">Unit Rate</th>
                      <th className="p-2 border-r border-slate-300 text-right">Fitting/Coating</th>
                      <th className="p-2 border-r border-slate-300 text-right">Taxable Val</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items?.map((it: any, idx: number) => {
                      const hsn = it.item?.type === "FRAME" ? "9003" : "9001";
                      const extra = (it.coating_charges || 0) + (it.fitting_charges || 0);

                      return (
                        <tr key={it.id || idx}>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-300">
                            <p className="font-bold text-slate-900 leading-tight">
                              {it.item?.brand} - {it.item?.model || it.item?.type}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              SKU: {it.item?.sku} {it.item?.size && `• Size: ${it.item.size}`}
                            </p>
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono text-[10px]">
                            {hsn}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">
                            {it.quantity}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">
                            {formatCurrency(it.unit_price)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono text-slate-500">
                            {extra > 0 ? formatCurrency(extra) : "—"}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">
                            {formatCurrency(it.subtotal)}
                          </td>
                          <td className="p-2 text-right font-black font-mono">
                            {formatCurrency(it.subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tax Breakup & Financial Totals */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* GST Tax Breakdown Table */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5 text-[11px]">
                  <h4 className="font-bold text-[10px] uppercase text-slate-600 border-b border-slate-200 pb-1">
                    GST Tax Breakup (Intra-State: Maharashtra 27)
                  </h4>
                  <div className="flex justify-between">
                    <span>Taxable Goods Value:</span>
                    <span className="font-mono">{formatCurrency(taxableSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST 6%):</span>
                    <span className="font-mono font-bold">{formatCurrency(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST 6%):</span>
                    <span className="font-mono font-bold">{formatCurrency(sgstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Tax Amount (12%):</span>
                    <span className="font-mono">{formatCurrency(totalTax)}</span>
                  </div>
                </div>

                {/* Net Bill Ledger */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Item Subtotal:</span>
                    <span className="font-mono">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Privilege Discount:</span>
                      <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Total GST:</span>
                    <span className="font-mono">{formatCurrency(totalTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                    <span>Final Net Payable:</span>
                    <span className="font-mono text-cyan-800 text-base">
                      {formatCurrency(order.final_payable)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Amount Received:</span>
                    <span className="font-mono">{formatCurrency(order.paid_amount)}</span>
                  </div>
                  {order.balance_amount > 0 && (
                    <div className="flex justify-between text-rose-700 font-black bg-rose-50 p-1.5 rounded">
                      <span>Balance Due at Pickup:</span>
                      <span className="font-mono">{formatCurrency(order.balance_amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms & Conditions and Authorized Signatory Stamp Box */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-[10px]">
                <div className="space-y-1 text-slate-600">
                  <h5 className="font-bold text-slate-800 uppercase">Terms & Conditions:</h5>
                  <p>1. 1-Year warranty against frame manufacturing defects.</p>
                  <p>2. Optical power adaptation guarantee for 14 days from delivery.</p>
                  <p>3. Custom cut lenses cannot be returned once edged and glazed.</p>
                  <p>4. Subject to Mumbai Jurisdiction only.</p>
                </div>

                <div className="flex flex-col items-end justify-between h-24">
                  <p className="font-bold text-slate-800 uppercase">
                    For VISIONPULSE EYEWEAR STUDIO
                  </p>
                  <div className="text-center pt-8 border-t border-slate-400 w-44">
                    <p className="font-bold text-slate-700">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TEMPLATE 2: 80MM / 58MM ESC/POS COMPACT THERMAL RECEIPT  */
            /* ======================================================== */
            <div
              ref={printRef}
              className="w-full max-w-[320px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-[11px] text-black space-y-3 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
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
              <div className="text-center py-1 bg-slate-50 border border-slate-200 rounded">
                <p className="text-xs font-black tracking-widest">*{order.bill_no}*</p>
                <p className="text-[9px] text-slate-600">{formatDateTime(order.createdAt)}</p>
              </div>

              {/* Customer */}
              <div className="space-y-0.5 border-b border-dashed border-black pb-2 text-[10px]">
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-black">{order.customer?.name || "Walk-in Guest"}</span>
                </div>
                {order.customer?.phone && (
                  <div className="flex justify-between">
                    <span>PHONE:</span>
                    <span>{order.customer.phone}</span>
                  </div>
                )}
                {order.delivery_due_date && (
                  <div className="flex justify-between">
                    <span>READY BY:</span>
                    <span className="font-black">{formatDate(order.delivery_due_date)}</span>
                  </div>
                )}
              </div>

              {/* Brief Prescription Specs if available */}
              {rx && (
                <div className="border-b border-dashed border-black pb-2 text-[10px] space-y-0.5">
                  <p className="font-black">REFRACTION RX:</p>
                  <p>OD: SPH {formatDiopter(rx.od_sph)} | CYL {formatDiopter(rx.od_cyl)} x {rx.od_axis || 0}°</p>
                  <p>OS: SPH {formatDiopter(rx.os_sph)} | CYL {formatDiopter(rx.os_cyl)} x {rx.os_axis || 0}°</p>
                  <p>PD: {rx.pd_distance || 63}mm • {rx.lens_type?.replace("_", " ") || "Single Vision"}</p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-black pb-2">
                <div className="flex justify-between font-black text-[10px] uppercase">
                  <span>ITEM</span>
                  <span>AMT</span>
                </div>
                {order.items?.map((it: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold truncate max-w-[200px]">
                        {it.quantity}x {it.item?.brand} {it.item?.model || it.item?.type}
                      </span>
                      <span>{formatCurrency(it.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-1 border-b border-dashed border-black pb-2 text-[11px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span>DISCOUNT:</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>CGST (6%):</span>
                  <span>{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>SGST (6%):</span>
                  <span>{formatCurrency(sgstAmount)}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
                  <span>NET PAYABLE:</span>
                  <span>{formatCurrency(order.final_payable)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>PAID:</span>
                  <span>{formatCurrency(order.paid_amount)}</span>
                </div>
                {order.balance_amount > 0 && (
                  <div className="flex justify-between font-black text-xs pt-0.5">
                    <span>BALANCE DUE:</span>
                    <span>{formatCurrency(order.balance_amount)}</span>
                  </div>
                )}
              </div>

              {/* Thermal Receipt Footer */}
              <div className="text-center pt-2 text-[9px] space-y-1">
                <p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
                <p>1-Year frame warranty against manufacturing defects.</p>
                <p className="font-mono text-[8px] text-slate-500">Power by VisionPulse POS</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          {order.customer?.phone && (
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print {printFormat === "A4_INVOICE" ? "A4 GST Invoice" : "80mm POS Slip"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
