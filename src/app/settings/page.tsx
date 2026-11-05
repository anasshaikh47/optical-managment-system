"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Check, Store, Receipt, Pill, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { shopId, tenantFetch } = useAuth();
  const [settings, setSettings] = useState<any>({
    storeName: "PharmaPulse Medical & POS",
    tagline: "High-Efficiency Pharmacy & Prescription Dispensing ERP",
    phone: "+91 98201 12345",
    email: "care@pharmapulse.in",
    address: "Shop 4 & 5, Medical Arcade, Main Hospital Road, Powai, Mumbai - 400076",
    gstin: "27AABCV1234F1Z8",
    dlNumber: "DL-20B/21B-458920",
    pharmacistName: "Dr. Ramesh Joshi (Reg: RPh-98421)",
    currencySymbol: "₹",
    currencyCode: "INR",
    defaultGstRate: 12.0,
    receiptFooter:
      "Medicines once sold will be exchanged within 7 days in original sealed pack with bill. Refrigerated products & loose tablets non-returnable. Store below 25°C. Keep out of reach of children.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [shopId]);

  const fetchSettings = async () => {
    try {
      const res = await tenantFetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await tenantFetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, shopId, userId: shopId }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 max-w-4xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>PharmaPulse pharmacy terminal settings successfully saved!</span>
            </div>
          )}

          {/* Pharmacy Identity & Drug License */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Pill className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Pharmacy Identity & Drug License Profile
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Pharmacy / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName || ""}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tagline / Brand Subtitle
                </label>
                <input
                  type="text"
                  value={settings.tagline || ""}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Drug License Number (DL No)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-20B/21B-458920"
                  value={settings.dlNumber || ""}
                  onChange={(e) => setSettings({ ...settings, dlNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Pharmacist In-Charge & Reg No
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Joshi (RPh-98421)"
                  value={settings.pharmacistName || ""}
                  onChange={(e) => setSettings({ ...settings, pharmacistName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phone (Helpline / WhatsApp)
                </label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Store Location / Physical Pharmacy Address
              </label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Tax & GST Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Receipt className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Financials, Pharma GST Rates & Invoice Terms
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  value={settings.gstin || ""}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Default Medicine GST Rate (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={settings.defaultGstRate ?? 12.0}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultGstRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol || "₹"}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Medical Bill & Cash Memo Disclaimer Terms
              </label>
              <textarea
                rows={3}
                value={settings.receiptFooter || ""}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Pharmacy Configuration"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}