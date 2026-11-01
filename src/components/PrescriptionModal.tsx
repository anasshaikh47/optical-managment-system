"use client";

import { useState, useEffect } from "react";
import { X, Glasses, Check, User, Stethoscope } from "lucide-react";

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
  const [customers, setCustomers] = useState<any[]>([]);
  const [optometrists, setOptometrists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || "",
    optometristId: "",
    // Right Eye (OD)
    sphOd: "",
    cylOd: "",
    axisOd: "",
    addOd: "",
    vaOd: "20/20",
    pdOd: "",
    // Left Eye (OS)
    sphOs: "",
    cylOs: "",
    axisOs: "",
    addOs: "",
    vaOs: "20/20",
    pdOs: "",
    // General
    pdTotal: "",
    lensType: "Single Vision",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchMeta();
      if (preselectedCustomerId) {
        setFormData((prev) => ({ ...prev, customerId: preselectedCustomerId }));
      }
    }
  }, [isOpen, preselectedCustomerId]);

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const [custRes, optRes] = await Promise.all([
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/optometrists").then((r) => r.json()),
      ]);
      if (custRes.success) setCustomers(custRes.data);
      if (optRes.success) {
        setOptometrists(optRes.data);
        if (optRes.data.length > 0 && !formData.optometristId) {
          setFormData((prev) => ({ ...prev, optometristId: optRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
                Record clinical refraction measurements and diopters
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
                    {c.name} ({c.phone || c.customerCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Prescribing Optometrist / Doctor
              </label>
              <select
                value={formData.optometristId}
                onChange={(e) => setFormData({ ...formData, optometristId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="">-- Choose Optometrist --</option>
                {optometrists.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} {o.licenseNumber ? `(${o.licenseNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Diopter Refraction Grid */}
          <div className="border border-cyan-200 bg-cyan-50/40 rounded-xl p-4 space-y-3">
            <h4 className="text-cyan-900 font-bold text-xs uppercase tracking-wide">
              Refraction Measurements
            </h4>

            {/* Right Eye (OD) */}
            <div className="bg-white p-3 rounded-lg border border-cyan-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-950 text-xs">
                  OD — Oculus Dexter (Right Eye)
                </span>
                <span className="text-[10px] text-cyan-700 font-medium">Right</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">SPH</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-2.50"
                    value={formData.sphOd}
                    onChange={(e) => setFormData({ ...formData, sphOd: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">CYL</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-0.75"
                    value={formData.cylOd}
                    onChange={(e) => setFormData({ ...formData, cylOd: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">AXIS (°)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="90"
                    value={formData.axisOd}
                    onChange={(e) => setFormData({ ...formData, axisOd: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">ADD</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="+1.50"
                    value={formData.addOd}
                    onChange={(e) => setFormData({ ...formData, addOd: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">VA</label>
                  <input
                    type="text"
                    placeholder="20/20"
                    value={formData.vaOd}
                    onChange={(e) => setFormData({ ...formData, vaOd: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">PD (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="31.5"
                    value={formData.pdOd}
                    onChange={(e) => setFormData({ ...formData, pdOd: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
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
                <span className="text-[10px] text-cyan-700 font-medium">Left</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">SPH</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-2.25"
                    value={formData.sphOs}
                    onChange={(e) => setFormData({ ...formData, sphOs: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">CYL</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="-0.50"
                    value={formData.cylOs}
                    onChange={(e) => setFormData({ ...formData, cylOs: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">AXIS (°)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="85"
                    value={formData.axisOs}
                    onChange={(e) => setFormData({ ...formData, axisOs: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">ADD</label>
                  <input
                    type="number"
                    step="0.25"
                    placeholder="+1.50"
                    value={formData.addOs}
                    onChange={(e) => setFormData({ ...formData, addOs: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">VA</label>
                  <input
                    type="text"
                    placeholder="20/20"
                    value={formData.vaOs}
                    onChange={(e) => setFormData({ ...formData, vaOs: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">PD (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="31.0"
                    value={formData.pdOs}
                    onChange={(e) => setFormData({ ...formData, pdOs: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lens Recommendation & Binocular PD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Total Binocular PD (mm)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="62.5"
                value={formData.pdTotal}
                onChange={(e) => setFormData({ ...formData, pdTotal: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Recommended Lens Category
              </label>
              <select
                value={formData.lensType}
                onChange={(e) => setFormData({ ...formData, lensType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              >
                <option value="Single Vision">Single Vision</option>
                <option value="Single Vision Blue-Cut">Single Vision Blue-Cut</option>
                <option value="Progressive High-Index">Progressive High-Index</option>
                <option value="Progressive Freeform">Progressive Freeform</option>
                <option value="Bifocal Flat-Top">Bifocal Flat-Top</option>
                <option value="Office / Occupational">Office / Occupational</option>
                <option value="Photochromic / Transitions">Photochromic / Transitions</option>
              </select>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Optometrist Remarks / Fitting Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Recommend anti-reflective coating for night driving. Pupil height 18mm."
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
