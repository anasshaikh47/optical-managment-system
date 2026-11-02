"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  User,
  FileText,
  Package,
  ArrowRight,
  Loader2,
  Clock,
  Glasses,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    customers: any[];
    orders: any[];
    items: any[];
  }>({
    customers: [],
    orders: [],
    items: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      searchRecords("");
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const searchRecords = async (searchTerm: string) => {
    setLoading(true);
    try {
      const [custRes, ordRes, invRes] = await Promise.all([
        fetch("/api/customers").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/orders").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/inventory").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      const q = searchTerm.toLowerCase().trim();

      const allCustomers = custRes.success ? custRes.data : [];
      const allOrders = ordRes.success ? ordRes.data : [];
      const allItems = invRes.success ? invRes.data : [];

      if (!q) {
        setResults({
          customers: allCustomers.slice(0, 3),
          orders: allOrders.slice(0, 3),
          items: allItems.slice(0, 3),
        });
      } else {
        const filteredCustomers = allCustomers.filter(
          (c: any) =>
            c.name?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.email?.toLowerCase().includes(q)
        ).slice(0, 5);

        const filteredOrders = allOrders.filter(
          (o: any) =>
            o.bill_no?.toLowerCase().includes(q) ||
            o.customer?.name?.toLowerCase().includes(q) ||
            o.customer?.phone?.includes(q)
        ).slice(0, 5);

        const filteredItems = allItems.filter(
          (i: any) =>
            i.brand?.toLowerCase().includes(q) ||
            i.model?.toLowerCase().includes(q) ||
            i.barcode?.toLowerCase().includes(q) ||
            i.type?.toLowerCase().includes(q)
        ).slice(0, 5);

        setResults({
          customers: filteredCustomers,
          orders: filteredOrders,
          items: filteredItems,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    searchRecords(val);
  };

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  const totalResults =
    results.customers.length + results.orders.length + results.items.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search customer by name or phone, bill number, frame model, barcode SKU..."
            className="flex-1 bg-transparent border-none outline-none text-slate-800 text-sm font-medium placeholder-slate-400"
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => handleQueryChange("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-200 border border-slate-300">
            ESC
          </span>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {totalResults === 0 && !loading && (
            <div className="py-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No records match &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Try searching by customer mobile, order bill number, or barcode SKU.
              </p>
            </div>
          )}

          {/* Customer Matches */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Customers & Patients ({results.customers.length})</span>
              </div>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/customers/${c.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group text-left border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {c.phone} {c.email ? `• ${c.email}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {c.loyalty_points || 0} Pts
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order Matches */}
          {results.orders.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Store Orders & Jobs ({results.orders.length})</span>
              </div>
              <div className="space-y-1">
                {results.orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleSelect(`/orders/${o.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/80 transition-colors group text-left border border-transparent hover:border-purple-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Glasses className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 font-mono">
                            {o.bill_no}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700">
                            {o.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {o.customer?.name} ({o.customer?.phone})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-xs font-bold font-mono text-slate-800">
                          {formatCurrency(o.final_payable)}
                        </p>
                        {o.balance_amount > 0 && (
                          <p className="text-[10px] font-bold text-rose-600">
                            Due: {formatCurrency(o.balance_amount)}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Matches */}
          {results.items.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Frames, Lenses & Accessories ({results.items.length})</span>
              </div>
              <div className="space-y-1">
                {results.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(`/inventory?search=${encodeURIComponent(item.model)}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 transition-colors group text-left border border-transparent hover:border-emerald-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {item.brand} {item.model}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 text-slate-700">
                            {item.barcode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Type: {item.type} • Stock:{" "}
                          <span className={item.stock_quantity <= item.min_alert_threshold ? "text-rose-600 font-bold" : "font-semibold text-slate-700"}>
                            {item.stock_quantity} units
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <p className="text-xs font-bold font-mono text-emerald-700">
                        {formatCurrency(item.selling_price)}
                      </p>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigation: Click or press enter</span>
            <span>•</span>
            <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">Ctrl+K</kbd></span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 font-semibold hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
