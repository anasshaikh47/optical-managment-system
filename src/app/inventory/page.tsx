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
} from "lucide-react";
import { Header } from "@/components/Header";
import { AddProductModal } from "@/components/AddProductModal";
import { formatCurrency } from "@/lib/utils";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    setUpdatingStockId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStockId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCategory =
      activeCategory === "ALL" || p.category === activeCategory;
    const matchesLowStock = !onlyLowStock || p.stockQuantity <= p.minStockAlert;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q));
    return matchesCategory && matchesLowStock && matchesSearch;
  });

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="Inventory & Optical Catalog"
        subtitle="Frames, Ophthalmic Lenses, Contact Lenses & Accessories"
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </button>
      </Header>

      <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, barcode, brand, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex gap-1 overflow-x-auto text-xs">
              {[
                { label: "All Items", key: "ALL" },
                { label: "Frames", key: "FRAME" },
                { label: "Lenses", key: "LENS" },
                { label: "Contact Lenses", key: "CONTACT_LENS" },
                { label: "Accessories", key: "ACCESSORY" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeCategory === tab.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Low stock toggle */}
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 border ${
                onlyLowStock
                  ? "bg-rose-50 border-rose-300 text-rose-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Low Stock Alerts ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-3.5">SKU / Item</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Brand & Specs</th>
                  <th className="p-3.5 text-right">Cost Price</th>
                  <th className="p-3.5 text-right">Selling Price</th>
                  <th className="p-3.5 text-right">Margin</th>
                  <th className="p-3.5 text-center">Stock Level</th>
                  <th className="p-3.5 text-center">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No products match your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isOutOfStock = item.stockQuantity <= 0;
                    const isLowStock = item.stockQuantity <= item.minStockAlert && !isOutOfStock;
                    const margin =
                      item.sellingPrice > 0
                        ? (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(0)
                        : 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 leading-tight">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded font-semibold">
                              {item.sku}
                            </span>
                            {item.barcode && (
                              <span className="font-mono text-[10px] text-slate-400">
                                UPC: {item.barcode}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.category.replace("_", " ")}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600">
                          <p className="font-semibold text-slate-800">
                            {item.brand || "—"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.category === "FRAME" && item.size && `${item.size} • ${item.color || ""}`}
                            {item.category === "LENS" && item.lensIndex && `Index ${item.lensIndex}`}
                            {item.category === "CONTACT_LENS" && `BC: ${item.baseCurve || "8.5"}`}
                          </p>
                        </td>

                        <td className="p-3.5 text-right font-medium text-slate-500">
                          {formatCurrency(item.costPrice)}
                        </td>

                        <td className="p-3.5 text-right font-bold text-slate-900 text-xs">
                          {formatCurrency(item.sellingPrice)}
                        </td>

                        <td className="p-3.5 text-right font-bold text-emerald-600">
                          {margin}%
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isOutOfStock
                                ? "bg-rose-100 text-rose-800"
                                : isLowStock
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.stockQuantity} units
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                            <button
                              disabled={updatingStockId === item.id || item.stockQuantity <= 0}
                              onClick={() => handleAdjustStock(item.id, item.stockQuantity, -1)}
                              className="px-2 py-0.5 rounded text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30"
                            >
                              -
                            </button>
                            <button
                              disabled={updatingStockId === item.id}
                              onClick={() => handleAdjustStock(item.id, item.stockQuantity, 1)}
                              className="px-2 py-0.5 rounded text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30"
                            >
                              +
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

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchProducts()}
      />
    </div>
  );
}
