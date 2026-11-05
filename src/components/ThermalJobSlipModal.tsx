"use client";

import { useRef, useEffect } from "react";
import { Printer, X, Glasses, Check, AlertTriangle, Calendar, Phone, Clock, Wrench } from "lucide-react";
import { formatDate, formatDateTime, formatCurrency, formatDiopter } from "@/lib/utils";

interface ThermalJobSlipModalProps {
  order: any;
  onClose: () => void;
}

export function ThermalJobSlipModal({ order, onClose }: ThermalJobSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const rx = order.prescription;
  const frameItem = order.items?.find((i: any) => i.item?.type === "FRAME")?.item;
  const lensItem = order.items?.find((i: any) => i.item?.type === "LENS")?.item;
  const allItems = order.items || [];

  // Check if delivery due today or overdue
  const todayStr = new Date().toISOString().split("T")[0];
  const orderDueStr = order.delivery_due_date
    ? new Date(order.delivery_due_date).toISOString().split("T")[0]
    : null;
  const isDueToday = orderDueStr === todayStr;
  const isOverdue = orderDueStr && orderDueStr < todayStr && order.status !== "DELIVERED";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Workshop Lab Ticket (80mm Thermal)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable 80mm Thermal Slip Body */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-100 print:bg-white print:p-0">
          <div
            ref={printRef}
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-[11px] text-black space-y-3.5 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b-2 border-dashed border-black">
              <h2 className="text-sm font-black tracking-wider uppercase">
                VISIONPULSE OPTICAL LAB
              </h2>
              <p className="text-[10px] font-sans font-semibold">
                PRECISION LENS GLAZING & WORKSHOP TICKET
              </p>
              <p className="text-[9px] mt-0.5">
                Galleria Arcade, Powai, Mumbai • Tel: 98201 12345
              </p>
            </div>

            {/* Simulated Barcode Banner */}
            <div className="text-center py-1 bg-slate-50 rounded border border-slate-200">
              <div className="tracking-[3px] text-xs font-black select-none">
                ||| | |||| | ||||| | ||| |||| | ||
              </div>
              <p className="text-xs font-bold font-mono tracking-widest mt-0.5">
                *{order.bill_no}*
              </p>
            </div>

            {/* Urgency Alert if Due Today or Overdue */}
            {(isDueToday || isOverdue) && (
              <div className="text-center py-1 px-2 border-2 border-black font-black uppercase text-xs">
                {isOverdue ? "⚠️ OVERDUE RUSH JOB" : "⚡ PROMISED DUE TODAY"}
              </div>
            )}

            {/* Job Metadata */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span className="font-sans font-bold">BILL NO:</span>
                <span className="font-black text-xs">{order.bill_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans font-bold">BOOKED AT:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans font-bold">PROMISED READY:</span>
                <span className="font-black underline">
                  {order.delivery_due_date ? formatDate(order.delivery_due_date) : "Express (2 Days)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans font-bold">PATIENT:</span>
                <span className="font-bold uppercase">
                  {order.customer ? order.customer.name : "Walk-in Guest"}
                </span>
              </div>
              {order.customer?.phone && (
                <div className="flex justify-between">
                  <span className="font-sans font-bold">CONTACT:</span>
                  <span>{order.customer.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-sans font-bold">CURRENT STATUS:</span>
                <span className="font-black uppercase">{order.status.replace("_", " ")}</span>
              </div>
            </div>

            {/* Eye Prescription Power Matrix (OD & OS) */}
            {rx ? (
              <div className="space-y-1.5 border-b border-dashed border-black pb-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-[10px] uppercase">
                    OPTICAL POWER MATRIX
                  </span>
                  <span className="text-[9px]">
                    Optom: {rx.optometristName || "Dr. Staff"}
                  </span>
                </div>

                <table className="w-full text-center border border-black text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-100 font-black">
                      <th className="p-0.5 border-r border-black text-left pl-1">EYE</th>
                      <th className="p-0.5 border-r border-black">SPH</th>
                      <th className="p-0.5 border-r border-black">CYL</th>
                      <th className="p-0.5 border-r border-black">AXIS</th>
                      <th className="p-0.5">ADD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black font-bold">
                      <td className="p-0.5 border-r border-black text-left pl-1 font-black">OD (R)</td>
                      <td className="p-0.5 border-r border-black">{formatDiopter(rx.od_sph)}</td>
                      <td className="p-0.5 border-r border-black">{formatDiopter(rx.od_cyl)}</td>
                      <td className="p-0.5 border-r border-black">{rx.od_axis !== null ? `${rx.od_axis}°` : "—"}</td>
                      <td className="p-0.5">{rx.od_add ? `+${rx.od_add.toFixed(2)}` : "—"}</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="p-0.5 border-r border-black text-left pl-1 font-black">OS (L)</td>
                      <td className="p-0.5 border-r border-black">{formatDiopter(rx.os_sph)}</td>
                      <td className="p-0.5 border-r border-black">{formatDiopter(rx.os_cyl)}</td>
                      <td className="p-0.5 border-r border-black">{rx.os_axis !== null ? `${rx.os_axis}°` : "—"}</td>
                      <td className="p-0.5">{rx.os_add ? `+${rx.os_add.toFixed(2)}` : "—"}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Pupillary Distance & Design */}
                <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
                  <div>
                    <span className="font-bold">PD (Distance):</span>{" "}
                    <strong>{rx.pd_distance ? `${rx.pd_distance} mm` : "63.0 mm"}</strong>
                  </div>
                  <div>
                    <span className="font-bold">PD (Near):</span>{" "}
                    <strong>{rx.pd_near ? `${rx.pd_near} mm` : "60.0 mm"}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold">LENS DESIGN:</span>{" "}
                    <strong className="uppercase">
                      {(rx.lens_type || "Single Vision").replace("_", " ")}
                    </strong>
                  </div>
                </div>

                {rx.notes && (
                  <div className="text-[9px] bg-slate-50 p-1 border border-slate-300 rounded mt-1">
                    <span className="font-black">RX NOTE:</span> {rx.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-center py-2 border-b border-dashed border-black italic">
                NO PRESCRIPTION (OVER-THE-COUNTER / RETAIL GLAZING)
              </div>
            )}

            {/* Frame & Mounting Details */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-black pb-2">
              <span className="font-black uppercase text-[10px]">
                FRAME & MOUNTING SPECIFICATIONS
              </span>
              {frameItem ? (
                <div className="space-y-0.5">
                  <p>
                    <span className="font-bold">BRAND:</span>{" "}
                    <strong>{frameItem.brand}</strong>
                  </p>
                  <p>
                    <span className="font-bold">MODEL:</span>{" "}
                    <strong>{frameItem.model || frameItem.sku}</strong>
                  </p>
                  <p>
                    <span className="font-bold">COLOR / SIZE:</span>{" "}
                    {frameItem.color || "Standard"} • {frameItem.size || "52-18-140"}
                  </p>
                </div>
              ) : (
                <p className="italic text-slate-500">
                  Customer&apos;s Own Frame (B.Y.O.F) / Retail Eyewear
                </p>
              )}
            </div>

            {/* Lens Material, Index & Coating Details */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-black pb-2">
              <span className="font-black uppercase text-[10px]">
                LENS & COATING SPECIFICATIONS
              </span>
              {lensItem ? (
                <div className="space-y-0.5">
                  <p>
                    <span className="font-bold">LENS:</span>{" "}
                    <strong>{lensItem.brand} - {lensItem.model || "Power Lens"}</strong>
                  </p>
                  <p>
                    <span className="font-bold">REFRACTIVE INDEX:</span>{" "}
                    <strong>Index {lensItem.lens_index || "1.56 Mid-Index"}</strong>
                  </p>
                </div>
              ) : null}

              {/* Order Item Extra Charges breakdown */}
              {allItems.map((it: any, idx: number) => {
                const coating = it.coating_charges || 0;
                const fitting = it.fitting_charges || 0;
                if (coating === 0 && fitting === 0) return null;
                return (
                  <div key={idx} className="text-[9px]">
                    {coating > 0 && <div>• COATING APPLIED: Blue-Cut / Anti-Glare (+₹{coating})</div>}
                    {fitting > 0 && <div>• LAB FITTING: Precision Edging (+₹{fitting})</div>}
                  </div>
                );
              })}
            </div>

            {/* Financial Summary & Balance Alert */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span>NET BILL AMOUNT:</span>
                <span>{formatCurrency(order.final_payable)}</span>
              </div>
              <div className="flex justify-between">
                <span>ADVANCE RECEIVED:</span>
                <span>{formatCurrency(order.paid_amount)}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-0.5">
                <span>BALANCE AT DELIVERY:</span>
                <span>{formatCurrency(order.balance_amount)}</span>
              </div>
            </div>

            {/* Workshop Technician QA Checkpoints & Sign-off */}
            <div className="space-y-1.5 pt-1 text-[9px]">
              <span className="font-black uppercase text-[10px]">
                TECHNICIAN WORKSHOP QA PASS
              </span>
              <div className="space-y-1 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-black inline-block" />
                  <span>Lens Edged & Optical Axis Calibrated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-black inline-block" />
                  <span>Bevel / Groove Mount Securely Fitted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-black inline-block" />
                  <span>Ultrasonic Cleaned & Pantoscopic Tilt Checked</span>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-end">
                <div>
                  <p className="text-[8px] text-slate-500">QA STAMP / DATE</p>
                  <p className="font-bold">___ / ___ / 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-500">TECHNICIAN SIGNATURE</p>
                  <p className="font-bold">____________________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[8px] border-t border-dotted border-black">
              VisionPulse Optical ERP • Powered by Automated Lab Engine
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print 80mm Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
