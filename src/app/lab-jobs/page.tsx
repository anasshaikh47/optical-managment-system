"use client";

import { useState, useEffect } from "react";
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
  FileText,
  Glasses,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { formatDate, formatCurrency, formatDiopter } from "@/lib/utils";

const WORKSHOP_STAGES = [
  { key: "ALL", label: "All Workshop Jobs" },
  { key: "PLACED", label: "New Order" },
  { key: "LENS_PROCESSING", label: "Lens Edging / Lab" },
  { key: "FITTING", label: "Frame Fitting" },
  { key: "READY_FOR_PICKUP", label: "QA Passed / Ready" },
  { key: "DELIVERED", label: "Delivered to Patient" },
];

export default function LabJobsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkshopOrders();
  }, []);

  const fetchWorkshopOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success) {
        // Show orders that have prescriptions or spectacles processing
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
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchWorkshopOrders();
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
      (o.customer?.phone && o.customer.phone.includes(q));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "READY_FOR_PICKUP":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
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
              placeholder="Search by Bill No, patient name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
            {WORKSHOP_STAGES.map((tab) => (
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

        {/* Workshop Cards */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading workshop jobs...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              <Wrench className="w-8 h-8 mb-2 opacity-40" />
              <p>No spectacle orders currently in this workshop stage.</p>
            </div>
          ) : (
            filtered.map((ord) => {
              const rx = ord.prescription;
              const frameItem = ord.items?.find((i: any) => i.item?.type === "FRAME");
              const lensItem = ord.items?.find((i: any) => i.item?.type === "LENS");

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Wrench className="w-5 h-5" />
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
                            {ord.customer?.name}
                          </strong>{" "}
                          ({ord.customer?.phone})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {ord.delivery_due_date && (
                        <div className="text-right">
                          <p className="text-slate-400 text-[10px]">Expected Completion</p>
                          <p className="font-bold text-cyan-700">
                            {formatDate(ord.delivery_due_date)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Job Slip</span>
                      </button>
                    </div>
                  </div>

                  {/* Eyewear Glazing Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Frame Mounting Details
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {frameItem ? `${frameItem.item?.brand} - ${frameItem.item?.model || frameItem.item?.sku}` : "Customer Frame"}
                      </p>
                      {frameItem?.item?.size && (
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Size: {frameItem.item.size} • Color: {frameItem.item.color}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Lens Specifications & Refraction Diopters
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {lensItem ? `${lensItem.item?.brand} - ${lensItem.item?.model || "Power Lens"}` : "Standard Power Lens"}
                      </p>
                      {rx ? (
                        <p className="font-mono text-cyan-900 text-[10px] font-bold mt-1 bg-white p-1.5 rounded border border-cyan-200">
                          OD: {formatDiopter(rx.od_sph)}/{formatDiopter(rx.od_cyl)}x{rx.od_axis || 0}° | OS: {formatDiopter(rx.os_sph)}/{formatDiopter(rx.os_cyl)}x{rx.os_axis || 0}° | PD: {rx.pd_distance || "—"}mm
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">Over-the-counter / Plano fitting</p>
                      )}
                    </div>
                  </div>

                  {/* Advance Glazing Workflow Stage */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      Update Workshop Stage:
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "PLACED", label: "Placed" },
                        { key: "LENS_PROCESSING", label: "Lens Processing" },
                        { key: "FITTING", label: "Fitting" },
                        { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
                        { key: "DELIVERED", label: "Delivered" },
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
                                : "bg-slate-100 text-slate-700 hover:bg-cyan-100 hover:text-cyan-800"
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

      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
