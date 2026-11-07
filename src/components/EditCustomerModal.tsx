"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Pencil,
  Check,
  Phone,
  MapPin,
  Mail,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    dob?: string | null;
    loyalty_points?: number;
  };
  onSuccess: (updatedCustomer: any) => void;
}

export function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: EditCustomerModalProps) {
  const router = useRouter();
  const { tenantFetch } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictCustomer, setConflictCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);

  // Form state pre-filled from customer
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    dob: "",
  });

  // Re-sync form data when modal opens or customer changes
  useEffect(() => {
    if (customer && isOpen) {
      // Extract clean 10-digit phone for the input
      const rawDigits = (customer.phone || "").replace(/\D/g, "");
      const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : customer.phone || "";

      // Format DOB to YYYY-MM-DD for date input
      let dobString = "";
      if (customer.dob) {
        try {
          const d = new Date(customer.dob);
          if (!isNaN(d.getTime())) {
            dobString = d.toISOString().split("T")[0];
          }
        } catch {}
      }

      setFormData({
        name: customer.name || "",
        phone: cleanPhone,
        email: customer.email || "",
        address: customer.address || "",
        dob: dobString,
      });
      setError(null);
      setConflictCustomer(null);
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConflictCustomer(null);

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError("Customer name is required.");
      return;
    }

    // Strict 10-digit mobile validation
    const rawDigits = formData.phone.replace(/\D/g, "");
    let clean10Digits = rawDigits;
    if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
      clean10Digits = rawDigits.slice(2);
    } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
      clean10Digits = rawDigits.slice(1);
    }

    if (clean10Digits.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g. 98201 12345).");
      return;
    }

    const formattedPhone = `+91 ${clean10Digits.slice(0, 5)} ${clean10Digits.slice(5)}`;

    setSubmitting(true);

    try {
      const res = await tenantFetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: formattedPhone,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          dob: formData.dob || null,
        }),
      });

      const data = await res.json();

      if (res.status === 409 || data.error === "ALREADY_EXISTS") {
        setConflictCustomer(
          data.existingCustomer || {
            id: "",
            name: "Another Customer",
            phone: formattedPhone,
          }
        );
        setError(data.message || "Yeh mobile number pehle se doosre customer ke paas registered hai.");
        return;
      }

      if (res.ok && data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || data.message || `Failed to update customer (HTTP ${res.status})`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while updating customer profile.");
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
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Edit Customer / Patient Profile
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Update personal details, contact number & residential address
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {conflictCustomer ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-950">
                    ⚠️ Yeh mobile number pehle se doosre customer ke paas registered hai (Patient: {conflictCustomer.name}).
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Kripya doosra mobile number enter karein.
                  </p>
                </div>
              </div>
              {conflictCustomer.id && (
                <div className="pt-1 pl-7.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/customers/${conflictCustomer.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Conflicting Patient Profile</span>
                  </button>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          ) : null}

          {/* Full Name & Phone */}
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
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
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (conflictCustomer) setConflictCustomer(null);
                    if (error) setError(null);
                  }}
                  maxLength={15}
                  className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-semibold focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Address */}
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Email & DOB */}
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold bg-cyan-700 hover:bg-cyan-800 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
