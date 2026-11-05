"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, Check, Camera, User, Stethoscope, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (prescription: any) => void;
  preselectedCustomerId?: string;
}

export function PrescriptionModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomerId,
}: PrescriptionModalProps) {
  const { shopId, tenantFetch } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || "",
    patientName: "",
    patientAge: "34",
    doctorName: "Dr. Sandeep Deshmukh, MD",
    clinicOrHospital: "Apollo Clinic & Diagnostic Center",
    doctorRegNo: "MCI-48921",
    dosageInstructions: "Augmentin 625 (1-0-1 After Meals), Dolo 650 (1-0-1 as needed)",
    notes: "Take after meals. Complete full 5-day antibiotic course.",
    prescriptionImage: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      if (preselectedCustomerId) {
        setFormData((prev) => ({ ...prev, customerId: preselectedCustomerId }));
      }
    }
  }, [isOpen, preselectedCustomerId]);

  const fetchCustomers = async () => {
    try {
      const res = await tenantFetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        prescriptionImage: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setError("Please select a patient / customer.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await tenantFetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, shopId, userId: shopId }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || "Failed to save prescription");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                New Doctor Prescription (Rx)
              </h3>
              <p className="text-[11px] text-slate-500">
                Log registered doctor prescription, dosage regimen & Schedule H compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Selection & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Select Patient / Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const selId = e.target.value;
                  const c = customers.find((cust) => cust.id === selId);
                  setFormData({
                    ...formData,
                    customerId: selId,
                    patientName: c ? c.name : "",
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              >
                <option value="">-- Choose Patient --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Patient Age (Yrs)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.patientAge}
                onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono"
                placeholder="e.g. 34"
              />
            </div>
          </div>

          {/* Doctor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Prescribing Doctor Name *
              </label>
              <input
                type="text"
                required
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                placeholder="Dr. Sandeep Deshmukh, MD"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Clinic / Hospital Name
              </label>
              <input
                type="text"
                value={formData.clinicOrHospital}
                onChange={(e) => setFormData({ ...formData, clinicOrHospital: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                placeholder="Apollo Diagnostic Clinic"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Doctor Reg. No. (MCI / State)
              </label>
              <input
                type="text"
                value={formData.doctorRegNo}
                onChange={(e) => setFormData({ ...formData, doctorRegNo: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                placeholder="MCI-48921"
              />
            </div>
          </div>

          {/* Dosage Schedule */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Dosage Instructions (Morning - Afternoon - Night e.g. 1-0-1, Before/After Meals)
            </label>
            <input
              type="text"
              value={formData.dosageInstructions}
              onChange={(e) => setFormData({ ...formData, dosageInstructions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              placeholder="e.g. 1-0-1 After Meals (Morning & Night)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Pharmacist Instructions & Clinical Advice
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              placeholder="e.g. Complete 5-day course. Do not consume alcohol during medication."
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Prescription Document / Photo (Upload)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-3 text-center cursor-pointer bg-slate-50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleImageFile(e.target.files[0])}
                className="hidden"
              />
              <p className="text-xs text-slate-600 font-medium">Click to upload prescription image</p>
              {formData.prescriptionImage && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1">Image loaded successfully</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-xs"
            >
              {submitting ? "Saving..." : "Save Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
