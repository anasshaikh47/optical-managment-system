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
  DollarSign,
  QrCode,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ReceiptModal } from "@/components/ReceiptModal";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { formatCurrency, formatDiopter } from "@/lib/utils";

export default function POSPage() {
  // Products & Filtering
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  // Customers & Prescriptions
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerPrescriptions, setCustomerPrescriptions] = useState<any[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);

  // Cart & Financials
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(8.875);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [paymentType, setPaymentType] = useState<"FULL" | "DEPOSIT">("FULL");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState("");
  const [deliveryDays, setDeliveryDays] = useState(3);
  const [createLabJob, setCreateLabJob] = useState(false);
  const [labInstructions, setLabInstructions] = useState("");

  // Modals & States
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isNewRxOpen, setIsNewRxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  // When customer changes, load their prescriptions
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

  // When prescription changes, check if we should auto-enable lab job
  useEffect(() => {
    if (selectedPrescriptionId) {
      const rx = customerPrescriptions.find((r) => r.id === selectedPrescriptionId);
      setSelectedPrescription(rx || null);
      setCreateLabJob(true);
    } else {
      setSelectedPrescription(null);
    }
  }, [selectedPrescriptionId, customerPrescriptions]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
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

  // Cart operations
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.sellingPrice,
          quantity: 1,
          discount: 0,
          totalPrice: product.sellingPrice,
          customDetails: "",
          sku: product.sku,
        },
      ];
    });

    if (product.category === "LENS" || product.category === "FRAME") {
      setCreateLabJob(true);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const updateItemDetails = (productId: string, details: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, customDetails: details } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDepositAmount(0);
    setPaymentType("FULL");
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const finalPaidAmount =
    paymentType === "FULL"
      ? grandTotal
      : Math.min(grandTotal, depositAmount || grandTotal / 2);
  const balanceDue = Math.max(0, grandTotal - finalPaidAmount);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "ALL" || p.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    const hasPrescriptionSpecs =
      cart.some((i) => i.category === "FRAME" || i.category === "LENS") &&
      !!selectedPrescriptionId;

    const payload = {
      customerId: selectedCustomerId || null,
      prescriptionId: selectedPrescriptionId || null,
      orderType: hasPrescriptionSpecs
        ? "PRESCRIPTION_SPECS"
        : cart.some((i) => i.category === "CONTACT_LENS")
        ? "CONTACT_LENS"
        : "RETAIL",
      items: cart,
      subtotal,
      discount,
      taxRate,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(grandTotal.toFixed(2)),
      paidAmount: parseFloat(finalPaidAmount.toFixed(2)),
      paymentMethod,
      referenceNo,
      createLabJob,
      labInstructions,
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
        fetchProducts(); // Refresh stock counts
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
        title="POS Counter Register"
        subtitle="Bespoke Spectacles, Retail Checkout & Instant Job Ticketing"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Product Catalog & Search (60%) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-slate-50">
          {/* Top Controls: Search & Category tabs */}
          <div className="p-4 bg-white border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search frames by brand, model, SKU, or lenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs select-none">
              {[
                { label: "All Items", key: "ALL" },
                { label: "Eyewear Frames", key: "FRAME" },
                { label: "Optical Lenses", key: "LENS" },
                { label: "Contact Lenses", key: "CONTACT_LENS" },
                { label: "Accessories & Care", key: "ACCESSORY" },
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
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                Loading optical catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p>No products match your search or filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isLowStock = p.stockQuantity <= p.minStockAlert && !isOutOfStock;

                  return (
                    <button
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      disabled={isOutOfStock}
                      className={`group flex flex-col text-left p-3 rounded-xl border bg-white shadow-2xs transition-all duration-150 ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed border-slate-200"
                          : "border-slate-200 hover:border-cyan-400 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      {/* Product Category Badge & Stock */}
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p.category.replace("_", " ")}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Out
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {p.stockQuantity} left
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-600">
                            {p.stockQuantity} in stock
                          </span>
                        )}
                      </div>

                      {/* Brand & Name */}
                      <p className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide truncate w-full">
                        {p.brand || "Designer Brand"}
                      </p>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 h-8 leading-snug">
                        {p.name}
                      </h4>

                      {/* Frame or Lens Specifications */}
                      <div className="text-[10px] text-slate-500 mt-1 mb-2 font-mono h-4 truncate">
                        {p.category === "FRAME" && p.size && (
                          <span>Size: {p.size} • {p.color}</span>
                        )}
                        {p.category === "LENS" && p.lensIndex && (
                          <span>Index: {p.lensIndex}</span>
                        )}
                        {p.category === "CONTACT_LENS" && (
                          <span>BC: {p.baseCurve || "8.5"} • Dia: {p.diameter || "14.2"}</span>
                        )}
                      </div>

                      {/* Price & Add button */}
                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                        <span className="font-bold text-slate-900 text-xs">
                          {formatCurrency(p.sellingPrice)}
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

        {/* RIGHT COLUMN: Active Cart, Patient Selector & Checkout (40%) */}
        <div className="w-96 xl:w-[440px] flex flex-col bg-white border-l border-slate-200 shadow-sm flex-shrink-0">
          {/* Patient & Prescription Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-600" /> Patient Details
              </span>
              <button
                onClick={() => setIsNewCustomerOpen(true)}
                className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-800 inline-flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" /> New Patient
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Walk-in Retail Guest</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.customerCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Prescription Selector (If customer is selected) */}
            {selectedCustomerId && (
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Glasses className="w-3 h-3 text-cyan-600" /> Link Rx
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
                    className="w-full px-2.5 py-1.5 bg-white border border-cyan-300 rounded-lg text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- No Prescription Linked --</option>
                    {customerPrescriptions.map((rx) => (
                      <option key={rx.id} value={rx.id}>
                        {rx.prescriptionNo} ({rx.lensType || "Rx"}) • OD SPH {formatDiopter(rx.sphOd)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    No active prescriptions on file for this patient.
                  </p>
                )}

                {/* Prescription Quick Glance Pill */}
                {selectedPrescription && (
                  <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-[10px] space-y-0.5">
                    <div className="flex justify-between font-bold text-cyan-950">
                      <span>OD: {formatDiopter(selectedPrescription.sphOd)} / {formatDiopter(selectedPrescription.cylOd)} x {selectedPrescription.axisOd ?? "—"}°</span>
                      <span>PD: {selectedPrescription.pdTotal || "—"}mm</span>
                    </div>
                    <div className="flex justify-between text-cyan-900">
                      <span>OS: {formatDiopter(selectedPrescription.sphOs)} / {formatDiopter(selectedPrescription.cylOs)} x {selectedPrescription.axisOs ?? "—"}°</span>
                      <span className="font-semibold text-cyan-700">{selectedPrescription.lensType}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-700">
                Order Items ({cart.length})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[10px] text-rose-600 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                <ShoppingCart className="w-6 h-6 mb-1 opacity-40" />
                <p>Register is empty.</p>
                <p className="text-[10px] text-slate-400">Click products from the catalog to add.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-cyan-700 uppercase">
                        {item.category}
                      </p>
                      <h5 className="text-xs font-semibold text-slate-800 leading-tight">
                        {item.name}
                      </h5>
                    </div>
                    <span className="font-bold text-xs text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-1 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-1 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Optional Lab / Fitting Instructions per item */}
                  <input
                    type="text"
                    placeholder="Custom lab/glazing instruction..."
                    value={item.customDetails}
                    onChange={(e) => updateItemDetails(item.productId, e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              ))
            )}
          </div>

          {/* Workshop Glazing Options */}
          {createLabJob && (
            <div className="px-4 py-2 bg-amber-50/70 border-t border-b border-amber-200/80 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-amber-700" /> Lab Workshop Job
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">
                  Est. Delivery: {deliveryDays} days
                </span>
              </div>
              <input
                type="text"
                placeholder="Workshop fitting notes (e.g. bevel profile, polish)..."
                value={labInstructions}
                onChange={(e) => setLabInstructions(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-[10px] text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          )}

          {/* Totals & Checkout Summary */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            {checkoutError && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Calculations */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Discount ($):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 px-2 py-0.5 text-right bg-white border border-slate-300 rounded text-xs font-semibold"
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({taxRate}%):</span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-cyan-700 text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Mode (Full vs Advance Deposit) */}
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
                    setPaymentType("DEPOSIT");
                    setDepositAmount(parseFloat((grandTotal / 2).toFixed(2)));
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    paymentType === "DEPOSIT"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-300 text-slate-700"
                  }`}
                >
                  Advance Deposit
                </button>
              </div>

              {paymentType === "DEPOSIT" && (
                <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-cyan-900">Deposit Amount:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-0.5 text-right bg-white border border-cyan-300 rounded text-xs font-bold text-cyan-900"
                    />
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium text-[11px]">
                    <span>Balance at Pickup:</span>
                    <span className="text-rose-600 font-bold">{formatCurrency(balanceDue)}</span>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {["CARD", "CASH", "UPI"].map((m) => (
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
                  : `Complete Sale (${formatCurrency(finalPaidAmount)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onSuccess={(customer) => {
          fetchCustomers();
          setSelectedCustomerId(customer.id);
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
