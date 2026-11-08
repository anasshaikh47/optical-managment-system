"use client";

import { X, Glasses, ShoppingCart, Calendar, Phone, Award } from "lucide-react";
import { formatDate, formatCurrency, formatDiopter, formatAdd, formatAxis } from "@/lib/utils";

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Patient History: {customer.name}
              </h3>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <Award className="w-3 h-3" /> {customer.loyalty_points || 0} pts
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Phone: {customer.phone} {customer.email && `• ${customer.email}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Past Prescriptions Section */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase mb-3 flex items-center gap-2">
              <Glasses className="w-4 h-4 text-cyan-600" />
              Past Refraction Prescriptions ({prescriptions.length})
            </h4>

            {prescriptions.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-center">
                No previous prescriptions on record for this customer.
              </p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx: any, idx: number) => (
                  <div
                    key={rx.id || idx}
                    className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/30 dark:bg-cyan-950/20 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Optometrist: {rx.optometristName || "Dr. Staff"}
                        </span>
                        <span className="text-[10px] bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded font-bold uppercase">
                          {(rx.lens_type || "Single Vision").replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {formatDate(rx.createdAt)}
                      </span>
                    </div>

                    {/* Diopter Matrix Display */}
                    <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                      <table className="w-full text-[11px] text-center font-mono">
                        <thead>
                          <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 uppercase">
                            <th className="text-left font-sans font-bold">Eye</th>
                            <th>SPH</th>
                            <th>CYL</th>
                            <th>AXIS</th>
                            <th>ADD</th>
                            <th>PD Dist</th>
                            <th>PD Near</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                          <tr>
                            <td className="text-left font-sans font-bold text-cyan-700 py-1">OD (Right)</td>
                            <td>{formatDiopter(rx.od_sph)}</td>
                            <td>{formatDiopter(rx.od_cyl)}</td>
                            <td>{formatAxis(rx.od_axis)}</td>
                            <td className="text-cyan-600 font-bold">{formatAdd(rx.od_add)}</td>
                            <td>{rx.pd_distance || "—"}</td>
                            <td>{rx.pd_near || "—"}</td>
                          </tr>
                          <tr>
                            <td className="text-left font-sans font-bold text-cyan-700 py-1">OS (Left)</td>
                            <td>{formatDiopter(rx.os_sph)}</td>
                            <td>{formatDiopter(rx.os_cyl)}</td>
                            <td>{formatAxis(rx.os_axis)}</td>
                            <td className="text-cyan-600 font-bold">{formatAdd(rx.os_add)}</td>
                            <td>{rx.pd_distance || "—"}</td>
                            <td>{rx.pd_near || "—"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {rx.notes ? (
                        <p className="text-[10px] text-slate-500 italic truncate max-w-sm">
                          Note: {rx.notes}
                        </p>
                      ) : (
                        <div />
                      )}

                      {onSelectPrescription && (
                        <button
                          onClick={() => {
                            onSelectPrescription(rx);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
                        >
                          Copy Into Current POS Bill
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Orders Section */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Past Optical Orders ({orders.length})
            </h4>

            {orders.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-center">
                No previous purchases recorded.
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {ord.bill_no}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {ord.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(ord.createdAt)} • {ord.items?.length || 0} items
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(ord.final_payable)}
                      </p>
                      {ord.balance_amount > 0 ? (
                        <p className="text-[10px] font-bold text-rose-600">
                          Due: {formatCurrency(ord.balance_amount)}
                        </p>
                      ) : (
                        <p className="text-[10px] font-semibold text-emerald-600">
                          Paid Full
                        </p>
                      )}
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
