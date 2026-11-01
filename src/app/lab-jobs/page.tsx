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
} from "lucide-react";
import { Header } from "@/components/Header";
import { ReceiptModal } from "@/components/ReceiptModal";
import { formatDate, formatCurrency } from "@/lib/utils";

const LAB_STATUSES = [
  { key: "ALL", label: "All Workshop Jobs" },
  { key: "PENDING", label: "Pending" },
  { key: "LENS_ORDERED", label: "Lens Ordered" },
  { key: "IN_WORKSHOP", label: "In Workshop / Edging" },
  { key: "FITTING", label: "Frame Fitting" },
  { key: "QA_PASSED", label: "QA Passed / Ready" },
  { key: "COMPLETED", label: "Delivered / Done" },
];

export default function LabJobsPage() {
  const [labJobs, setLabJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLabJobs();
  }, []);

  const fetchLabJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab-jobs");
      const json = await res.json();
      if (json.success) {
        setLabJobs(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    setUpdatingId(jobId);
    try {
      const res = await fetch(`/api/lab-jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLabJobs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = labJobs.filter((job) => {
    const matchesStatus =
      activeFilter === "ALL" || job.status === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.jobNo.toLowerCase().includes(q) ||
      (job.order?.orderNumber && job.order.orderNumber.toLowerCase().includes(q)) ||
      (job.order?.customer?.name && job.order.customer.name.toLowerCase().includes(q)) ||
      (job.technicianName && job.technicianName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "QA_PASSED":
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "IN_WORKSHOP":
      case "FITTING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "LENS_ORDERED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="Optical Workshop & Glazing Tracker"
        subtitle="Lens Edging, Mounting, Quality Control & Lab Jobs"
      />

      <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Job #, Order #, patient or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
            {LAB_STATUSES.map((tab) => (
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

        {/* Lab Jobs Cards */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading workshop jobs...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              <Wrench className="w-8 h-8 mb-2 opacity-40" />
              <p>No workshop jobs found for this filter.</p>
            </div>
          ) : (
            filtered.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm font-mono">
                          {job.jobNo}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                            job.status
                          )}`}
                        >
                          {job.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Order #{job.order?.orderNumber} • Patient:{" "}
                        <strong className="text-slate-800">
                          {job.order?.customer?.name || "Walk-in Customer"}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Dates */}
                  <div className="flex items-center gap-3">
                    {job.dueDate && (
                      <div className="text-right">
                        <p className="text-slate-400 text-[10px]">Expected Completion</p>
                        <p className="font-bold text-cyan-700">
                          {formatDate(job.dueDate)}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedOrder(job.order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Job Ticket</span>
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
                      {job.frameDetails || "Customer's Own Frame"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Technician Assigned:{" "}
                      <strong className="text-slate-700">
                        {job.technicianName || "Master Glazier"}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Lens Specifications & Rx Diopters
                    </span>
                    <p className="font-mono text-slate-800 text-[11px] font-medium mt-0.5 bg-white p-2 rounded border border-slate-200">
                      {job.lensDetails || "Standard specifications"}
                    </p>
                  </div>
                </div>

                {job.instructions && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <strong>Workshop Note:</strong> {job.instructions}
                  </p>
                )}

                {/* Workflow Stage Progress Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">
                    Advance Glazing Stage:
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "PENDING", label: "Pending" },
                      { key: "LENS_ORDERED", label: "Lens Ordered" },
                      { key: "IN_WORKSHOP", label: "In Workshop" },
                      { key: "FITTING", label: "Fitting" },
                      { key: "QA_PASSED", label: "QA Passed (Ready)" },
                      { key: "COMPLETED", label: "Completed" },
                    ].map((step) => {
                      const isCurrent = job.status === step.key;
                      return (
                        <button
                          key={step.key}
                          disabled={isCurrent || updatingId === job.id}
                          onClick={() => handleUpdateStatus(job.id, step.key)}
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
            ))
          )}
        </div>
      </div>

      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
