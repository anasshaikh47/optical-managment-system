"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  User,
  Calendar,
  CheckCircle2,
  ShoppingCart,
  ChevronRight,
  Stethoscope,
  Building,
  Pill,
} from "lucide-react";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function PrescriptionsContent() {
  const { shopId, tenantFetch } = useAuth();
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
  }, [shouldOpenCreate, shopId]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch("/api/prescriptions");
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
    const patientName = (rx.patientName || rx.customer?.name || "").toLowerCase();
    const phone = rx.customer?.phone || "";
    const doctor = (rx.doctorName || "").toLowerCase();
    const clinic = (rx.clinicOrHospital || "").toLowerCase();
    const regNo = (rx.doctorRegNo || "").toLowerCase();
    return (
      patientName.includes(q) ||
      phone.includes(q) ||
      doctor.includes(q) ||
      clinic.includes(q) ||
      regNo.includes(q)
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
              placeholder="Search by patient, phone, doctor, or clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filtered.length}</strong> doctor prescriptions
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Doctor Rx</span>
            </button>
          </div>
        </div>

        {/* Prescription Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading doctor prescriptions registry...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 mb-2 opacity-40 text-teal-600" />
              <p>No doctor prescriptions found.</p>
            </div>
          ) : (
            filtered.map((rx) => {
              const patientName = rx.patientName || rx.customer?.name || "Walk-in Patient";
              const patientAge = rx.patientAge || rx.customer?.age;
              const doctor = rx.doctorName ? `Dr. ${rx.doctorName}` : "Registered Physician";

              return (
                <div
                  key={rx.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {patientName}
                          </h4>
                          {patientAge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {patientAge} Yrs
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                            Doctor Rx
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone: <strong className="text-slate-800">{rx.customer?.phone || "—"}</strong></span>
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
                        <p className="text-slate-400 text-[10px]">Prescribing Doctor</p>
                        <p className="font-semibold text-slate-800 flex items-center gap-1 justify-end">
                          <span>{doctor}</span>
                          {rx.doctorRegNo && (
                            <span className="text-[10px] text-teal-600 font-mono">({rx.doctorRegNo})</span>
                          )}
                        </p>
                        {rx.clinicOrHospital && (
                          <p className="text-[10px] text-slate-500">{rx.clinicOrHospital}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[10px]">Date Recorded</p>
                        <p className="font-semibold text-slate-800">
                          {formatDate(rx.createdAt)}
                        </p>
                      </div>

                      <button
                        onClick={() => router.push(`/pos?customerId=${rx.customerId || rx.customer?.id || ""}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-teal-400" />
                        <span>Dispense Bill</span>
                      </button>
                    </div>
                  </div>

                  {/* Dosage Regimen & Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-teal-600" />
                        <span>Dosage Schedule & Regimen</span>
                      </p>
                      <p className="font-semibold text-slate-800">
                        {rx.dosageInstructions || "Standard therapeutic dosage as prescribed by doctor."}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hospital / Clinic Reference</span>
                      </p>
                      <p className="font-semibold text-slate-800">
                        {rx.clinicOrHospital || "Private Clinic Consultation"}
                        {rx.doctorRegNo && (
                          <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                            Medical Council Reg: {rx.doctorRegNo}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Clinical Advice & Diagnosis Notes */}
                  {rx.notes && (
                    <div className="text-xs text-slate-600 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100 italic">
                      <strong className="text-teal-900 not-italic">Clinical Advice & Diagnosis: </strong> {rx.notes}
                    </div>
                  )}
                </div>
              );
            })
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
    <Suspense fallback={<div className="p-8 text-slate-400 text-xs">Loading doctor prescription records...</div>}>
      <PrescriptionsContent />
    </Suspense>
  );
}