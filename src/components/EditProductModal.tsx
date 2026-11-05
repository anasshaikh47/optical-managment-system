"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Edit2,
  Check,
  UploadCloud,
  Camera,
  Trash2,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

export interface EditProductModalProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: any) => void;
}

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const { tenantFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    sizeKb: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    type: "FRAME",
    brand: "",
    model: "",
    color: "",
    size: "",
    lens_index: "1.56",
    cost_price: "",
    selling_price: "",
    gst_rate: "12.0",
    stock_quantity: "",
    min_alert_threshold: "5",
    image_url: "",
  });

  // Pre-fill form state when product changes or modal opens
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || "",
        barcode: product.barcode || "",
        type: product.type || "FRAME",
        brand: product.brand || "",
        model: product.model || "",
        color: product.color || "",
        size: product.size || "",
        lens_index: product.lens_index || "1.56",
        cost_price: product.cost_price !== undefined ? String(product.cost_price) : "",
        selling_price: product.selling_price !== undefined ? String(product.selling_price) : "",
        gst_rate: product.gst_rate !== undefined ? String(product.gst_rate) : "12.0",
        stock_quantity: product.stock_quantity !== undefined ? String(product.stock_quantity) : "0",
        min_alert_threshold:
          product.min_alert_threshold !== undefined ? String(product.min_alert_threshold) : "5",
        image_url: product.image_url || "",
      });
      setError(null);
      setUploadedFileInfo(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  // Process & Optimize Selected Image File (Client-side Canvas Compression)
  const processImageFile = (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (.jpg, .png, .webp).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image file is too large. Please select a photo under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 800x800 for optimal storage & rendering
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

          setFormData((prev) => ({
            ...prev,
            image_url: compressedDataUrl,
          }));

          setUploadedFileInfo({
            name: file.name,
            sizeKb: Math.round(compressedDataUrl.length / 1024),
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
    setUploadedFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cost = parseFloat(formData.cost_price) || 0;
  const selling = parseFloat(formData.selling_price) || 0;
  const marginPct = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : null;
  const profitAmt = selling > 0 ? selling - cost : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.selling_price) {
      setError("Brand and Selling Price are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await tenantFetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          type: formData.type,
          color: formData.color.trim(),
          size: formData.size.trim(),
          lens_index: formData.type === "LENS" ? formData.lens_index : null,
          cost_price: parseFloat(formData.cost_price) || 0,
          selling_price: parseFloat(formData.selling_price) || 0,
          stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
          min_alert_threshold: parseInt(formData.min_alert_threshold, 10) || 5,
          gst_rate: parseFloat(formData.gst_rate) || 12.0,
          image_url: formData.image_url || null,
          barcode: formData.barcode.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || "Failed to update inventory item");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating product");
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
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
              <Edit2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Edit Inventory Item
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Update details, pricing, dimensions, or product photo for {product.brand} ({product.sku})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Product Category Radio Tabs */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Product Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "FRAME", label: "Spectacle Frame" },
                { key: "LENS", label: "Power Lens" },
                { key: "CONTACT_LENS", label: "Contact Lens" },
                { key: "ACCESSORY", label: "Accessory / Case" },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => setFormData({ ...formData, type: cat.key })}
                  className={`py-2 px-2.5 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                    formData.type === cat.key
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ray-Ban, Titan, Zeiss"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Model No / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Clubmaster RB-5154"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* SKU (read-only reference) & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                SKU Identifier
              </label>
              <input
                type="text"
                disabled
                value={formData.sku}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-bold text-xs cursor-not-allowed"
                title="SKU cannot be altered once registered"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Color & Size / Lens Index Details */}
          {formData.type === "FRAME" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Color / Finish
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matte Black / Gold"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Frame Dimensions (Size)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 52-18-140"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-semibold focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {formData.type === "LENS" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-[11px] text-slate-700 font-bold mb-1">
                Refractive Index
              </label>
              <select
                value={formData.lens_index}
                onChange={(e) => setFormData({ ...formData, lens_index: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="1.50">1.50 Standard CR-39</option>
                <option value="1.56">1.56 Mid-Index Aspheric</option>
                <option value="1.60">1.60 High-Index Tough</option>
                <option value="1.67">1.67 Ultra-Thin Anti-Reflective</option>
                <option value="1.74">1.74 Premium Super-Thin Hi-Index</option>
              </select>
            </div>
          )}

          {/* ======================================================== */}
          {/* IMAGE UPLOAD DROPZONE & LIVE PREVIEW (Gallery + Camera)  */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-600" />
                <span>Product Photo (Gallery or Camera)</span>
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

            {/* Hidden native file input supporting mobile gallery & camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!formData.image_url ? (
              /* Drag & Drop Upload Dropzone Box */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                  isDragging
                    ? "border-cyan-500 bg-cyan-50/80 scale-[1.01]"
                    : "border-slate-300 bg-slate-50/70 hover:bg-slate-100 hover:border-cyan-400"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-600 group-hover:text-cyan-600 group-hover:scale-110 flex items-center justify-center transition-all shadow-2xs">
                  <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-cyan-700">Click to upload photo</span> or drag & drop here
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Supports JPG, PNG, WEBP • Gallery & Camera (Max 8MB)
                  </p>
                </div>
              </div>
            ) : (
              /* Live Image Preview Card with Remove / Change Action */
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl border border-slate-300 overflow-hidden bg-white shadow-xs shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.image_url}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {uploadedFileInfo?.name || "Product Photo Loaded"}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {uploadedFileInfo
                        ? `${uploadedFileInfo.sizeKb} KB • Ready`
                        : "Current photo attached"}
                    </p>
                  </div>
                </div>

                {/* Remove / Change Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                    title="Choose a different image"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Change</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Remove selected image"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}

            {/* Optional Fallback: URL Input */}
            {showUrlFallback && (
              <div className="pt-1 animate-in fade-in">
                <input
                  type="url"
                  placeholder="Or paste external image URL: https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Pricing, Cost Price & Margin Calculation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="2000"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="4500"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-cyan-400 rounded-xl text-cyan-800 text-xs font-mono font-black focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Stock Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.gst_rate}
                  onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Profit Margin Indicator */}
            {marginPct !== null && (
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Calculated Profit Margin:</span>
                <span className="font-black font-mono text-emerald-700">
                  {marginPct}% (+₹{profitAmt} margin/unit)
                </span>
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold bg-cyan-700 hover:bg-cyan-800 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{submitting ? "Saving Changes..." : "Update Product Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
