"use client";

import { useState } from "react";
import { X, UserPlus, Check, Phone, MapPin, Mail, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
}

export function NewCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: NewCustomerModalProps) {
  const { shopId, tenantFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    dob: "",
    loyalty_points: 50, // Welcome signup loyalty points
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError("Customer name is required.");
      return;
    }

    // Strict 10-digit mobile number validation
    const rawDigits = formData.phone.replace(/\D/g, "");
    let clean10Digits = rawDigits;

    // Handle country code prefixes
    if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
      clean10Digits = rawDigits.slice(2);
    } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
      clean10Digits = rawDigits.slice(1);
    }

    if (clean10Digits.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g. 98201 12345).");
      return;
    }

    // Standardized format: +91 98201 12345
    const formattedPhone = `+91 ${clean10Digits.slice(0, 5)} ${clean10Digits.slice(5)}`;

    setSubmitting(true);

    try {
      const res = await tenantFetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          shopId,
          userId: shopId,
          name: trimmedName,
          phone: formattedPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && (res.status === 200 || res.status === 201) && data.success) {
        // Reset form
        setFormData({
          name: "",
          phone: "",
          email: "",
          address: "",
          dob: "",
          loyalty_points: 50,
        });
        onSuccess(data.data);
      } else {
        const errMsg = data.error || `Failed to create customer in database (HTTP ${res.status})`;
        setError(errMsg);
        alert(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred while saving customer to database";
      setError(errMsg);
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Quick Patient / Customer Registration
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Add walk-in customer with immediate optical ledger activation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Patel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                <span>10-Digit Mobile <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-mono">WhatsApp</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98201 12345"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  maxLength={15}
                  className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Residential / Delivery Address</span>
            </label>
            <input
              type="text"
              placeholder="Flat/House, Street, Area, City, Pincode"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                placeholder="customer@example.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date of Birth (Optional)</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
            <span className="font-semibold">Welcome Loyalty Points Bonus:</span>
            <span className="font-bold font-mono bg-blue-200/70 px-2 py-0.5 rounded text-blue-800">
              +50 Points
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{submitting ? "Saving Patient..." : "Save Patient & Activate"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
