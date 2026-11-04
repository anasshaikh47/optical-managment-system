"use client";

import { useState, useEffect } from "react";
import { X, Glasses, Check, User, Stethoscope } from "lucide-react";
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

  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || "",
    optometristName: "Dr. Priya Nair, M.Opt",
    od_sph: "",
    od_cyl: "",
    od_axis: "",
    od_add: "",
    os_sph: "",
    os_cyl: "",
    os_axis: "",
    os_add: "",
    pd_distance: "63.0",
    pd_near: "60.0",
    lens_type: "BLUE_CUT",
    notes: "",
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
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Glasses className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                New Optical Prescription (Rx)
              </h3>
              <p className="text-[11px] text-slate-500">
                Record OD/OS diopter refraction and Pupillary Distance
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Patient and Optometrist Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Select Patient / Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                Prescribing Optometrist / Doctor
              </label>
              <input
                type="text"
                placeholder="Dr. Priya Nair, M.Opt"
                value={formData.optometristName}
                onChange={(e) => setFormData({ ...formData, optometristName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Diopter Refraction Grid */}
          <div className="border border-cyan-200 bg-cyan-50/40 rounded-xl p-4 space-y-3">
            <h4 className="text-cyan-900 font-bold text-xs uppercase tracking-wide">
              Refraction Measurements (OD / OS)
            </h4>

            {/* Right Eye (OD) */}
            <div className="bg-white p-3 rounded-lg border border-cyan-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-950 text-xs">
                  OD — Oculus Dexter (Right Eye)
                </span>
                <span className="text-[10px] text-cyan-700 font-semibold">Right Eye</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Sphere (SPH)</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-2.50"
                    value={formData.od_sph}
                    onChange={(e) => setFormData({ ...formData, od_sph: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Cylinder (CYL)</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-0.75"
                    value={formData.od_cyl}
                    onChange={(e) => setFormData({ ...formData, od_cyl: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Axis (1-180°)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="90"
                    value={formData.od_axis}
                    onChange={(e) => setFormData({ ...formData, od_axis: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Addition (ADD)</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="+1.50"
                    value={formData.od_add}
                    onChange={(e) => setFormData({ ...formData, od_add: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-cyan-700 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Left Eye (OS) */}
            <div className="bg-white p-3 rounded-lg border border-cyan-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-950 text-xs">
                  OS — Oculus Sinister (Left Eye)
                </span>
                <span className="text-[10px] text-cyan-700 font-semibold">Left Eye</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Sphere (SPH)</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-2.25"
                    value={formData.os_sph}
                    onChange={(e) => setFormData({ ...formData, os_sph: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Cylinder (CYL)</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-0.50"
                    value={formData.os_cyl}
                    onChange={(e) => setFormData({ ...formData, os_cyl: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Axis (1-180°)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="85"
                    value={formData.os_axis}
                    onChange={(e) => setFormData({ ...formData, os_axis: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Addition (ADD)</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="+1.50"
                    value={formData.os_add}
                    onChange={(e) => setFormData({ ...formData, os_add: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-cyan-700 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pupillary Distance (Distance & Near) & Lens Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                PD Distance (mm)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="63.0"
                value={formData.pd_distance}
                onChange={(e) => setFormData({ ...formData, pd_distance: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                PD Near (mm)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="60.0"
                value={formData.pd_near}
                onChange={(e) => setFormData({ ...formData, pd_near: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Lens Recommendation
              </label>
              <select
                value={formData.lens_type}
                onChange={(e) => setFormData({ ...formData, lens_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
              >
                <option value="BLUE_CUT">Blue-Cut Anti-Glare</option>
                <option value="SINGLE_VISION">Single Vision (Distance/Near)</option>
                <option value="PROGRESSIVE">Progressive Freeform</option>
                <option value="BIFOCAL">Bifocal (D-Segment/Kryptok)</option>
                <option value="PHOTOCHROMIC">Photochromic / Transitions</option>
              </select>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Clinical Advice / Glazing Guidance
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Patient has computer strain. Fit with 1.67 index blue-defense coating."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold bg-cyan-600 hover:bg-cyan-700 shadow-sm transition-colors disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? "Saving Rx..." : "Save Prescription"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
