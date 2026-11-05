"use client";

import { useRef } from "react";
import { Printer, X, Pill, Check, AlertTriangle, Calendar, Phone, Clock, Stethoscope } from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

interface ThermalJobSlipModalProps {
  order: any;
  onClose: () => void;
}

export function ThermalJobSlipModal({ order, onClose }: ThermalJobSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const rx = order.prescription;
  const items = order.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Pharmacy Dispensing Slip (80mm Thermal)
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
                PHARMAPULSE MEDICAL & POS
              </h2>
              <p className="text-[10px] font-sans font-semibold">
                PHARMACY DISPENSING COUNTER TOKEN
              </p>
              <p className="text-[9px] mt-0.5">
                DL: DL-20B/21B-458920 • GSTIN: 27AABCV1234F1Z8
              </p>
              <p className="text-[9px]">
                Main Hospital Road • Emergency Desk: +91 98201 12345
              </p>
            </div>

            {/* Barcode Banner */}
            <div className="text-center py-1 bg-slate-50 rounded border border-slate-200">
              <div className="tracking-[3px] text-xs font-black select-none">
                ||| | |||| | ||||| | ||| |||| | ||
              </div>
              <p className="text-xs font-bold font-mono tracking-widest mt-0.5">
                *{order.bill_no}*
              </p>
            </div>

            {/* Token Metadata */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span className="font-sans font-bold">TOKEN / BILL:</span>
                <span className="font-black text-xs">{order.bill_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans font-bold">DATE & TIME:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans font-bold">PATIENT:</span>
                <span className="font-bold uppercase">
                  {order.customer ? order.customer.name : "Walk-in Patient"}
                </span>
              </div>
              {order.customer?.phone && (
                <div className="flex justify-between">
                  <span className="font-sans font-bold">PHONE:</span>
                  <span>{order.customer.phone}</span>
                </div>
              )}
              {order.customer?.age && (
                <div className="flex justify-between">
                  <span className="font-sans font-bold">PATIENT AGE:</span>
                  <span>{order.customer.age} Yrs</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-sans font-bold">STATUS:</span>
                <span className="font-black uppercase">{order.status.replace("_", " ")}</span>
              </div>
            </div>

            {/* Doctor & Rx Details */}
            {rx && (
              <div className="space-y-1 border-b border-dashed border-black pb-2 text-[10px]">
                <div className="flex items-center gap-1 font-black">
                  <Stethoscope className="w-3 h-3" />
                  <span>PRESCRIPTION DETAILS</span>
                </div>
                {rx.doctorName && (
                  <div className="flex justify-between">
                    <span className="font-sans font-bold">DOCTOR:</span>
                    <span>Dr. {rx.doctorName}</span>
                  </div>
                )}
                {rx.clinicOrHospital && (
                  <div className="flex justify-between">
                    <span className="font-sans font-bold">CLINIC/HOSPITAL:</span>
                    <span>{rx.clinicOrHospital}</span>
                  </div>
                )}
                {rx.doctorRegNo && (
                  <div className="flex justify-between">
                    <span className="font-sans font-bold">REG NO:</span>
                    <span>{rx.doctorRegNo}</span>
                  </div>
                )}
                {rx.dosageInstructions && (
                  <div className="bg-slate-50 p-1 border border-slate-300 rounded text-[9px] mt-1">
                    <span className="font-bold">DOSAGE REGIMEN: </span>
                    {rx.dosageInstructions}
                  </div>
                )}
              </div>
            )}

            {/* Prescribed Medicines to Dispense */}
            <div className="space-y-1.5 border-b border-dashed border-black pb-2 text-[10px]">
              <div className="flex justify-between font-black uppercase text-[10px]">
                <span>MEDICINES TO DISPENSE</span>
                <span>QTY</span>
              </div>

              {items.map((item: any, idx: number) => {
                const med = item.medicine || item.item || {};
                const name = med.name || med.brand || "Medicine Item";
                const salt = med.genericSaltName || med.model || "";
                const batch = item.batchNumber || med.batchNumber || "B-101";
                const exp = item.expiryDate || med.expiryDate || "";
                const rack = med.rackLocation ? `Rack: ${med.rackLocation}` : "";

                return (
                  <div key={idx} className="border-b border-dotted border-slate-300 pb-1">
                    <div className="flex justify-between font-bold">
                      <span>{name}</span>
                      <span>{item.quantity} {item.unitType === "LOOSE_TABLET" ? "tabs" : "units"}</span>
                    </div>
                    {salt && <p className="text-[9px] text-slate-600">{salt}</p>}
                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                      <span>Batch: {batch} {exp && `• Exp: ${exp}`}</span>
                      <span>{rack}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-2">
              <div className="flex justify-between">
                <span>NET PAYABLE:</span>
                <span>{formatCurrency(order.final_payable)}</span>
              </div>
              <div className="flex justify-between">
                <span>AMOUNT PAID:</span>
                <span>{formatCurrency(order.paid_amount)}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-0.5">
                <span>BALANCE DUE:</span>
                <span>{formatCurrency(order.balance_amount)}</span>
              </div>
            </div>

            {/* Pharmacist Verification Pass */}
            <div className="space-y-1.5 pt-1 text-[9px]">
              <span className="font-black uppercase text-[10px]">
                REGISTERED PHARMACIST DISPENSING CHECKLIST
              </span>
              <div className="space-y-1 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-black inline-block" />
                  <span>Batch Number & Expiry Date Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-black inline-block" />
                  <span>Dosage, Caution & Timing Instructions Affixed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-black inline-block" />
                  <span>Schedule H / Rx Register Entry Recorded</span>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-end">
                <div>
                  <p className="text-[8px] text-slate-500">DISPENSED DATE</p>
                  <p className="font-bold">___ / ___ / 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-500">PHARMACIST SIGNATURE</p>
                  <p className="font-bold">____________________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[8px] border-t border-dotted border-black">
              PharmaPulse ERP • Keep medicines out of reach of children
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