"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Glasses,
  Plus,
  Search,
  User,
  Calendar,
  CheckCircle2,
  ShoppingCart,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { formatDate, formatDiopter } from "@/lib/utils";

function PrescriptionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldOpenCreate = searchParams.get("create") === "true";

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (shouldOpenCreate) {
      setIsModalOpen(true);
    }
    fetchPrescriptions();
  }, [shouldOpenCreate]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prescriptions");
      const json = await res.json();
      if (json.success) {
        setPrescriptions(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = prescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase();
    return (
      (rx.customer?.name && rx.customer.name.toLowerCase().includes(q)) ||
      (rx.customer?.phone && rx.customer.phone.includes(q)) ||
      (rx.optometristName && rx.optometristName.toLowerCase().includes(q)) ||
      (rx.lens_type && rx.lens_type.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 md:p-6 space-y-4">
        {/* Search & Statistics Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, phone, or optometrist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filtered.length}</strong> clinical prescriptions
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Prescription</span>
            </button>
          </div>
        </div>

        {/* Prescription Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading prescription database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              <Glasses className="w-8 h-8 mb-2 opacity-40" />
              <p>No prescriptions found.</p>
            </div>
          ) : (
            filtered.map((rx) => (
              <div
                key={rx.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-cyan-300 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                      <Glasses className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {rx.customer?.name}
                        </h4>
                        {rx.lens_type && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase">
                            {rx.lens_type.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone: <strong className="text-slate-800">{rx.customer?.phone}</strong></span>
                        {rx.customer?.loyalty_points > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">
                            {rx.customer.loyalty_points} pts
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px]">Optometrist</p>
                      <p className="font-semibold text-slate-800">
                        {rx.optometristName || "Dr. Priya Nair"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px]">Exam Date</p>
                      <p className="font-semibold text-slate-800">
                        {formatDate(rx.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/pos`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Order Eyewear</span>
                    </button>
                  </div>
                </div>

                {/* Optical Diopter Measurement Matrix */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[550px] text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                        <th className="p-2 border border-slate-200 text-left">Eye Designation</th>
                        <th className="p-2 border border-slate-200">Sphere (SPH)</th>
                        <th className="p-2 border border-slate-200">Cylinder (CYL)</th>
                        <th className="p-2 border border-slate-200">Axis (AXIS)</th>
                        <th className="p-2 border border-slate-200">Addition (ADD)</th>
                        <th className="p-2 border border-slate-200">PD Dist (mm)</th>
                        <th className="p-2 border border-slate-200">PD Near (mm)</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-slate-800">
                      <tr className="border-b border-slate-200">
                        <td className="p-2 border border-slate-200 font-sans font-bold text-left text-cyan-950 bg-cyan-50/40">
                          OD (Right Eye)
                        </td>
                        <td className="p-2 border border-slate-200 font-bold">
                          {formatDiopter(rx.od_sph)}
                        </td>
                        <td className="p-2 border border-slate-200">
                          {formatDiopter(rx.od_cyl)}
                        </td>
                        <td className="p-2 border border-slate-200">
                          {rx.od_axis !== null ? `${rx.od_axis}°` : "—"}
                        </td>
                        <td className="p-2 border border-slate-200 text-cyan-700 font-bold">
                          {rx.od_add ? `+${rx.od_add.toFixed(2)}` : "—"}
                        </td>
                        <td className="p-2 border border-slate-200">{rx.pd_distance || "—"}</td>
                        <td className="p-2 border border-slate-200">{rx.pd_near || "—"}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-200 font-sans font-bold text-left text-cyan-950 bg-cyan-50/40">
                          OS (Left Eye)
                        </td>
                        <td className="p-2 border border-slate-200 font-bold">
                          {formatDiopter(rx.os_sph)}
                        </td>
                        <td className="p-2 border border-slate-200">
                          {formatDiopter(rx.os_cyl)}
                        </td>
                        <td className="p-2 border border-slate-200">
                          {rx.os_axis !== null ? `${rx.os_axis}°` : "—"}
                        </td>
                        <td className="p-2 border border-slate-200 text-cyan-700 font-bold">
                          {rx.os_add ? `+${rx.os_add.toFixed(2)}` : "—"}
                        </td>
                        <td className="p-2 border border-slate-200">{rx.pd_distance || "—"}</td>
                        <td className="p-2 border border-slate-200">{rx.pd_near || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Additional Clinical Notes & Binocular PD */}
                {rx.notes && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    <strong>Optometrist Advice:</strong> {rx.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <PrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchPrescriptions()}
      />
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-xs">Loading optical records...</div>}>
      <PrescriptionsContent />
    </Suspense>
  );
}
