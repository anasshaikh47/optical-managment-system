"use client";

import { useState, useRef } from "react";
import {
  Printer,
  X,
  Pill,
  MessageSquare,
  FileText,
  Receipt,
  ShieldPlus,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

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
          `• ${it.name || it.medicine?.name || it.item?.name || "Medicine"} (${it.unitType === "LOOSE_TABLET" ? "Loose Tabs" : "Strip"} x${it.quantity}) [Batch: ${it.batchNumber || "—"}] - ₹${it.subtotal}`
      )
      .join("\n");

    const message = `💊 *PHARMAPULSE CHEMIST & DRUGGIST*
Drug License: DL-20B/21B-458920 • GSTIN: 27AABCP9876F1Z2

Dear *${order.customer.name}*,
Thank you for choosing PharmaPulse! Your GST Medical Invoice is ready:

🧾 *Bill No*: #${order.bill_no}
📅 *Date*: ${formatDate(order.createdAt)}

💰 *Summary*:
• Net Payable: ₹${order.final_payable}
• Paid Amount: ₹${order.paid_amount}
• Balance Due: ₹${order.balance_amount}

📦 *Medicines Dispensed*:
${itemsSummary}

${order.prescription?.doctorName ? `👨‍⚕️ *Doctor*: ${order.prescription.doctorName}` : ""}
${order.prescription?.dosageInstructions ? `📋 *Dosage*: ${order.prescription.dosageInstructions}` : ""}

📍 *Store*: Shop 10 & 11, Central Avenue, Powai, Mumbai - 400076
📞 *Helpline*: +91 98201 12345`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const rx = order.prescription;
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
              PharmaPulse GST Tax Invoice & Dispensing Engine
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
                <span>A4 Retail GST Invoice</span>
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
                <span>80mm Thermal Slip</span>
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {printFormat === "A4_INVOICE" ? "A4" : "Slip"}</span>
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
          {/* TEMPLATE 1: STANDARD A4 GST MEDICAL TAX INVOICE          */}
          {/* ======================================================== */}
          {printFormat === "A4_INVOICE" ? (
            <div
              ref={printRef}
              className="w-full max-w-[800px] bg-white p-8 rounded-xl shadow-xs border border-slate-200 text-slate-800 font-sans text-xs space-y-4 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              {/* Header: Seller & Drug License Banner */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Pill className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-wider">
                      PHARMA<span className="text-emerald-600">PULSE</span> CHEMIST & DRUGGIST
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600">
                      High-Efficiency Pharmacy & Clinical Store ERP
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Shop 10 & 11, Central Avenue, Powai, Mumbai - 400076, Maharashtra
                    </p>
                    <p className="text-[10px] font-mono text-slate-700">
                      <strong>DL No:</strong> DL-20B/21B-458920 • <strong>GSTIN:</strong> 27AABCP9876F1Z2 • State: 27
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Tel: +91 98201 12345 • Email: billing@pharmapulse.in
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-black text-xs uppercase tracking-wider">
                    GST TAX INVOICE
                  </span>
                  <p className="font-mono font-bold text-sm text-slate-900 pt-1">
                    Invoice: #{order.bill_no}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: {formatDateTime(order.createdAt)}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Meta Grid */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Patient Details
                  </p>
                  <p className="font-extrabold text-sm text-slate-900">
                    {order.customer?.name || order.patientName || "Walk-in Patient"}
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    Phone: {order.customer?.phone || "—"}
                  </p>
                  {order.customer?.address && (
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {order.customer.address}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Prescribing Doctor
                  </p>
                  <p className="font-extrabold text-sm text-slate-900">
                    {rx?.doctorName || order.doctorName || "Registered Medical Practitioner"}
                  </p>
                  {rx?.doctorRegNo && (
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      Reg No: {rx.doctorRegNo}
                    </p>
                  )}
                  {rx?.clinicOrHospital && (
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {rx.clinicOrHospital}
                    </p>
                  )}
                </div>
              </div>

              {/* Dosage Instructions if Present */}
              {rx?.dosageInstructions && (
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                  <strong>Dosage Regimen:</strong> {rx.dosageInstructions}
                </div>
              )}

              {/* Medicines Table */}
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border border-slate-200 w-8 text-center">#</th>
                    <th className="p-2 border border-slate-200">Medicine & Generic Salt</th>
                    <th className="p-2 border border-slate-200 text-center">Batch No</th>
                    <th className="p-2 border border-slate-200 text-center">Exp Date</th>
                    <th className="p-2 border border-slate-200 text-center">HSN</th>
                    <th className="p-2 border border-slate-200 text-center">Unit</th>
                    <th className="p-2 border border-slate-200 text-center">Qty</th>
                    <th className="p-2 border border-slate-200 text-right">Rate</th>
                    <th className="p-2 border border-slate-200 text-right">GST %</th>
                    <th className="p-2 border border-slate-200 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {order.items?.map((item: any, idx: number) => {
                    const med = item.medicine || item.item;
                    return (
                      <tr key={item.id || idx}>
                        <td className="p-2 border border-slate-200 text-center font-sans">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-slate-200 font-sans">
                          <p className="font-bold text-slate-900">{item.name || med?.name || "Medicine"}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {med?.genericSaltName || med?.model || ""}
                          </p>
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold">
                          {item.batchNumber || med?.batchNumber || "—"}
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          {item.expiryDate || med?.expiryDate || "—"}
                        </td>
                        <td className="p-2 border border-slate-200 text-center text-slate-500">
                          {med?.hsnCode || "3004"}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-sans uppercase text-[10px]">
                          {item.unitType === "LOOSE_TABLET" ? "Loose" : "Strip"}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold">
                          {item.quantity}
                        </td>
                        <td className="p-2 border border-slate-200 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="p-2 border border-slate-200 text-right">
                          {item.gstRate || 12}%
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Calculation Ledger */}
              <div className="flex justify-between items-start pt-2">
                <div className="w-1/2 text-[10px] text-slate-500 space-y-1">
                  <p><strong>Terms & Conditions:</strong></p>
                  <p>1. Schedule H medicines dispensed strictly under registered medical advice.</p>
                  <p>2. Please check batch number & seal before leaving the pharmacy counter.</p>
                  <p>3. Goods once sold can only be returned within 48 hours with original invoice.</p>
                </div>

                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-mono">{formatCurrency(taxableSubtotal)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>CGST:</span>
                    <span className="font-mono">{formatCurrency(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>SGST:</span>
                    <span className="font-mono">{formatCurrency(sgstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-300">
                    <span>Net Invoice Amount:</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(order.final_payable)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-xs font-semibold pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatCurrency(order.paid_amount)}</span>
                  </div>
                  {order.balance_amount > 0 && (
                    <div className="flex justify-between text-rose-600 text-xs font-bold">
                      <span>Balance Due:</span>
                      <span className="font-mono">{formatCurrency(order.balance_amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-center text-slate-600 text-[10px]">
                <div>
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span>Customer&apos;s Signature</span>
                </div>
                <div>
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <span className="font-bold">For PHARMAPULSE CHEMIST</span>
                  <p className="text-[9px] text-slate-400">(Registered Pharmacist)</p>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TEMPLATE 2: 80MM POS THERMAL COUNTER RECEIPT             */
            /* ======================================================== */
            <div
              ref={printRef}
              className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-[11px] text-black space-y-3.5 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              <div className="text-center pb-2 border-b-2 border-dashed border-black">
                <h2 className="text-sm font-black tracking-wider uppercase">
                  PHARMAPULSE CHEMIST
                </h2>
                <p className="text-[10px] font-sans font-semibold">
                  DRUG LICENSE: DL-20B/21B-458920
                </p>
                <p className="text-[9px]">
                  Central Avenue, Powai, Mumbai • Tel: 98201 12345
                </p>
              </div>

              <div className="space-y-1 text-[10px] border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>BILL NO:</span>
                  <span className="font-bold">{order.bill_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PATIENT:</span>
                  <span className="font-bold">{order.customer?.name || order.patientName || "Walk-in"}</span>
                </div>
                {order.prescription?.doctorName && (
                  <div className="flex justify-between">
                    <span>DOCTOR:</span>
                    <span>{order.prescription.doctorName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2 border-b border-dashed border-black pb-2">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="truncate max-w-[200px]">{item.name || item.medicine?.name}</span>
                      <span>₹{item.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>B:{item.batchNumber || "—"} E:{item.expiryDate || "—"}</span>
                      <span>{item.quantity} x ₹{item.unit_price}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>₹{order.total_amount}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span>DISCOUNT:</span>
                    <span>-₹{order.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (TAX):</span>
                  <span>₹{order.tax_amount}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-black">
                  <span>NET PAYABLE:</span>
                  <span>₹{order.final_payable}</span>
                </div>
                <div className="flex justify-between font-bold pt-0.5">
                  <span>PAID:</span>
                  <span>₹{order.paid_amount}</span>
                </div>
                {order.balance_amount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>BALANCE:</span>
                    <span>₹{order.balance_amount}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 border-t-2 border-dashed border-black text-[9px]">
                <p>Thank you for visiting PharmaPulse!</p>
                <p>Check batch & expiry before use.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
