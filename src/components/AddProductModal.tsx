"use client";

import { useState } from "react";
import { X, PackagePlus, Check, Sparkles, Image as ImageIcon } from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    type: "FRAME",
    brand: "",
    model: "",
    color: "",
    size: "52-18-140",
    lens_index: "1.56",
    cost_price: "",
    selling_price: "",
    gst_rate: "12.0",
    stock_quantity: "15",
    min_alert_threshold: "4",
    image_url: "",
  });

  if (!isOpen) return null;

  // Auto-generate unique Barcode / SKU
  const handleAutoGenerateSku = () => {
    const prefix =
      formData.type === "FRAME"
        ? (formData.brand ? formData.brand.substring(0, 3).toUpperCase() : "FRM")
        : formData.type === "LENS"
        ? "LNS"
        : formData.type === "CONTACT_LENS"
        ? "CNT"
        : "ACC";

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedSku = `${prefix}-${randomNum}`;
    const generatedBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

    setFormData((prev) => ({
      ...prev,
      sku: generatedSku,
      barcode: prev.barcode || generatedBarcode,
    }));
  };

  const cost = parseFloat(formData.cost_price) || 0;
  const selling = parseFloat(formData.selling_price) || 0;
  const marginPct = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : null;
  const profitAmt = selling > 0 ? selling - cost : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.brand || !formData.selling_price) {
      setError("SKU, Brand, and Selling Price are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || "Failed to add inventory item");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Add New Inventory Item
              </h3>
              <p className="text-[11px] text-slate-500">
                Frames, power lenses, contact lenses, or accessories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Item Classification *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
            >
              <option value="FRAME">Spectacle Frame / Sunglasses</option>
              <option value="LENS">Ophthalmic Power Lens</option>
              <option value="CONTACT_LENS">Contact Lenses</option>
              <option value="ACCESSORY">Optical Accessory / Solution</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder="Ray-Ban, Titan Eye+, Fastrack, Zeiss"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Model Name / Number
              </label>
              <input
                type="text"
                placeholder="RB2140 Wayfarer / Edge Titanium"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* SKU & Barcode with Auto-Generate Action */}
          <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-900 text-xs">Identification Codes</span>
              <button
                type="button"
                onClick={handleAutoGenerateSku}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 bg-white border border-cyan-300 px-2 py-0.5 rounded-md shadow-2xs hover:bg-cyan-50 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-600" />
                <span>Auto-Generate SKU & Barcode</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5 text-[11px]">
                  SKU Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RB-5154"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5 text-[11px]">
                  Barcode (EAN/Code128)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 890123456789"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Conditional Specs */}
          {formData.type === "FRAME" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Color</label>
                <input
                  type="text"
                  placeholder="Matte Black / Gold Tortoise"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Size (Eye-Bridge-Temple)</label>
                <input
                  type="text"
                  placeholder="50-22-150"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
          )}

          {formData.type === "LENS" && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Refractive Index</label>
              <select
                value={formData.lens_index}
                onChange={(e) => setFormData({ ...formData, lens_index: e.target.value })}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
              >
                <option value="1.50">1.50 Standard CR-39</option>
                <option value="1.56">1.56 Mid-Index</option>
                <option value="1.60">1.60 High-Index</option>
                <option value="1.67">1.67 Ultra-Thin Aspheric</option>
                <option value="1.74">1.74 Premium Super-Thin</option>
              </select>
            </div>
          )}

          {/* Image URL & Thumbnail Preview */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Product Image URL & Thumbnail Preview</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or /frames/rayban.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
              {formData.image_url ? (
                <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Pricing, Cost Price & Margin Calculation */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="2000"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="4500"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-bold text-cyan-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Stock Qty *
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.gst_rate}
                  onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Profit Margin indicator */}
            {marginPct !== null && (
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
                <span className="text-slate-600">Calculated Profit Margin:</span>
                <span className="font-bold text-emerald-700">
                  {marginPct}% (+₹{profitAmt} per unit)
                </span>
              </div>
            )}
          </div>

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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? "Adding..." : "Add to Inventory"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
