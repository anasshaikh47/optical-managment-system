"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Glasses,
  User,
  UserPlus,
  CreditCard,
  QrCode,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Award,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ReceiptModal } from "@/components/ReceiptModal";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { formatCurrency, formatDiopter } from "@/lib/utils";

export default function POSPage() {
  // Inventory Items & Filtering
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL");

  // Customers & Prescriptions
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerPrescriptions, setCustomerPrescriptions] = useState<any[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);

  // Cart & Financials
  const [cart, setCart] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(12.0);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentType, setPaymentType] = useState<"FULL" | "ADVANCE">("FULL");
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState("");
  const [deliveryDays, setDeliveryDays] = useState(3);

  // Modals & States
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isNewRxOpen, setIsNewRxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      setSelectedCustomer(cust || null);
      fetchCustomerPrescriptions(selectedCustomerId);
    } else {
      setSelectedCustomer(null);
      setCustomerPrescriptions([]);
      setSelectedPrescriptionId("");
      setSelectedPrescription(null);
    }
  }, [selectedCustomerId, customers]);

  useEffect(() => {
    if (selectedPrescriptionId) {
      const rx = customerPrescriptions.find((r) => r.id === selectedPrescriptionId);
      setSelectedPrescription(rx || null);
    } else {
      setSelectedPrescription(null);
    }
  }, [selectedPrescriptionId, customerPrescriptions]);

  const fetchInventory = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomerPrescriptions = async (customerId: string) => {
    try {
      const res = await fetch(`/api/prescriptions?customerId=${customerId}`);
      const data = await res.json();
      if (data.success) {
        setCustomerPrescriptions(data.data);
        if (data.data.length > 0) {
          setSelectedPrescriptionId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unit_price + i.coating_charges + i.fitting_charges,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          sku: item.sku,
          name: `${item.brand} - ${item.model || item.type}`,
          type: item.type,
          unit_price: item.selling_price,
          quantity: 1,
          coating_charges: item.type === "LENS" ? 0 : 0,
          fitting_charges: item.type === "LENS" ? 200 : 0,
          subtotal: item.selling_price + (item.type === "LENS" ? 200 : 0),
        },
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.itemId === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unit_price + item.coating_charges + item.fitting_charges,
            };
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const updateCharges = (itemId: string, field: "coating_charges" | "fitting_charges", val: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const updated = { ...item, [field]: val };
          updated.subtotal = updated.quantity * updated.unit_price + updated.coating_charges + updated.fitting_charges;
          return updated;
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setAdvanceAmount(0);
    setPaymentType("FULL");
    setTransactionRef("");
  };

  // Financial Computations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * gstRate) / 100;
  const finalPayable = taxableAmount + taxAmount;
  const paidAmount =
    paymentType === "FULL"
      ? finalPayable
      : Math.min(finalPayable, advanceAmount || Math.round(finalPayable / 2));
  const balanceDue = Math.max(0, finalPayable - paidAmount);

  // Filtered Inventory Items
  const filteredItems = items.filter((item) => {
    const matchesType = activeType === "ALL" || item.type === activeType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      item.brand.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.model && item.model.toLowerCase().includes(q)) ||
      (item.color && item.color.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      setCheckoutError("Please select an existing customer or register a new patient.");
      return;
    }

    if (cart.length === 0) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    const payload = {
      customerId: selectedCustomerId,
      prescriptionId: selectedPrescriptionId || null,
      items: cart,
      total_amount: subtotal,
      discount_amount: discountAmount,
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      final_payable: parseFloat(finalPayable.toFixed(2)),
      paid_amount: parseFloat(paidAmount.toFixed(2)),
      method: paymentMethod,
      transaction_ref: transactionRef,
      deliveryDays,
    };

    try {
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data.data);
        clearCart();
        fetchInventory();
        fetchCustomers();
      } else {
        setCheckoutError(data.error || "Checkout failed");
      }
    } catch (e: any) {
      setCheckoutError(e.message || "An error occurred during checkout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="VisionPulse POS Register"
        subtitle="Clinical Optical Billing, Prescription Glazing & GST Invoicing"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Inventory Catalog & Fast Selector */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-slate-50">
          <div className="p-4 bg-white border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search frames by brand (Ray-Ban, Titan), model, SKU, or lenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs select-none">
              {[
                { label: "All Items", key: "ALL" },
                { label: "Spectacle Frames", key: "FRAME" },
                { label: "Power Lenses", key: "LENS" },
                { label: "Contact Lenses", key: "CONTACT_LENS" },
                { label: "Accessories", key: "ACCESSORY" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveType(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeType === tab.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingItems ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                Loading VisionPulse catalog...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p>No inventory items match your search or filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const isOutOfStock = item.stock_quantity <= 0;
                  const isLowStock = item.stock_quantity <= item.min_alert_threshold && !isOutOfStock;

                  return (
                    <button
                      key={item.id}
                      onClick={() => !isOutOfStock && addToCart(item)}
                      disabled={isOutOfStock}
                      className={`group flex flex-col text-left p-3 rounded-xl border bg-white shadow-2xs transition-all duration-150 ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed border-slate-200"
                          : "border-slate-200 hover:border-cyan-400 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.type.replace("_", " ")}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {item.stock_quantity} left
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-600">
                            {item.stock_quantity} in stock
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wide truncate w-full">
                        {item.brand}
                      </p>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 h-8 leading-snug">
                        {item.model || item.type}
                      </h4>

                      <div className="text-[10px] text-slate-500 mt-1 mb-2 font-mono h-4 truncate">
                        {item.type === "FRAME" && item.size && <span>{item.size} • {item.color}</span>}
                        {item.type === "LENS" && item.lens_index && <span>Index {item.lens_index}</span>}
                      </div>

                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                        <span className="font-bold text-slate-900 text-xs">
                          {formatCurrency(item.selling_price)}
                        </span>
                        <span className="text-[10px] font-semibold text-cyan-600 group-hover:text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded group-hover:bg-cyan-100 transition-colors">
                          + Add
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Cart, Patient Selector & Billing */}
        <div className="w-96 xl:w-[440px] flex flex-col bg-white border-l border-slate-200 shadow-sm flex-shrink-0">
          {/* Patient Details & Loyalty Card */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-600" /> Customer / Patient *
              </span>
              <button
                onClick={() => setIsNewCustomerOpen(true)}
                className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-800 inline-flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" /> New Patient
              </button>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">-- Select Registered Patient --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) • {c.loyalty_points || 0} pts
                </option>
              ))}
            </select>

            {/* Loyalty points banner */}
            {selectedCustomer && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" /> Loyalty Points
                </span>
                <span className="font-bold text-emerald-700">
                  {selectedCustomer.loyalty_points || 0} Points Available
                </span>
              </div>
            )}

            {/* Prescription Selector */}
            {selectedCustomerId && (
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Glasses className="w-3 h-3 text-cyan-600" /> Link Prescription
                  </span>
                  <button
                    onClick={() => setIsNewRxOpen(true)}
                    className="text-[10px] font-semibold text-cyan-700 hover:underline"
                  >
                    + Add New Rx
                  </button>
                </div>

                {customerPrescriptions.length > 0 ? (
                  <select
                    value={selectedPrescriptionId}
                    onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-cyan-300 rounded-lg text-[11px] text-slate-800 focus:outline-none"
                  >
                    <option value="">-- No Prescription (Retail / OTC) --</option>
                    {customerPrescriptions.map((rx) => (
                      <option key={rx.id} value={rx.id}>
                        Rx by {rx.optometristName || "Dr."} (OD SPH {formatDiopter(rx.od_sph)} / OS SPH {formatDiopter(rx.os_sph)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    No active optical prescription on record.
                  </p>
                )}

                {/* Prescription Quick Glance Pill */}
                {selectedPrescription && (
                  <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-[10px] space-y-0.5">
                    <div className="flex justify-between font-bold text-cyan-950">
                      <span>OD: {formatDiopter(selectedPrescription.od_sph)} / {formatDiopter(selectedPrescription.od_cyl)} x {selectedPrescription.od_axis || "—"}°</span>
                      <span>PD Dist: {selectedPrescription.pd_distance || "—"}mm</span>
                    </div>
                    <div className="flex justify-between text-cyan-900">
                      <span>OS: {formatDiopter(selectedPrescription.os_sph)} / {formatDiopter(selectedPrescription.os_cyl)} x {selectedPrescription.os_axis || "—"}°</span>
                      <span className="font-semibold text-cyan-700 uppercase">{selectedPrescription.lens_type}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-700">
                Cart Items ({cart.length})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[10px] text-rose-600 hover:underline"
                >
                  Clear Register
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                <ShoppingCart className="w-6 h-6 mb-1 opacity-40" />
                <p>Register is empty.</p>
                <p className="text-[10px] text-slate-400">Add frames or lenses from catalog.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.itemId}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-cyan-700 uppercase">
                        {item.type}
                      </p>
                      <h5 className="text-xs font-semibold text-slate-800 leading-tight">
                        {item.name}
                      </h5>
                    </div>
                    <span className="font-bold text-xs text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.itemId, -1)}
                        className="p-1 rounded text-slate-600 hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.itemId, 1)}
                        className="p-1 rounded text-slate-600 hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.type === "LENS" && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-600">
                          <span>Fitting:</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={item.fitting_charges}
                            onChange={(e) =>
                              updateCharges(item.itemId, "fitting_charges", parseFloat(e.target.value) || 0)
                            }
                            className="w-14 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono"
                          />
                        </div>
                      )}

                      <button
                        onClick={() => removeFromCart(item.itemId)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Billing & Payment Controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            {checkoutError && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 px-2 py-0.5 text-right bg-white border border-slate-300 rounded text-xs font-semibold"
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({gstRate}%):</span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Net Payable:</span>
                <span className="text-cyan-700 text-base">{formatCurrency(finalPayable)}</span>
              </div>
            </div>

            {/* Split Payment / Advance Options */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType("FULL")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    paymentType === "FULL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-300 text-slate-700"
                  }`}
                >
                  Full Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType("ADVANCE");
                    setAdvanceAmount(Math.round(finalPayable / 2));
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    paymentType === "ADVANCE"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-300 text-slate-700"
                  }`}
                >
                  Advance Deposit
                </button>
              </div>

              {paymentType === "ADVANCE" && (
                <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-cyan-900">Advance Amount:</span>
                    <input
                      type="number"
                      step="100"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-0.5 text-right bg-white border border-cyan-300 rounded text-xs font-bold text-cyan-900"
                    />
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium text-[11px]">
                    <span>Balance Due at Pickup:</span>
                    <span className="text-rose-600 font-bold">{formatCurrency(balanceDue)}</span>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {["UPI", "CARD", "CASH"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 rounded-lg font-bold text-[11px] border transition-all ${
                      paymentMethod === m
                        ? "bg-cyan-50 border-cyan-600 text-cyan-800 ring-1 ring-cyan-600"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Transaction Ref input for UPI / Card */}
              {paymentMethod !== "CASH" && (
                <input
                  type="text"
                  placeholder="UPI Ref ID / Card Auth Code..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-800"
                />
              )}
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Processing Sale..."
                  : `Complete Sale (${formatCurrency(paidAmount)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onSuccess={(cust) => {
          fetchCustomers();
          setSelectedCustomerId(cust.id);
        }}
      />

      <PrescriptionModal
        isOpen={isNewRxOpen}
        onClose={() => setIsNewRxOpen(false)}
        preselectedCustomerId={selectedCustomerId}
        onSuccess={(rx) => {
          if (selectedCustomerId) {
            fetchCustomerPrescriptions(selectedCustomerId);
            setSelectedPrescriptionId(rx.id);
          }
        }}
      />
    </div>
  );
}
