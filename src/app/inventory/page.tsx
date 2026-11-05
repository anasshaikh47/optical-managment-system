"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Filter,
  Check,
  Edit2,
  Trash2,
  Printer,
  Tag,
  Glasses,
  CheckSquare,
  Square,
  TrendingUp,
  Percent,
  X,
} from "lucide-react";
import { AddProductModal } from "@/components/AddProductModal";
import { EditProductModal } from "@/components/EditProductModal";
import { BarcodeStickerModal } from "@/components/BarcodeStickerModal";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function InventoryPage() {
  const { shopId, tenantFetch } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Bulk Selection for Barcode Sticker Printing & Bulk Delete
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Stock Adjustment with Reason Log Modal
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>("PURCHASE");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustmentToast, setAdjustmentToast] = useState<string | null>(null);

  // Single Delete Confirmation State
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Bulk Delete Confirmation State
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [shopId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch("/api/products");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjustment = (item: any, delta: number) => {
    setAdjustingItem(item);
    setAdjustDelta(delta);
    setAdjustReason(delta > 0 ? "PURCHASE" : "DAMAGE");
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const newStock = Math.max(0, adjustingItem.stock_quantity + adjustDelta);
    setAdjustSubmitting(true);

    try {
      const res = await tenantFetch(`/api/products/${adjustingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_quantity: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((p) => (p.id === adjustingItem.id ? { ...p, stock_quantity: newStock } : p))
        );
        setAdjustmentToast(
          `Stock adjusted (${adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta}) for ${adjustingItem.brand} (${adjustReason})`
        );
        setTimeout(() => setAdjustmentToast(null), 4000);
        setAdjustingItem(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Single Item Deletion Handler
  const handleConfirmSingleDelete = async () => {
    if (!deletingItem) return;
    setDeleteSubmitting(true);

    try {
      const res = await tenantFetch(`/api/products/${deletingItem.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAdjustmentToast(
          `Item "${deletingItem.brand} - ${deletingItem.model || deletingItem.sku}" removed from catalog.`
        );
        setTimeout(() => setAdjustmentToast(null), 4000);
        setSelectedItemIds((prev) => prev.filter((id) => id !== deletingItem.id));
        setDeletingItem(null);
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Bulk Deletion Handler
  const handleConfirmBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;
    setBulkDeleteSubmitting(true);

    try {
      const res = await tenantFetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedItemIds }),
      });
      const data = await res.json();
      if (data.success) {
        setAdjustmentToast(`Successfully deleted ${selectedItemIds.length} item(s) from inventory.`);
        setTimeout(() => setAdjustmentToast(null), 4000);
        setSelectedItemIds([]);
        setIsBulkDeleteModalOpen(false);
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkDeleteSubmitting(false);
    }
  };

  // Bulk selection toggles
  const toggleSelectAll = () => {
    if (selectedItemIds.length === filtered.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filtered.map((i) => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filtered = items.filter((p) => {
    const matchesType = activeType === "ALL" || p.type === activeType;
    const matchesLowStock = !onlyLowStock || p.stock_quantity <= p.min_alert_threshold;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.model && p.model.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.color && p.color.toLowerCase().includes(q));
    return matchesType && matchesLowStock && matchesSearch;
  });

  const lowStockCount = items.filter((p) => p.stock_quantity <= p.min_alert_threshold).length;
  const itemsForBarcodePrint =
    selectedItemIds.length > 0
      ? items.filter((i) => selectedItemIds.includes(i.id))
      : filtered;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      {/* Inventory Action Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Catalog
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Manage frames, lenses, stock levels, barcodes & pricing margins
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Delete Action Button (Visible when 1 or more items selected) */}
          {selectedItemIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedItemIds.length})</span>
            </button>
          )}

          {/* Print Barcode Stickers Action Button */}
          <button
            onClick={() => setIsBarcodeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>
              Print Barcode Tags ({selectedItemIds.length > 0 ? selectedItemIds.length : "All"})
            </span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Stock Adjustment / Deletion Success Toast */}
      {adjustmentToast && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{adjustmentToast}</span>
          </div>
          <button onClick={() => setAdjustmentToast(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 pb-24 md:pb-6 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, brand (Ray-Ban), model, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Classification Filter Pills */}
            <div className="flex gap-1 overflow-x-auto text-xs select-none">
              {[
                { label: "All Items", key: "ALL" },
                { label: "Frames", key: "FRAME" },
                { label: "Lenses", key: "LENS" },
                { label: "Contact Lenses", key: "CONTACT_LENS" },
                { label: "Accessories", key: "ACCESSORY" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveType(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeType === tab.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Low Stock Alert Toggle Button */}
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 border cursor-pointer ${
                onlyLowStock
                  ? "bg-rose-50 border-rose-300 text-rose-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Low Stock Alert ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto w-full pb-24 md:pb-0">
            <table className="w-full min-w-[850px] text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Select All for Barcode Sticker Printing or Bulk Delete"
                    >
                      {selectedItemIds.length === filtered.length && filtered.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-cyan-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Photo</th>
                  <th className="p-3.5">SKU / Barcode</th>
                  <th className="p-3.5">Brand & Model</th>
                  <th className="p-3.5">Color & Size</th>
                  <th className="p-3.5 text-right">Cost Price</th>
                  <th className="p-3.5 text-right">Selling Price</th>
                  <th className="p-3.5 text-right">Margin %</th>
                  <th className="p-3.5 text-center">Stock Qty</th>
                  <th className="p-3.5 text-center">Quick Adjust</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
                        <Package className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {items.length === 0
                            ? "Available Inventory: 0 items"
                            : "No items match your filter"}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {items.length === 0
                            ? "Your store inventory is empty. Add your first optical frame, prescription lens, or accessory to start cataloging and selling."
                            : "Try searching with a different SKU, brand name, or reset the filter pills."}
                        </p>
                        {items.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Add Your First Product</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isOutOfStock = item.stock_quantity <= 0;
                    const isLowStock =
                      item.stock_quantity <= item.min_alert_threshold && !isOutOfStock;
                    const isSelected = selectedItemIds.includes(item.id);

                    // Margin % Calculation: ((Selling - Cost) / Selling) * 100
                    const margin =
                      item.selling_price > 0 && item.cost_price > 0
                        ? (((item.selling_price - item.cost_price) / item.selling_price) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? "bg-cyan-50/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => toggleSelectItem(item.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Photo Thumbnail */}
                        <td className="p-3.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 flex-shrink-0">
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image_url}
                                alt={item.brand}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).style.display = "none";
                                }}
                              />
                            ) : (
                              <Glasses className="w-5 h-5 opacity-40 text-slate-500" />
                            )}
                          </div>
                        </td>

                        {/* SKU & Barcode */}
                        <td className="p-3.5">
                          <p className="font-bold font-mono text-slate-900 leading-tight">
                            {item.sku}
                          </p>
                          {item.barcode && (
                            <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {item.barcode}
                            </p>
                          )}
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 mt-1 inline-block">
                            {item.type.replace("_", " ")}
                          </span>
                        </td>

                        {/* Brand & Model */}
                        <td className="p-3.5">
                          <p className="font-bold text-cyan-800 text-xs">{item.brand}</p>
                          <p className="text-slate-700 text-xs font-medium">
                            {item.model || item.type}
                          </p>
                        </td>

                        {/* Color & Size */}
                        <td className="p-3.5 text-slate-600">
                          {item.type === "FRAME" ? (
                            <p className="text-[11px]">
                              {item.color || "Standard"} •{" "}
                              <span className="font-mono text-slate-500">{item.size || "52-18-140"}</span>
                            </p>
                          ) : item.type === "LENS" ? (
                            <p className="text-[11px] font-semibold text-slate-700">
                              Refractive Index {item.lens_index || "1.56"}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500">{item.color || item.size || "Standard"}</p>
                          )}
                        </td>

                        {/* Cost Price */}
                        <td className="p-3.5 text-right font-medium text-slate-500">
                          {formatCurrency(item.cost_price)}
                        </td>

                        {/* Selling Price */}
                        <td className="p-3.5 text-right font-black text-slate-900 text-xs">
                          {formatCurrency(item.selling_price)}
                        </td>

                        {/* Margin % */}
                        <td className="p-3.5 text-right font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              parseFloat(margin) >= 50
                                ? "bg-emerald-50 text-emerald-700 font-extrabold"
                                : parseFloat(margin) >= 30
                                ? "bg-cyan-50 text-cyan-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {margin}%
                          </span>
                        </td>

                        {/* Stock Qty */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isOutOfStock
                                ? "bg-rose-100 text-rose-800"
                                : isLowStock
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.stock_quantity} units
                          </span>
                        </td>

                        {/* Quick Adjust Buttons */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                            <button
                              onClick={() => handleOpenAdjustment(item, -1)}
                              className="px-2 py-0.5 rounded text-xs font-black text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Decrease Stock with Reason Log"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleOpenAdjustment(item, 1)}
                              className="px-2 py-0.5 rounded text-xs font-black text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Increase Stock with Reason Log"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Actions: Tag, Edit & Delete Buttons */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1">
                            {/* Barcode Tag Button */}
                            <button
                              onClick={() => {
                                setSelectedItemIds([item.id]);
                                setIsBarcodeModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Print Barcode Tag for this item"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button (Pencil icon) */}
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                              title={`Edit ${item.brand} - ${item.model || item.sku}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (Trash icon with red hover) */}
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={`Delete ${item.brand} - ${item.model || item.sku}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Single Item Delete Confirmation Popup Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Delete Inventory Item?
                </h3>
                <p className="text-[11px] text-slate-500">
                  This item will be permanently removed.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Brand:</strong> {deletingItem.brand}
              </p>
              <p>
                <strong>Model / Item:</strong> {deletingItem.model || deletingItem.type}
              </p>
              <p className="font-mono text-[11px]">
                <strong>SKU:</strong> {deletingItem.sku}
              </p>
              <p>
                <strong>Current Stock:</strong> {deletingItem.stock_quantity} units
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete this item? This action removes the item from the catalog.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmSingleDelete}
                className="px-4 py-1.5 rounded-lg text-white font-bold bg-rose-600 hover:bg-rose-700 shadow-sm text-xs cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Popup Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Delete {selectedItemIds.length} Selected Items?
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bulk removal from inventory database
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete all <strong>{selectedItemIds.length}</strong> selected inventory items? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkDeleteSubmitting}
                onClick={handleConfirmBulkDelete}
                className="px-4 py-1.5 rounded-lg text-white font-bold bg-rose-600 hover:bg-rose-700 shadow-sm text-xs cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteSubmitting ? "Deleting..." : `Delete ${selectedItemIds.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment with Reason Log Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Stock Adjustment & Reason Log
              </h3>
              <button
                onClick={() => setAdjustingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Item: <strong>{adjustingItem.brand} - {adjustingItem.model || adjustingItem.sku}</strong>
              <br />
              Current Stock: <strong>{adjustingItem.stock_quantity} units</strong>
            </p>

            <form onSubmit={handleSubmitAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Quantity Change (+ / -)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-black text-sm"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustDelta(1)}
                      className="px-2 py-1 rounded bg-slate-100 font-bold hover:bg-slate-200"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustDelta(5)}
                      className="px-2 py-1 rounded bg-slate-100 font-bold hover:bg-slate-200"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustDelta(-1)}
                      className="px-2 py-1 rounded bg-slate-100 font-bold hover:bg-slate-200"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Adjustment Reason *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="PURCHASE">Purchase Inward (Vendor Shipment)</option>
                  <option value="DAMAGE">Damage / Broken Frame / Defective</option>
                  <option value="PHYSICAL_AUDIT">Physical Stocktaking Audit Discrepancy</option>
                  <option value="CUSTOMER_RETURN">Customer Return / Exchange</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
                <span>New Stock Level:</span>
                <span className="font-black text-cyan-800">
                  {Math.max(0, adjustingItem.stock_quantity + adjustDelta)} units
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-4 py-1.5 rounded-lg text-white font-bold bg-cyan-600 hover:bg-cyan-700 shadow-sm"
                >
                  {adjustSubmitting ? "Updating..." : "Commit Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchItems()}
      />

      {/* Edit Product Modal */}
      {editingItem && (
        <EditProductModal
          isOpen={!!editingItem}
          product={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={(updated) => {
            setItems((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
            setAdjustmentToast(
              `Item "${updated.brand} - ${updated.model || updated.sku}" updated successfully.`
            );
            setTimeout(() => setAdjustmentToast(null), 4000);
          }}
        />
      )}

      {/* Barcode Stickers Printing Modal */}
      <BarcodeStickerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        items={itemsForBarcodePrint}
      />
    </div>
  );
}
