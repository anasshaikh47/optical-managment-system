"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Tag,
  Pill,
  CheckSquare,
  Square,
  X,
  Check,
  Calendar,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ShieldAlert,
} from "lucide-react";
import { AddProductModal } from "@/components/AddProductModal";
import { BarcodeStickerModal } from "@/components/BarcodeStickerModal";
import { formatCurrency, getExpiryStatus } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function InventoryPage() {
  const { shopId, tenantFetch } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "NEAR_EXPIRY" | "OUT_OF_STOCK" | "SCHEDULE_H">("ALL");
  const [activePackFilter, setActivePackFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"TABLE" | "CARDS">("TABLE");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Bulk Selection
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

    const currentQty = adjustingItem.stripQuantity ?? adjustingItem.stock_quantity ?? 0;
    const newStock = Math.max(0, currentQty + adjustDelta);
    setAdjustSubmitting(true);

    try {
      const res = await tenantFetch(`/api/products/${adjustingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripQuantity: newStock, stock_quantity: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === adjustingItem.id
              ? { ...p, stripQuantity: newStock, stock_quantity: newStock }
              : p
          )
        );
        setAdjustmentToast(
          `Stock updated (${adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta}) for ${adjustingItem.name || adjustingItem.brand} (${adjustReason})`
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
          `Medicine "${deletingItem.name || deletingItem.brand}" removed from inventory.`
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
        setAdjustmentToast(`Successfully deleted ${selectedItemIds.length} medicine(s) from inventory.`);
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

  // Main Filtering Logic
  const filtered = items.filter((p) => {
    // 1. Tab filter: "All Medicines", "Near Expiry Alert", "Out of Stock", "Schedule H / Rx Only"
    if (activeTab === "NEAR_EXPIRY") {
      const exp = getExpiryStatus(p.expiryDate);
      if (exp.status !== "EXPIRING_SOON" && exp.status !== "EXPIRED") return false;
    } else if (activeTab === "OUT_OF_STOCK") {
      const stripQty = p.stripQuantity ?? p.stock_quantity ?? 0;
      const looseQty = p.looseTabletQuantity || 0;
      if (stripQty > 0 || looseQty > 0) return false;
    } else if (activeTab === "SCHEDULE_H") {
      if (!p.isScheduleH && p.scheduleType !== "SCHEDULE_H" && p.scheduleType !== "SCHEDULE_H1") {
        return false;
      }
    }

    // 2. Pack type filter
    if (activePackFilter !== "ALL") {
      const pack = (p.packType || p.type || "Strip").toUpperCase();
      if (pack !== activePackFilter.toUpperCase()) return false;
    }

    // 3. Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.genericSaltName && p.genericSaltName.toLowerCase().includes(q)) ||
      (p.model && p.model.toLowerCase().includes(q)) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.rackLocation && p.rackLocation.toLowerCase().includes(q)) ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q))
    );
  });

  const nearExpiryCount = items.filter((p) => {
    const exp = getExpiryStatus(p.expiryDate);
    return exp.status === "EXPIRING_SOON" || exp.status === "EXPIRED";
  }).length;

  const outOfStockCount = items.filter((p) => {
    const stripQty = p.stripQuantity ?? p.stock_quantity ?? 0;
    const looseQty = p.looseTabletQuantity || 0;
    return stripQty <= 0 && looseQty <= 0;
  }).length;

  const scheduleHCount = items.filter((p) => p.isScheduleH || p.scheduleType === "SCHEDULE_H").length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      {/* Inventory Action Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Pharmacy Inventory & Stock Control
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Manage medicines, salt composition, batch numbers, expiry dates, rack locations & GST
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="hidden sm:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-md ${viewMode === "TABLE" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"}`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("CARDS")}
              className={`p-1.5 rounded-md ${viewMode === "CARDS" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"}`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bulk Delete Button */}
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

          {/* Add Medicine Button */}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Medicine</span>
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

      <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 space-y-4">
        {/* Controls Bar & 4 Required Filter Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          {/* Top Row: Search input & Formulation pills */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search brand (Dolo, Augmentin), salt composition, batch, rack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto text-xs select-none w-full md:w-auto">
              {[
                { label: "All Formulations", key: "ALL" },
                { label: "Strips", key: "STRIP" },
                { label: "Bottles", key: "BOTTLE" },
                { label: "Boxes", key: "BOX" },
                { label: "Ointments", key: "OINTMENT" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActivePackFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activePackFilter === tab.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Core Pharmacy Filter Tabs: All Medicines | Near Expiry Alert | Out of Stock | Schedule H / Rx Only */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Medicines ({items.length})
            </button>

            <button
              onClick={() => setActiveTab("NEAR_EXPIRY")}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                activeTab === "NEAR_EXPIRY"
                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Near Expiry Alert ({nearExpiryCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("OUT_OF_STOCK")}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                activeTab === "OUT_OF_STOCK"
                  ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Out of Stock ({outOfStockCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("SCHEDULE_H")}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                activeTab === "SCHEDULE_H"
                  ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                  : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Schedule H / Rx Only ({scheduleHCount})</span>
            </button>
          </div>
        </div>

        {/* Inventory Content (Table or Cards) */}
        {viewMode === "TABLE" ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto w-full">
              <table className="w-full min-w-[950px] text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <button
                        onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Select All"
                      >
                        {selectedItemIds.length === filtered.length && filtered.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3.5">Medicine Name & Salt</th>
                    <th className="p-3.5">Batch / Expiry</th>
                    <th className="p-3.5">Rack Location</th>
                    <th className="p-3.5">Pack Type</th>
                    <th className="p-3.5 text-right">Purchase Rate</th>
                    <th className="p-3.5 text-right">MRP</th>
                    <th className="p-3.5 text-right">Sale Rate</th>
                    <th className="p-3.5 text-right">Margin %</th>
                    <th className="p-3.5 text-center">Stock Available</th>
                    <th className="p-3.5 text-center">Quick Adjust</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400">
                        Loading pharmacy inventory catalog...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
                          <Pill className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {items.length === 0
                              ? "No medicines in catalog"
                              : "No medicines match the selected filter"}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {items.length === 0
                              ? "Your pharmacy catalog is empty. Add your first medicine with batch, expiry & salt name to begin."
                              : "Try searching with a different salt name, brand name, or reset the filter tabs."}
                          </p>
                          {items.length === 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(null);
                                setIsAddModalOpen(true);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                              <span>+ Add Your First Medicine</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const stripQty = item.stripQuantity ?? item.stock_quantity ?? 0;
                      const looseQty = item.looseTabletQuantity || 0;
                      const minStock = item.minStockAlert ?? item.min_alert_threshold ?? 10;
                      const isOut = stripQty <= 0 && looseQty <= 0;
                      const isLow = stripQty <= minStock && !isOut;
                      const isSelected = selectedItemIds.includes(item.id);
                      const exp = getExpiryStatus(item.expiryDate);

                      const purchase = item.purchaseRate || item.cost_price || 0;
                      const sale = item.saleRate || item.selling_price || 0;
                      const margin =
                        sale > 0 && purchase > 0
                          ? (((sale - purchase) / sale) * 100).toFixed(1)
                          : "0.0";

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? "bg-emerald-50/30" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => toggleSelectItem(item.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Medicine Name & Salt */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 text-sm">
                                    {item.name || item.brand}
                                  </p>
                                  {item.isScheduleH && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                      Rx
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                                  {item.genericSaltName || item.model}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  SKU: {item.sku} {item.manufacturer && `• ${item.manufacturer}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Batch & Expiry Tag */}
                          <td className="p-3.5">
                            <p className="font-mono font-bold text-slate-800">
                              {item.batchNumber || "BT-DEFAULT"}
                            </p>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${exp.badgeClass}`}
                            >
                              Exp: {item.expiryDate} ({exp.label})
                            </span>
                          </td>

                          {/* Rack Location */}
                          <td className="p-3.5 font-mono text-xs font-semibold text-slate-700">
                            {item.rackLocation || "Rack A-01"}
                          </td>

                          {/* Pack Type */}
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                              {item.packType || item.type || "Strip"}
                            </span>
                          </td>

                          {/* Purchase Rate */}
                          <td className="p-3.5 text-right font-mono text-slate-500 font-medium">
                            {formatCurrency(purchase)}
                          </td>

                          {/* MRP */}
                          <td className="p-3.5 text-right font-mono text-slate-600">
                            {formatCurrency(item.mrp || sale)}
                          </td>

                          {/* Sale Rate */}
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(sale)}
                          </td>

                          {/* Margin % */}
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                            {margin}%
                          </td>

                          {/* Stock Quantity */}
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                isOut
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : isLow
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {stripQty} Strips {looseQty > 0 ? `+ ${looseQty} Tab` : ""}
                            </span>
                          </td>

                          {/* Quick Adjust */}
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenAdjustment(item, -1)}
                                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                                title="Deduct 1 Strip"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleOpenAdjustment(item, 5)}
                                className="w-6 h-6 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center cursor-pointer"
                                title="Add 5 Strips"
                              >
                                +5
                              </button>
                            </div>
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsAddModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Edit Medicine Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Medicine"
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
        ) : (
          /* Cards View Mode */
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item) => {
                const stripQty = item.stripQuantity ?? item.stock_quantity ?? 0;
                const looseQty = item.looseTabletQuantity || 0;
                const minStock = item.minStockAlert ?? item.min_alert_threshold ?? 10;
                const isOut = stripQty <= 0 && looseQty <= 0;
                const isLow = stripQty <= minStock && !isOut;
                const exp = getExpiryStatus(item.expiryDate);
                const sale = item.saleRate || item.selling_price || 0;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${exp.badgeClass}`}>
                          Exp: {item.expiryDate}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600">
                          {item.rackLocation || "Rack A-01"}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                        {item.name || item.brand}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {item.genericSaltName || item.model}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-mono flex justify-between text-slate-600">
                        <span>Batch: <strong>{item.batchNumber}</strong></span>
                        <span>Stock: <strong>{stripQty} Strips</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900 text-base">
                        {formatCurrency(sale)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsAddModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Medicine Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        initialData={editingItem}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchItems()}
      />

      {/* Barcode Sticker Modal */}
      <BarcodeStickerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        items={selectedItemIds.length > 0 ? items.filter((i) => selectedItemIds.includes(i.id)) : filtered}
      />

      {/* Stock Adjustment Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Adjust Stock: {adjustingItem.name || adjustingItem.brand}
              </h3>
              <button
                onClick={() => setAdjustingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Quantity Change (+ or -)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="PURCHASE">Purchase Stock Inward</option>
                  <option value="RETURN">Sales Return from Patient</option>
                  <option value="EXPIRED">Expired Batch Return to Distributor</option>
                  <option value="DAMAGE">Breakage / Damage</option>
                  <option value="AUDIT">Physical Stock Audit Correction</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-4 py-1.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                >
                  {adjustSubmitting ? "Updating..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Medicine Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">
              Confirm Medicine Deletion
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>{deletingItem.name || deletingItem.brand}</strong> (Batch: {deletingItem.batchNumber}) from your pharmacy catalog?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                disabled={deleteSubmitting}
                className="px-4 py-1.5 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700 text-xs shadow-xs"
              >
                {deleteSubmitting ? "Deleting..." : "Delete Medicine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">
              Bulk Delete {selectedItemIds.length} Medicines
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete the {selectedItemIds.length} selected medicines from inventory.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={bulkDeleteSubmitting}
                className="px-4 py-1.5 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700 text-xs shadow-xs"
              >
                {bulkDeleteSubmitting ? "Deleting..." : "Confirm Bulk Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
