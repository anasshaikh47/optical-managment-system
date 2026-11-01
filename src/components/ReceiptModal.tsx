"use client";

import { useRef } from "react";
import { Printer, X, CheckCircle2, Glasses, Calendar, Phone, MapPin } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

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
  const isSpectacleJob = order.orderType === "PRESCRIPTION_SPECS" || !!rx || !!order.labJob;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Sales Receipt & Optical Job Slip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
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
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">
              LUMINA VISION STUDIO
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Bespoke Eyewear & Clinical Optometry
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              428 Park Avenue, New York, NY • Tel: +1 (555) 382-7740
            </p>
          </div>

          {/* Order & Customer Metadata */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
            <div>
              <p className="text-slate-500 font-medium">Invoice Number:</p>
              <p className="font-bold text-slate-900 text-xs">{order.orderNumber}</p>
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
              {order.deliveryDate && (
                <p className="text-cyan-700 font-bold mt-1">
                  Est. Ready: {formatDate(order.deliveryDate)}
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
                  Prescription Specifications ({rx.prescriptionNo})
                </span>
                {rx.pdTotal && (
                  <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-[10px]">
                    PD: {rx.pdTotal} mm
                  </span>
                )}
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
                      <th className="p-1 border border-cyan-200">VA</th>
                      <th className="p-1 border border-cyan-200">PD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-cyan-200 font-mono font-medium text-slate-800">
                      <td className="p-1 border border-cyan-200 font-sans font-bold text-left text-cyan-950">
                        OD (Right)
                      </td>
                      <td className="p-1 border border-cyan-200">
                        {rx.sphOd !== null && rx.sphOd !== undefined ? rx.sphOd.toFixed(2) : "0.00"}
                      </td>
                      <td className="p-1 border border-cyan-200">
                        {rx.cylOd !== null && rx.cylOd !== undefined ? rx.cylOd.toFixed(2) : "0.00"}
                      </td>
                      <td className="p-1 border border-cyan-200">{rx.axisOd ?? "—"}°</td>
                      <td className="p-1 border border-cyan-200">
                        {rx.addOd ? `+${rx.addOd.toFixed(2)}` : "—"}
                      </td>
                      <td className="p-1 border border-cyan-200">{rx.vaOd || "—"}</td>
                      <td className="p-1 border border-cyan-200">{rx.pdOd || "—"}</td>
                    </tr>
                    <tr className="font-mono font-medium text-slate-800">
                      <td className="p-1 border border-cyan-200 font-sans font-bold text-left text-cyan-950">
                        OS (Left)
                      </td>
                      <td className="p-1 border border-cyan-200">
                        {rx.sphOs !== null && rx.sphOs !== undefined ? rx.sphOs.toFixed(2) : "0.00"}
                      </td>
                      <td className="p-1 border border-cyan-200">
                        {rx.cylOs !== null && rx.cylOs !== undefined ? rx.cylOs.toFixed(2) : "0.00"}
                      </td>
                      <td className="p-1 border border-cyan-200">{rx.axisOs ?? "—"}°</td>
                      <td className="p-1 border border-cyan-200">
                        {rx.addOs ? `+${rx.addOs.toFixed(2)}` : "—"}
                      </td>
                      <td className="p-1 border border-cyan-200">{rx.vaOs || "—"}</td>
                      <td className="p-1 border border-cyan-200">{rx.pdOs || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-semibold text-[10px] uppercase">
                  <th className="py-1.5">Description</th>
                  <th className="py-1.5 text-center">Qty</th>
                  <th className="py-1.5 text-right">Price</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2 pr-2">
                      <p className="font-semibold text-slate-900 leading-tight">
                        {item.itemName}
                      </p>
                      {item.customDetails && (
                        <p className="text-[10px] text-slate-500 italic">
                          {item.customDetails}
                        </p>
                      )}
                    </td>
                    <td className="py-2 text-center font-medium text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 text-right font-bold text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied:</span>
                <span className="font-semibold">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax ({order.taxRate}%):</span>
              <span className="font-semibold">{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-cyan-700">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(order.paidAmount)}</span>
            </div>
            {order.balanceAmount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded">
                <span>Balance Due at Pickup:</span>
                <span>{formatCurrency(order.balanceAmount)}</span>
              </div>
            )}
          </div>

          {/* Payment & Lab Notes */}
          <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3 space-y-1">
            <div className="flex justify-between font-medium">
              <span>Payment Status: <strong className="text-slate-800">{order.paymentStatus}</strong></span>
              <span>Order Status: <strong className="text-slate-800">{order.status}</strong></span>
            </div>
            {order.labJob && (
              <p className="bg-slate-100 p-2 rounded text-slate-700 font-mono text-[10px]">
                Workshop Job: {order.labJob.jobNo} • Status: {order.labJob.status}
              </p>
            )}
            <p className="text-center pt-2 text-slate-400 italic">
              Thank you for trusting Lumina Vision Studio for your optical needs!
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
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
