"use client";

import { useRef } from "react";
import { Printer, X, Glasses, CheckCircle2, Phone, MapPin, IndianRupee } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, formatDiopter } from "@/lib/utils";

interface ReceiptModalProps {
  order: any;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const rx = order.prescription;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-semibold text-slate-800 text-sm">
              GST Tax Invoice & Optical Job Slip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          ref={printRef}
          className="p-8 overflow-y-auto text-slate-800 font-sans text-xs space-y-5 print:p-0 print:m-0"
        >
          {/* Store Branding */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-600 text-white mb-2 shadow-xs">
              <Glasses className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-wider">
              VISION<span className="text-cyan-600">PULSE</span> EYEWEAR STUDIO
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Precision Clinical Optometry & Premium Eyewear
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Galleria Arcade, Powai, Mumbai - 400076 • Tel: +91 98201 12345
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              GSTIN: 27AABCV1234F1Z8
            </p>
          </div>

          {/* Order & Customer Metadata */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
            <div>
              <p className="text-slate-500 font-medium">Tax Invoice / Bill No:</p>
              <p className="font-bold text-slate-900 text-xs font-mono">{order.bill_no}</p>
              <p className="text-slate-500 mt-1 font-medium">Date & Time:</p>
              <p className="font-semibold text-slate-800">{formatDateTime(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Customer / Patient:</p>
              <p className="font-bold text-slate-900 text-xs">
                {order.customer ? order.customer.name : "Walk-in Retail Guest"}
              </p>
              {order.customer?.phone && (
                <p className="text-slate-600 font-medium">{order.customer.phone}</p>
              )}
              {order.delivery_due_date && (
                <p className="text-cyan-700 font-bold mt-1">
                  Ready By: {formatDate(order.delivery_due_date)}
                </p>
              )}
            </div>
          </div>

          {/* Optical Prescription Table (If attached) */}
          {rx && (
            <div className="border border-cyan-200 bg-cyan-50/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-cyan-900 font-bold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Glasses className="w-3.5 h-3.5 text-cyan-700" />
                  Prescription Refraction Record
                </span>
                <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-[10px]">
                  Optom: {rx.optometristName || "Dr. Priya Nair"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-center border-collapse">
                  <thead>
                    <tr className="bg-cyan-100/70 text-cyan-900 uppercase font-semibold">
                      <th className="p-1 border border-cyan-200 text-left">Eye</th>
                      <th className="p-1 border border-cyan-200">SPH</th>
                      <th className="p-1 border border-cyan-200">CYL</th>
                      <th className="p-1 border border-cyan-200">AXIS</th>
                      <th className="p-1 border border-cyan-200">ADD</th>
                      <th className="p-1 border border-cyan-200">PD (Dist)</th>
                      <th className="p-1 border border-cyan-200">PD (Near)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-cyan-200 font-mono font-medium text-slate-800">
                      <td className="p-1 border border-cyan-200 font-sans font-bold text-left text-cyan-950">
                        OD (Right)
                      </td>
                      <td className="p-1 border border-cyan-200">{formatDiopter(rx.od_sph)}</td>
                      <td className="p-1 border border-cyan-200">{formatDiopter(rx.od_cyl)}</td>
                      <td className="p-1 border border-cyan-200">{rx.od_axis !== null ? `${rx.od_axis}°` : "—"}</td>
                      <td className="p-1 border border-cyan-200 text-cyan-700 font-bold">
                        {rx.od_add ? `+${rx.od_add.toFixed(2)}` : "—"}
                      </td>
                      <td className="p-1 border border-cyan-200">{rx.pd_distance || "—"}</td>
                      <td className="p-1 border border-cyan-200">{rx.pd_near || "—"}</td>
                    </tr>
                    <tr className="font-mono font-medium text-slate-800">
                      <td className="p-1 border border-cyan-200 font-sans font-bold text-left text-cyan-950">
                        OS (Left)
                      </td>
                      <td className="p-1 border border-cyan-200">{formatDiopter(rx.os_sph)}</td>
                      <td className="p-1 border border-cyan-200">{formatDiopter(rx.os_cyl)}</td>
                      <td className="p-1 border border-cyan-200">{rx.os_axis !== null ? `${rx.os_axis}°` : "—"}</td>
                      <td className="p-1 border border-cyan-200 text-cyan-700 font-bold">
                        {rx.os_add ? `+${rx.os_add.toFixed(2)}` : "—"}
                      </td>
                      <td className="p-1 border border-cyan-200">{rx.pd_distance || "—"}</td>
                      <td className="p-1 border border-cyan-200">{rx.pd_near || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {rx.lens_type && (
                <p className="text-[10px] text-cyan-800">
                  Recommended Lens Type: <strong className="uppercase">{rx.lens_type.replace("_", " ")}</strong>
                </p>
              )}
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-semibold text-[10px] uppercase">
                  <th className="py-1.5">Item & Specs</th>
                  <th className="py-1.5 text-center">Qty</th>
                  <th className="py-1.5 text-right">Rate</th>
                  <th className="py-1.5 text-right">Fitting/Coating</th>
                  <th className="py-1.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item: any, idx: number) => {
                  const name = item.item ? `${item.item.brand} - ${item.item.model || item.item.type}` : "Optical Item";
                  const extra = (item.coating_charges || 0) + (item.fitting_charges || 0);
                  return (
                    <tr key={idx} className="py-2">
                      <td className="py-2 pr-2">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {name}
                        </p>
                        {item.item?.size && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            Size: {item.item.size} • Color: {item.item.color}
                          </p>
                        )}
                      </td>
                      <td className="py-2 text-center font-medium text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-700">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-500">
                        {extra > 0 ? formatCurrency(extra) : "—"}
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal:</span>
              <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Privilege:</span>
                <span className="font-semibold">-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST (12%):</span>
              <span className="font-semibold">{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Net Payable:</span>
              <span className="text-cyan-700">{formatCurrency(order.final_payable)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Amount Received:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(order.paid_amount)}</span>
            </div>
            {order.balance_amount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded">
                <span>Balance Due at Delivery:</span>
                <span>{formatCurrency(order.balance_amount)}</span>
              </div>
            )}
          </div>

          {/* Payment History & Status */}
          <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3 space-y-1">
            <div className="flex justify-between font-medium">
              <span>Order Tracking: <strong className="text-slate-800 uppercase">{order.status.replace("_", " ")}</strong></span>
              <span>
                Payments Made:{" "}
                <strong className="text-slate-800">
                  {order.payments?.map((p: any) => `${p.method} (${formatCurrency(p.amount)})`).join(", ") || "None"}
                </strong>
              </span>
            </div>
            <p className="text-center pt-2 text-slate-400 italic">
              1-Year frame warranty covers manufacturing defects. Thank you for choosing VisionPulse Eyewear Studio!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
