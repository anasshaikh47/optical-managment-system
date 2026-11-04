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
  Glasses,
  Receipt,
  Eye,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";
import { CustomerHistoryModal } from "@/components/CustomerHistoryModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const { tenantFetch } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<any | null>(null);

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
      setSelectedHistoryCustomer(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !selectedHistoryCustomer) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, selectedHistoryCustomer]);

  const searchRecords = async (searchTerm: string) => {
    setLoading(true);
    try {
      const [custRes, ordRes, invRes] = await Promise.all([
        tenantFetch("/api/customers").then((r) => r.json()).catch(() => ({ success: false })),
        tenantFetch("/api/orders").then((r) => r.json()).catch(() => ({ success: false })),
        tenantFetch("/api/products").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      const q = searchTerm.toLowerCase().trim();
      const allCustomers = custRes.success ? custRes.data : [];
      const allOrders = ordRes.success ? ordRes.data : [];
      const allItems = invRes.success ? invRes.data : [];

      if (!q) {
        setResults({
          customers: allCustomers.slice(0, 4),
          orders: allOrders.slice(0, 3),
          items: allItems.slice(0, 3),
        });
      } else {
        const filteredCustomers = allCustomers.filter(
          (c: any) =>
            c.name?.toLowerCase().includes(q) ||
            c.phone?.replace(/[^0-9]/g, "").includes(q) ||
            c.phone?.includes(q) ||
            c.address?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        ).slice(0, 6);

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

  const handleOpenCustomerHistory = async (customer: any) => {
    // Fetch complete customer history with all prescriptions and orders
    try {
      const res = await tenantFetch(`/api/customers/${customer.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedHistoryCustomer(json.data);
      } else {
        setSelectedHistoryCustomer(customer);
      }
    } catch {
      setSelectedHistoryCustomer(customer);
    }
  };

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  const totalResults =
    results.customers.length + results.orders.length + results.items.length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden border border-slate-200">
          {/* Search Input Bar */}
          <div className="flex items-center px-5 py-4 border-b border-slate-100 bg-slate-50 gap-3">
            <Search className="w-5 h-5 text-slate-500 shrink-0 stroke-[2.2]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by customer phone number, name, bill #, frame model, or barcode SKU..."
              className="flex-1 bg-transparent border-none outline-none text-slate-900 text-sm font-semibold placeholder-slate-400"
            />
            {loading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
            {query && !loading && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-600 bg-slate-200 border border-slate-300 shadow-2xs">
              ESC
            </span>
          </div>

          {/* Search Results Area */}
          <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
            {totalResults === 0 && !loading && (
              <div className="py-12 text-center text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold text-slate-600">No records found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search by 10-digit mobile number, customer name, bill # (e.g. VP-2026-0001), or frame SKU.
                </p>
              </div>
            )}

            {/* Customer Matches - With Live Prescription & History Action */}
            {results.customers.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Customers / Patients ({results.customers.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">
                    click record to open full prescription & order history
                  </span>
                </div>
                <div className="space-y-2">
                  {results.customers.map((c) => {
                    const latestRx = c.prescriptions?.[0];
                    const ordersCount = c.orders?.length || c._count?.orders || 0;

                    return (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                                  {c.name}
                                </h4>
                                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.2 rounded border border-blue-200">
                                  {c.phone}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  {c.loyalty_points || 0} Loyalty Pts
                                </span>
                              </div>
                              {c.address && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-md">{c.address}</span>
                                </p>
                              )}
                              {latestRx && (
                                <div className="mt-1.5 inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-900 font-mono">
                                  <Glasses className="w-3 h-3 text-cyan-700" />
                                  <span>
                                    Latest Rx: OD ({latestRx.od_sph || "0.00"} SPH / {latestRx.od_cyl || "0.00"} CYL) •{" "}
                                    {latestRx.lens_type?.replace("_", " ") || "Single Vision"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenCustomerHistory(c)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-100/70 hover:bg-blue-200 border border-blue-300 transition-colors cursor-pointer"
                              title="Open Optical Prescription & Past Orders History"
                            >
                              <Glasses className="w-3.5 h-3.5" />
                              <span>Prescription & Orders</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleNavigate(`/pos?customerId=${c.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 transition-colors cursor-pointer"
                              title="Create New Bill in POS"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Bill</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleNavigate(`/customers/${c.id}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                              title="View Full Customer Directory Profile"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Matches */}
            {results.orders.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Store Spectacle Orders ({results.orders.length})</span>
                </div>
                <div className="space-y-1.5">
                  {results.orders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => handleNavigate(`/orders/${o.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50/80 transition-colors group text-left border border-slate-200 hover:border-purple-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Glasses className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 font-mono">
                              Bill: {o.bill_no}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 text-slate-700">
                              {o.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Patient: <strong>{o.customer?.name}</strong> ({o.customer?.phone})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-xs font-bold font-mono text-slate-900">
                            {formatCurrency(o.final_payable)}
                          </p>
                          {o.balance_amount > 0 ? (
                            <p className="text-[10px] font-bold text-rose-600">
                              Due: {formatCurrency(o.balance_amount)}
                            </p>
                          ) : (
                            <p className="text-[10px] font-semibold text-emerald-600">Paid in Full</p>
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
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Optical Inventory & Products ({results.items.length})</span>
                </div>
                <div className="space-y-1.5">
                  {results.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(`/inventory?search=${encodeURIComponent(item.model)}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/80 transition-colors group text-left border border-slate-200 hover:border-emerald-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
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

          {/* Footer Shortcuts */}
          <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Quick Search: Type name or phone to find records immediately</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-700 font-bold hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Customer Full Prescription & Past Order History Modal */}
      {selectedHistoryCustomer && (
        <CustomerHistoryModal
          isOpen={!!selectedHistoryCustomer}
          onClose={() => setSelectedHistoryCustomer(null)}
          customer={selectedHistoryCustomer}
        />
      )}
    </>
  );
}
