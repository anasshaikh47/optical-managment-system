"use client";

import { useState, useEffect } from "react";
import {
  Pill,
  Search,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
  FileText,
  Stethoscope,
  Printer,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ThermalJobSlipModal } from "@/components/ThermalJobSlipModal";
import { formatDate, formatCurrency, getExpiryStatus } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const DISPENSING_STAGES = [
  { key: "ALL", label: "All Dispensing Orders" },
  { key: "PLACED", label: "New Prescription Orders" },
  { key: "PROCESSING", label: "Rx Verification & Packing" },
  { key: "READY_FOR_PICKUP", label: "Ready at Counter" },
  { key: "DELIVERED", label: "Dispensed to Patient" },
];

export default function DispensingQueuePage() {
  const { shopId, tenantFetch } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDispensingOrders();
  }, [shopId]);

  const fetchDispensingOrders = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch("/api/orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await tenantFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDispensingOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus =
      activeFilter === "ALL" || o.status === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.bill_no.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.customer?.phone && o.customer.phone.includes(q)) ||
      (o.prescription?.doctorName && o.prescription.doctorName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "READY_FOR_PICKUP":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "PROCESSING":
      case "FITTING":
      case "LENS_PROCESSING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 md:p-6 space-y-4">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Bill No, patient name, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
            {DISPENSING_STAGES.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeFilter === tab.key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dispensing Cards */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading pharmacy dispensing queue...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              <Pill className="w-8 h-8 mb-2 opacity-40 text-teal-600" />
              <p>No orders currently in this dispensing stage.</p>
            </div>
          ) : (
            filtered.map((ord) => {
              const rx = ord.prescription;
              const items = ord.items || [];

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm font-mono">
                            {ord.bill_no}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(
                              ord.status
                            )}`}
                          >
                            {ord.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Patient:{" "}
                          <strong className="text-slate-800">
                            {ord.customer?.name || "Walk-in Guest"}
                          </strong>{" "}
                          ({ord.customer?.phone || "—"})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSlipOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-teal-600" />
                        <span>Dispensing Slip</span>
                      </button>
                      <button
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Tax Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Doctor & Rx Details */}
                  {rx && (
                    <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">
                            Dr. {rx.doctorName || "Registered Physician"}
                            {rx.doctorRegNo && (
                              <span className="font-mono text-teal-800 font-normal ml-1">
                                (Reg: {rx.doctorRegNo})
                              </span>
                            )}
                          </p>
                          {rx.clinicOrHospital && (
                            <p className="text-[11px] text-slate-600">{rx.clinicOrHospital}</p>
                          )}
                        </div>
                      </div>
                      {rx.dosageInstructions && (
                        <div className="text-[11px] bg-white px-2.5 py-1 rounded border border-teal-200 font-medium text-teal-900">
                          <strong>Dosage: </strong> {rx.dosageInstructions}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medicines to Dispense */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Prescribed Medicines & Batches to Dispense ({items.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {items.map((item: any, idx: number) => {
                        const med = item.medicine || item.item || {};
                        const name = med.name || med.brand || "Medicine Item";
                        const salt = med.genericSaltName || med.model || "";
                        const batch = item.batchNumber || med.batchNumber || "B-101";
                        const exp = item.expiryDate || med.expiryDate || "";
                        const expiry = getExpiryStatus(exp);

                        return (
                          <div
                            key={idx}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 truncate">{name}</span>
                                <span className="font-mono font-bold text-teal-700 shrink-0">
                                  {item.quantity} {item.unitType === "LOOSE_TABLET" ? "tabs" : "units"}
                                </span>
                              </div>
                              {salt && (
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{salt}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] pt-1.5 mt-1.5 border-t border-slate-100 font-mono">
                              <span className="text-slate-600">B: {batch}</span>
                              {exp && (
                                <span className={`px-1 py-0.2 rounded border font-bold ${expiry.badgeClass}`}>
                                  {exp}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Advance Dispensing Workflow Stage */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      Update Dispensing Stage:
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "PLACED", label: "Placed" },
                        { key: "PROCESSING", label: "Rx Verification" },
                        { key: "READY_FOR_PICKUP", label: "Ready at Counter" },
                        { key: "DELIVERED", label: "Dispensed" },
                      ].map((step) => {
                        const isCurrent = ord.status === step.key;
                        return (
                          <button
                            key={step.key}
                            disabled={isCurrent || updatingId === ord.id}
                            onClick={() => handleUpdateStatus(ord.id, step.key)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                              isCurrent
                                ? "bg-slate-900 text-white shadow-xs cursor-default"
                                : "bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-800"
                            }`}
                          >
                            {step.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedSlipOrder && (
        <ThermalJobSlipModal
          order={selectedSlipOrder}
          onClose={() => setSelectedSlipOrder(null)}
        />
      )}

      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}