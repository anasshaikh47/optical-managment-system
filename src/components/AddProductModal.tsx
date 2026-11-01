"use client";

import { useState } from "react";
import { X, PackagePlus, Check } from "lucide-react";

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
    name: "",
    category: "FRAME",
    sku: "",
    barcode: "",
    brand: "",
    modelNumber: "",
    color: "",
    size: "",
    material: "Acetate",
    shape: "Rectangle",
    lensIndex: "1.56",
    coating: "Anti-Reflective",
    baseCurve: "",
    diameter: "",
    costPrice: "",
    sellingPrice: "",
    stockQuantity: "10",
    minStockAlert: "3",
    supplier: "",
    description: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      setError("Product Name and SKU are required.");
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
        setError(data.error || "Failed to add product");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Add Inventory Item
              </h3>
              <p className="text-[11px] text-slate-500">
                Register frames, lenses, contact lenses, or accessories
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Product Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-medium"
            >
              <option value="FRAME">Eyewear Frame / Sunglasses</option>
              <option value="LENS">Ophthalmic Lens</option>
              <option value="CONTACT_LENS">Contact Lenses</option>
              <option value="ACCESSORY">Optical Accessory / Solution</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ray-Ban Clubmaster Classic"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                SKU / Item Code *
              </label>
              <input
                type="text"
                required
                placeholder="FRM-RB-3016"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Brand</label>
              <input
                type="text"
                placeholder="Ray-Ban, Zeiss, etc."
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Barcode / UPC</label>
              <input
                type="text"
                placeholder="80528912..."
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Model #</label>
              <input
                type="text"
                placeholder="RB3016"
                value={formData.modelNumber}
                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Conditional Fields based on Category */}
          {formData.category === "FRAME" && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase">
                Frame Specifications
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Color</label>
                  <input
                    type="text"
                    placeholder="Tortoise"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Size (Eye-Bridge-Temple)</label>
                  <input
                    type="text"
                    placeholder="51-21-145"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Material</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="Acetate">Acetate</option>
                    <option value="Titanium">Titanium</option>
                    <option value="Metal">Metal / Alloy</option>
                    <option value="TR90">TR90 Memory Plastic</option>
                    <option value="Carbon Fiber">Carbon Fiber</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {formData.category === "LENS" && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase">
                Lens Optical Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Refractive Index</label>
                  <select
                    value={formData.lensIndex}
                    onChange={(e) => setFormData({ ...formData, lensIndex: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="1.50">1.50 Standard CR-39</option>
                    <option value="1.56">1.56 Mid Index</option>
                    <option value="1.59">1.59 Polycarbonate</option>
                    <option value="1.60">1.60 High Index</option>
                    <option value="1.67">1.67 Ultra High Index</option>
                    <option value="1.74">1.74 Super Thin Index</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Coating Treatment</label>
                  <input
                    type="text"
                    placeholder="Blue-Cut + AR + Hydrophobic"
                    value={formData.coating}
                    onChange={(e) => setFormData({ ...formData, coating: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="45.00"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Selling Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="120.00"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Initial Stock *
              </label>
              <input
                type="number"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Low Alert Threshold
              </label>
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
              />
            </div>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-60"
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
