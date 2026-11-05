"use client";

import { X, FileText, ShoppingCart, Calendar, Phone, Award, Pill } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSelectPrescription?: (rx: any) => void;
}

export function CustomerHistoryModal({
  isOpen,
  onClose,
  customer,
  onSelectPrescription,
}: CustomerHistoryModalProps) {
  if (!isOpen || !customer) return null;

  const prescriptions = customer.prescriptions || [];
  const orders = customer.orders || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Patient Medical History: {customer.name}
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                <Award className="w-3 h-3" /> {customer.loyalty_points || 0} pts
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Phone: {customer.phone} {customer.email && `• ${customer.email}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Past Prescriptions Section */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Doctor Prescriptions ({prescriptions.length})
            </h4>

            {prescriptions.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                No previous doctor prescriptions on record for this patient.
              </p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx: any, idx: number) => (
                  <div
                    key={rx.id || idx}
                    className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {rx.doctorName || "Dr. Registered Practitioner"}
                        </span>
                        {rx.clinicOrHospital && (
                          <span className="text-slate-500 text-xs ml-2">
                            • {rx.clinicOrHospital}
                          </span>
                        )}
                        {rx.doctorRegNo && (
                          <span className="text-slate-400 text-[10px] font-mono ml-2">
                            (Reg: {rx.doctorRegNo})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {formatDate(rx.createdAt)}
                      </span>
                    </div>

                    {rx.dosageInstructions && (
                      <div className="p-2.5 bg-white rounded-lg border border-purple-100 text-purple-950 font-medium">
                        <strong>Dosage Regimen:</strong> {rx.dosageInstructions}
                      </div>
                    )}

                    {rx.notes && (
                      <p className="text-[11px] text-slate-600 italic">
                        <strong>Advice:</strong> {rx.notes}
                      </p>
                    )}

                    {onSelectPrescription && (
                      <button
                        onClick={() => {
                          onSelectPrescription(rx);
                          onClose();
                        }}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                      >
                        Copy this Rx to current bill →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Orders & Medical Bills Section */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              Past Medical Bills & Counter Dispenses ({orders.length})
            </h4>

            {orders.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                No previous bills recorded for this patient.
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 font-mono">
                        #{order.bill_no}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(order.createdAt)} • {order.items?.length || 1} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-slate-900">
                        {formatCurrency(order.final_payable)}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.balance_amount === 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.balance_amount === 0 ? "PAID" : `DUE: ${formatCurrency(order.balance_amount)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
