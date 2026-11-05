"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Pill,
  Sparkles,
  Camera,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
  initialData?: any | null;
}

export function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AddProductModalProps) {
  const { shopId, tenantFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    genericSaltName: "",
    manufacturer: "",
    packType: "Strip",
    tabletsPerStrip: "10",
    hsnCode: "3004",
    rackLocation: "Rack A-01",
    minStockAlert: "10",
    scheduleType: "GENERAL",
    isScheduleH: false,
    batchNumber: "",
    expiryDate: "12/2026",
    mrp: "",
    purchaseRate: "",
    saleRate: "",
    stripQuantity: "20",
    looseTabletQuantity: "0",
    gstRate: "12.0",
    image_url: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        sku: initialData.sku || "",
        barcode: initialData.barcode || "",
        name: initialData.name || initialData.brand || "",
        genericSaltName: initialData.genericSaltName || initialData.model || "",
        manufacturer: initialData.manufacturer || "",
        packType: initialData.packType || initialData.type || "Strip",
        tabletsPerStrip: String(initialData.tabletsPerStrip || 10),
        hsnCode: initialData.hsnCode || "3004",
        rackLocation: initialData.rackLocation || "Rack A-01",
        minStockAlert: String(initialData.minStockAlert ?? initialData.min_alert_threshold ?? 10),
        scheduleType: initialData.scheduleType || (initialData.isScheduleH ? "SCHEDULE_H" : "GENERAL"),
        isScheduleH: !!initialData.isScheduleH,
        batchNumber: initialData.batchNumber || "BT-001",
        expiryDate: initialData.expiryDate || "12/2026",
        mrp: String(initialData.mrp || initialData.saleRate || initialData.selling_price || ""),
        purchaseRate: String(initialData.purchaseRate || initialData.cost_price || ""),
        saleRate: String(initialData.saleRate || initialData.selling_price || ""),
        stripQuantity: String(initialData.stripQuantity ?? initialData.stock_quantity ?? 0),
        looseTabletQuantity: String(initialData.looseTabletQuantity || 0),
        gstRate: String(initialData.gstRate || initialData.gst_rate || 12.0),
        image_url: initialData.image_url || "",
      });
    } else {
      setFormData({
        sku: "",
        barcode: "",
        name: "",
        genericSaltName: "",
        manufacturer: "",
        packType: "Strip",
        tabletsPerStrip: "10",
        hsnCode: "3004",
        rackLocation: "Rack A-01",
        minStockAlert: "10",
        scheduleType: "GENERAL",
        isScheduleH: false,
        batchNumber: "",
        expiryDate: "12/2026",
        mrp: "",
        purchaseRate: "",
        saleRate: "",
        stripQuantity: "20",
        looseTabletQuantity: "0",
        gstRate: "12.0",
        image_url: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Auto-generate SKU & Batch Number
  const handleAutoGenerate = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : "MED";
    const randomSku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomBatch = `BT-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

    setFormData((prev) => ({
      ...prev,
      sku: prev.sku || randomSku,
      batchNumber: prev.batchNumber || randomBatch,
      barcode: prev.barcode || randomBarcode,
    }));
  };

  const processImageFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        image_url: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const cost = parseFloat(formData.purchaseRate) || 0;
  const selling = parseFloat(formData.saleRate) || 0;
  const marginPct = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name || !formData.saleRate) {
      setError("SKU, Medicine Name, and Sale Rate are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const isEdit = !!initialData?.id;
    const url = isEdit ? `/api/products/${initialData.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await tenantFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, shopId, userId: shopId }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || "Failed to save medicine");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Pill className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {initialData ? "Edit Medicine & Batch Details" : "Add New Medicine to Pharmacy Inventory"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Salt composition, batch tracking, expiry date, rack location & GST
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Medicine Formulation / Pack Type Radio Tabs */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Formulation / Pack Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: "Strip", label: "Strip / Tab" },
                { key: "Bottle", label: "Bottle / Syrup" },
                { key: "Box", label: "Box / Vial" },
                { key: "Ointment", label: "Ointment" },
                { key: "Syringe", label: "Syringe" },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => setFormData({ ...formData, packType: cat.key })}
                  className={`py-2 px-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                    formData.packType === cat.key
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine Brand Name & Generic Salt Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Medicine Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dolo 650, Augmentin 625 Duo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Generic Salt Name / Composition <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol 650mg, Amoxicillin + Clav"
                value={formData.genericSaltName}
                onChange={(e) => setFormData({ ...formData, genericSaltName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Manufacturer & Pack Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Manufacturer / Pharma Company
              </label>
              <input
                type="text"
                placeholder="e.g. Micro Labs, GSK, Cipla, Alkem"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Tablets per Strip / Units per Pack
              </label>
              <input
                type="number"
                min="1"
                placeholder="10"
                value={formData.tabletsPerStrip}
                onChange={(e) => setFormData({ ...formData, tabletsPerStrip: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Batch Number & Expiry Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Batch Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AUG-8492"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Expiry Date (MM/YYYY) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 08/2027"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Rack Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rack A-12"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-xs"
              />
            </div>
          </div>

          {/* SKU & Barcode Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold">
                  SKU Identifier <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. MED-AUG625"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Barcode Number
              </label>
              <input
                type="text"
                placeholder="e.g. 8901234567890"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xs"
              />
            </div>
          </div>

          {/* MRP, Purchase Rate, Sale Rate & Margins */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="223.50"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Purchase Rate (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="165.00"
                value={formData.purchaseRate}
                onChange={(e) => setFormData({ ...formData, purchaseRate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Sale Rate (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="201.15"
                value={formData.saleRate}
                onChange={(e) => setFormData({ ...formData, saleRate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-emerald-400 rounded-xl text-xs font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          {marginPct && (
            <div className="flex items-center justify-between text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <span>Gross Margin: {marginPct}%</span>
              <span>Profit / Pack: ₹{(selling - cost).toFixed(2)}</span>
            </div>
          )}

          {/* Quantity, GST & HSN */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Strips in Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.stripQuantity}
                onChange={(e) => setFormData({ ...formData, stripQuantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Loose Tablets
              </label>
              <input
                type="number"
                min="0"
                value={formData.looseTabletQuantity}
                onChange={(e) => setFormData({ ...formData, looseTabletQuantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                GST Rate (%)
              </label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                <option value="12.0">12% (Standard Pharma)</option>
                <option value="5.0">5% (Life Saving)</option>
                <option value="18.0">18% (Supplements/Cosmetics)</option>
                <option value="0.0">0% (Tax Exempt)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                min="1"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Schedule H / Rx Only Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <label className="text-slate-800 font-bold block">
                Schedule H / Rx Only Medicine
              </label>
              <p className="text-[10px] text-slate-500">
                Requires mandatory registered doctor prescription during counter billing
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.isScheduleH}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isScheduleH: e.target.checked,
                  scheduleType: e.target.checked ? "SCHEDULE_H" : "GENERAL",
                })
              }
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Medicine Photo (Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlFallback(!showUrlFallback)}
                className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{showUrlFallback ? "Hide URL input" : "Paste Image URL"}</span>
              </button>
            </div>

            {showUrlFallback ? (
              <input
                type="url"
                placeholder="https://example.com/medicine.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && processImageFile(e.target.files[0])}
                  className="hidden"
                />
                <p className="text-xs font-semibold text-slate-600">Click or tap to upload medicine photo</p>
                {formData.image_url && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">Image selected</p>
                )}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Saving..." : initialData ? "Update Medicine" : "Save Medicine to Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
