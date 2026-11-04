"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
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
  Barcode,
  Printer,
  MessageSquare,
  Calendar,
  RotateCcw,
  Eye,
  ArrowRight,
  Clock,
  Send,
  X,
  Phone,
  Check,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { CustomerHistoryModal } from "@/components/CustomerHistoryModal";
import { formatCurrency, formatDate, formatDiopter } from "@/lib/utils";

// Coating pricing presets
const COATING_OPTIONS = [
  { key: "NONE", label: "None (Standard Clear)", price: 0 },
  { key: "BLUE_CUT", label: "Blue-Cut UV420 Filter (+₹500)", price: 500 },
  { key: "ANTI_GLARE", label: "Anti-Glare ARC (+₹400)", price: 400 },
  { key: "PHOTOCHROMIC", label: "Photochromic / Transitions (+₹1,200)", price: 1200 },
  { key: "BLUE_PHOTO", label: "Blue-Cut + Photochromic (+₹1,600)", price: 1600 },
];

// Fitting charges presets
const FITTING_OPTIONS = [
  { key: "STANDARD", label: "Standard Lab Edging & Fitting (+₹200)", price: 200 },
  { key: "RIMLESS", label: "Rimless Drill Mount (+₹400)", price: 400 },
  { key: "FREE", label: "Free / Included Fitting (₹0)", price: 0 },
];

export default function POSPage() {
  const { shopId, tenantFetch } = useAuth();
  // Inventory Items & Filtering
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL");

  // Barcode Scanner Field
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeFeedback, setBarcodeFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Manual Live Product Search & Add to Cart
  const [cartSearchQuery, setCartSearchQuery] = useState("");
  const [isCartSearchFocused, setIsCartSearchFocused] = useState(false);
  const [cartSearchFeedback, setCartSearchFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const cartSearchInputRef = useRef<HTMLInputElement>(null);
  const cartSearchDropdownRef = useRef<HTMLDivElement>(null);

  // Customer Management
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any | null>(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

  // Optical Prescription Matrix
  const [attachPrescription, setAttachPrescription] = useState(true);
  const [rxData, setRxData] = useState({
    optometristName: "Dr. Priya Nair, M.Opt",
    od_sph: "",
    od_cyl: "",
    od_axis: "",
    od_add: "",
    os_sph: "",
    os_cyl: "",
    os_axis: "",
    os_add: "",
    pd_distance: "63.0",
    pd_near: "60.0",
    lens_type: "SINGLE_VISION",
    notes: "",
  });
  const [rxLoadedAlert, setRxLoadedAlert] = useState<string | null>(null);

  // Cart & Financials
  const [cart, setCart] = useState<any[]>([]);
  const [discountMode, setDiscountMode] = useState<"FLAT" | "PERCENT">("FLAT");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(12.0); // Optical GST standard 12%

  // Advance & Payments
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [isAdvanceUserModified, setIsAdvanceUserModified] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");

  // Delivery Due Date (Default: +2 days)
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  // Modals & UI States
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Load Inventory & Customers on Mount
  useEffect(() => {
    fetchInventory();
    fetchCustomers();
    // Auto-focus barcode scanner input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }

    const handleCustomerCreated = (e: any) => {
      fetchCustomers();
      if (e?.detail?.id) {
        setSelectedCustomerId(e.detail.id);
        setCustomerSearch(e.detail.name || "");
      }
    };
    window.addEventListener("customer-created", handleCustomerCreated);
    return () => window.removeEventListener("customer-created", handleCustomerCreated);
  }, [shopId]);

  // Fetch full details of selected customer
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetails(selectedCustomerId);
    } else {
      setSelectedCustomerDetails(null);
    }
  }, [selectedCustomerId]);

  const fetchInventory = async () => {
    setLoadingItems(true);
    try {
      const res = await tenantFetch("/api/products");
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
      const res = await tenantFetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomerDetails = async (id: string) => {
    setIsCustomerLoading(true);
    try {
      const res = await tenantFetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCustomerDetails(data.data);
        // If customer has previous prescription and current rx is blank, we can notify them
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCustomerLoading(false);
    }
  };

  // Add Item to Cart
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

      // Default fitting charge for lens vs frame
      const defaultFitting = item.type === "LENS" ? 200 : 0;
      return [
        ...prev,
        {
          itemId: item.id,
          sku: item.sku,
          brand: item.brand,
          model: item.model || item.type,
          name: `${item.brand} - ${item.model || item.type}`,
          type: item.type,
          unit_price: item.selling_price,
          quantity: 1,
          coating_key: "NONE",
          coating_charges: 0,
          fitting_key: item.type === "LENS" ? "STANDARD" : "FREE",
          fitting_charges: defaultFitting,
          subtotal: item.selling_price + defaultFitting,
          image_url: item.image_url,
        },
      ];
    });
  };

  // Barcode Scanner Handler on Enter Key
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = barcodeInput.trim().toLowerCase();
      if (!query) return;

      const found = items.find(
        (i) =>
          i.sku.toLowerCase() === query ||
          i.brand.toLowerCase() === query ||
          (i.model && i.model.toLowerCase() === query)
      );

      if (found) {
        if (found.stock_quantity <= 0) {
          setBarcodeFeedback({
            type: "error",
            message: `SKU ${found.sku} (${found.brand}) is Out of Stock!`,
          });
        } else {
          addToCart(found);
          setBarcodeFeedback({
            type: "success",
            message: `Scanned & Added: ${found.brand} - ${found.model || found.type} (${formatCurrency(found.selling_price)})`,
          });
        }
      } else {
        setBarcodeFeedback({
          type: "error",
          message: `Barcode / SKU "${barcodeInput}" not found in inventory catalog.`,
        });
      }

      setBarcodeInput("");
      setTimeout(() => {
        setBarcodeFeedback(null);
      }, 3500);
    }
  };

  // Close cart search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        cartSearchDropdownRef.current &&
        !cartSearchDropdownRef.current.contains(e.target as Node) &&
        cartSearchInputRef.current &&
        !cartSearchInputRef.current.contains(e.target as Node)
      ) {
        setIsCartSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic live filtered products for cart search
  const cartFilteredProducts = cartSearchQuery.trim()
    ? items
        .filter((item) => {
          const q = cartSearchQuery.toLowerCase().trim();
          return (
            item.brand?.toLowerCase().includes(q) ||
            item.model?.toLowerCase().includes(q) ||
            item.sku?.toLowerCase().includes(q) ||
            item.type?.toLowerCase().includes(q) ||
            item.color?.toLowerCase().includes(q) ||
            `${item.brand} ${item.model}`.toLowerCase().includes(q)
          );
        })
        .slice(0, 10)
    : [];

  const handleAddFromSearch = (item: any) => {
    if (item.stock_quantity <= 0) {
      setCartSearchFeedback({
        type: "error",
        message: `${item.brand} - ${item.model || item.sku} is Out of Stock!`,
      });
      setTimeout(() => setCartSearchFeedback(null), 3500);
      return;
    }
    addToCart(item);
    setCartSearchQuery("");
    setIsCartSearchFocused(false);
    setCartSearchFeedback({
      type: "success",
      message: `Added: ${item.brand} - ${item.model || item.type} (${formatCurrency(item.selling_price)})`,
    });
    setTimeout(() => setCartSearchFeedback(null), 3000);
  };

  const handleCartSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = cartSearchQuery.trim().toLowerCase();
      if (!q) return;

      // Check exact SKU or model match first
      const exactMatch = items.find(
        (item) =>
          item.sku?.toLowerCase() === q ||
          item.model?.toLowerCase() === q ||
          `${item.brand} ${item.model}`.toLowerCase() === q
      );

      const targetItem = exactMatch || cartFilteredProducts[0];

      if (targetItem) {
        handleAddFromSearch(targetItem);
      } else {
        setCartSearchFeedback({
          type: "error",
          message: `No product found matching "${cartSearchQuery}"`,
        });
        setTimeout(() => setCartSearchFeedback(null), 3000);
      }
    } else if (e.key === "Escape") {
      setIsCartSearchFocused(false);
    }
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

  const updateCoating = (itemId: string, coatingKey: string) => {
    const opt = COATING_OPTIONS.find((c) => c.key === coatingKey);
    const charge = opt ? opt.price : 0;

    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const updated = {
            ...item,
            coating_key: coatingKey,
            coating_charges: charge,
          };
          updated.subtotal =
            updated.quantity * updated.unit_price + updated.coating_charges + updated.fitting_charges;
          return updated;
        }
        return item;
      })
    );
  };

  const updateFitting = (itemId: string, fittingKey: string) => {
    const opt = FITTING_OPTIONS.find((f) => f.key === fittingKey);
    const charge = opt ? opt.price : 0;

    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const updated = {
            ...item,
            fitting_key: fittingKey,
            fitting_charges: charge,
          };
          updated.subtotal =
            updated.quantity * updated.unit_price + updated.coating_charges + updated.fitting_charges;
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
    setDiscountValue(0);
    setAdvancePaid(0);
    setIsAdvanceUserModified(false);
    setTransactionRef("");
    setCheckoutError(null);
  };

  // Duplicate / Load previous prescription from customer history
  const loadPreviousRx = (customRx?: any) => {
    const targetRx = customRx || selectedCustomerDetails?.prescriptions?.[0];
    if (!targetRx) {
      setRxLoadedAlert("No prior refraction prescription on record for this customer.");
      setTimeout(() => setRxLoadedAlert(null), 3000);
      return;
    }

    setRxData({
      optometristName: targetRx.optometristName || "Dr. Staff Optometrist",
      od_sph: targetRx.od_sph !== null && targetRx.od_sph !== undefined ? targetRx.od_sph.toString() : "",
      od_cyl: targetRx.od_cyl !== null && targetRx.od_cyl !== undefined ? targetRx.od_cyl.toString() : "",
      od_axis: targetRx.od_axis !== null && targetRx.od_axis !== undefined ? targetRx.od_axis.toString() : "",
      od_add: targetRx.od_add !== null && targetRx.od_add !== undefined ? targetRx.od_add.toString() : "",
      os_sph: targetRx.os_sph !== null && targetRx.os_sph !== undefined ? targetRx.os_sph.toString() : "",
      os_cyl: targetRx.os_cyl !== null && targetRx.os_cyl !== undefined ? targetRx.os_cyl.toString() : "",
      os_axis: targetRx.os_axis !== null && targetRx.os_axis !== undefined ? targetRx.os_axis.toString() : "",
      os_add: targetRx.os_add !== null && targetRx.os_add !== undefined ? targetRx.os_add.toString() : "",
      pd_distance: targetRx.pd_distance ? targetRx.pd_distance.toString() : "63.0",
      pd_near: targetRx.pd_near ? targetRx.pd_near.toString() : "60.0",
      lens_type: targetRx.lens_type || "SINGLE_VISION",
      notes: targetRx.notes || "",
    });

    setAttachPrescription(true);
    setRxLoadedAlert(
      `Prescription copied from Dr. ${targetRx.optometristName || "Optometrist"} (${formatDate(targetRx.createdAt)})`
    );
    setTimeout(() => setRxLoadedAlert(null), 4000);
  };

  // Financial Calculations
  const rawSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const calculatedDiscount =
    discountMode === "PERCENT"
      ? Math.round((rawSubtotal * (discountValue || 0)) / 100)
      : Math.min(rawSubtotal, discountValue || 0);

  const taxableAmount = Math.max(0, rawSubtotal - calculatedDiscount);
  const totalTax = (taxableAmount * gstRate) / 100;
  const cgstAmount = totalTax / 2;
  const sgstAmount = totalTax / 2;
  const finalPayable = Math.round(taxableAmount + totalTax);

  // Auto-set advance paid to full unless user explicitly modified it
  useEffect(() => {
    if (!isAdvanceUserModified) {
      setAdvancePaid(finalPayable);
    }
  }, [finalPayable, isAdvanceUserModified]);

  const effectiveAdvancePaid = Math.min(finalPayable, Math.max(0, advancePaid || 0));
  const balanceRemaining = Math.max(0, finalPayable - effectiveAdvancePaid);
  const paymentStatus = balanceRemaining === 0 ? "PAID" : "PARTIAL";

  // Calculate past unpaid dues of selected customer
  const pastUnpaidDues = (selectedCustomerDetails?.orders || [])
    .filter((o: any) => o.status !== "CANCELLED")
    .reduce((sum: number, o: any) => sum + (o.balance_amount || 0), 0);

  // Customer Autocomplete Filter
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Filtered Catalog
  const filteredItems = items.filter((item) => {
    const matchesType = activeType === "ALL" || item.type === activeType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      item.brand.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.model && item.model.toLowerCase().includes(q)) ||
      (item.color && item.color.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  // Generate WhatsApp Direct URL
  const generateWhatsAppUrl = (order: any, customer: any) => {
    if (!customer?.phone) return null;
    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    const itemsSummary = order.items
      ?.map(
        (it: any) =>
          `• ${it.item ? `${it.item.brand} - ${it.item.model || it.item.type}` : "Eyewear Item"} (x${it.quantity}) - ₹${it.subtotal}`
      )
      .join("\n");

    const deliveryFormatted = order.delivery_due_date
      ? new Date(order.delivery_due_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "2 Days";

    let rxSummary = "";
    if (attachPrescription && (rxData.od_sph || rxData.os_sph)) {
      rxSummary = `\n👁️ *Refraction Prescription*:
• OD (Right): SPH ${rxData.od_sph || "0.00"} | CYL ${rxData.od_cyl || "0.00"} x ${rxData.od_axis || "0"}° ${rxData.od_add ? `| ADD +${rxData.od_add}` : ""}
• OS (Left): SPH ${rxData.os_sph || "0.00"} | CYL ${rxData.os_cyl || "0.00"} x ${rxData.os_axis || "0"}° ${rxData.os_add ? `| ADD +${rxData.os_add}` : ""}
• Lens Type: ${rxData.lens_type.replace("_", " ")} | PD: ${rxData.pd_distance}mm`;
    }

    const message = `👓 *VISIONPULSE EYEWEAR STUDIO*
Precision Clinical Optometry & Premium Eyewear

Dear *${customer.name}*,
Thank you for choosing VisionPulse! Your order has been registered:

🧾 *Bill / Job Order*: #${order.bill_no}
📅 *Ready for Pickup*: ${deliveryFormatted}

💰 *Payment Breakdown*:
• Net Payable: ₹${order.final_payable}
• Advance Paid: ₹${order.paid_amount} (${paymentMethod})
• Balance Due at Delivery: ₹${order.balance_amount}

📦 *Items*:
${itemsSummary}
${rxSummary}

📍 *Store Location*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Helpline*: +91 98201 12345
We will message you the moment your glasses pass optical lab inspection!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Submit Order Execution
  const handleCheckout = async (targetAction: "PRINT" | "WHATSAPP") => {
    if (!selectedCustomerId) {
      setCheckoutError("Please select a registered patient or create a new patient profile.");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Your cart is empty. Please add at least one frame or lens.");
      return;
    }

    if (effectiveAdvancePaid < 0) {
      setCheckoutError("Advance payment cannot be a negative value.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    const payload = {
      customerId: selectedCustomerId,
      items: cart,
      total_amount: rawSubtotal,
      discount_amount: calculatedDiscount,
      tax_amount: parseFloat(totalTax.toFixed(2)),
      final_payable: finalPayable,
      paid_amount: effectiveAdvancePaid,
      method: paymentMethod,
      transaction_ref: transactionRef,
      delivery_due_date: deliveryDate,
      prescriptionData:
        attachPrescription && (rxData.od_sph !== "" || rxData.os_sph !== "") ? rxData : null,
    };

    try {
      const res = await tenantFetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, shopId, userId: shopId }),
      });

      const data = await res.json();
      if (data.success) {
        const orderData = data.data;
        setCompletedOrder(orderData);

        // If WhatsApp requested, open chat window
        if (targetAction === "WHATSAPP") {
          const waUrl = generateWhatsAppUrl(orderData, selectedCustomerDetails);
          if (waUrl) {
            window.open(waUrl, "_blank");
          }
        }

        clearCart();
        fetchInventory();
        fetchCustomers();
      } else {
        setCheckoutError(data.error || "Checkout transaction failed");
      }
    } catch (e: any) {
      setCheckoutError(e.message || "An unexpected error occurred during checkout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">

      {/* Barcode Flash Toast Feedback */}
      {barcodeFeedback && (
        <div
          className={`fixed top-18 right-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg animate-in slide-in-from-top duration-200 ${
            barcodeFeedback.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {barcodeFeedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{barcodeFeedback.message}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Fast Barcode, Catalog & Prescription Matrix */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 overflow-y-auto">
          {/* Top Sticky Barcode & Search Controls */}
          <div className="p-4 bg-white border-b border-slate-200 space-y-3 sticky top-0 z-10 shadow-xs">
            {/* High-speed Barcode Scanner Field */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-cyan-700">
                <Barcode className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-100 px-1 py-0.2 rounded">
                  SCANNER
                </span>
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan Barcode / SKU and hit Enter (e.g., RB-5154, ZEISS-SV156, ESSILOR-CRIZAL)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                className="w-full pl-28 pr-4 py-2.5 bg-cyan-50/50 border-2 border-cyan-400 rounded-xl text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Catalog Search & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter catalog by brand, model, frame color, or lens index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 text-xs select-none">
                {[
                  { label: "All Items", key: "ALL" },
                  { label: "Frames", key: "FRAME" },
                  { label: "Power Lenses", key: "LENS" },
                  { label: "Contact Lenses", key: "CONTACT_LENS" },
                  { label: "Accessories", key: "ACCESSORY" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveType(tab.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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
          </div>

          {/* Product Catalog Grid */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-600" />
                Available Optical Inventory ({filteredItems.length})
              </span>
              <span className="text-[11px] text-slate-400">Click item card to add to billing cart</span>
            </div>

            {loadingItems ? (
              <div className="flex items-center justify-center h-36 text-slate-400 text-xs">
                Loading VisionPulse catalog...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
                <Package className="w-6 h-6 mb-1 opacity-50" />
                <p>No inventory items match &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredItems.map((item) => {
                  const isOutOfStock = item.stock_quantity <= 0;
                  const isLowStock = item.stock_quantity <= item.min_alert_threshold && !isOutOfStock;

                  return (
                    <button
                      key={item.id}
                      onClick={() => !isOutOfStock && addToCart(item)}
                      disabled={isOutOfStock}
                      className={`group flex flex-col text-left p-2.5 rounded-xl border bg-white shadow-2xs transition-all duration-150 ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed border-slate-200"
                          : "border-slate-200 hover:border-cyan-400 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.type.replace("_", " ")}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Out
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {item.stock_quantity} left
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-emerald-600">
                            {item.stock_quantity} left
                          </span>
                        )}
                      </div>

                      {item.image_url ? (
                        <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 my-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt={item.brand}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}

                      <p className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide truncate w-full">
                        {item.brand}
                      </p>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 leading-snug">
                        {item.model || item.type}
                      </h4>

                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        SKU: {item.sku}
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between w-full">
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

          {/* ======================================================== */}
          {/* OPTICAL PRESCRIPTION MATRIX (OD & OS Card Layout)       */}
          {/* ======================================================== */}
          <div className="p-4 pt-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Prescription Header & Controls */}
              <div className="p-3.5 bg-gradient-to-r from-slate-50 to-cyan-50/40 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                    <Glasses className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      Optical Prescription Refraction Matrix (OD & OS)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Standard diopter measurements (-20.00 to +20.00 SPH, -6.00 to +6.00 CYL, AXIS 1-180°)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={attachPrescription}
                      onChange={(e) => setAttachPrescription(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Attach Rx to Bill</span>
                  </label>

                  {/* Load Previous Prescription Button */}
                  <button
                    onClick={() => loadPreviousRx()}
                    disabled={!selectedCustomerDetails?.prescriptions?.length}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={
                      selectedCustomerDetails?.prescriptions?.length
                        ? "Duplicate values from last checkup"
                        : "Select a customer with past prescription history"
                    }
                  >
                    <Sparkles className="w-3 h-3 text-cyan-600" />
                    <span>Load Previous Rx</span>
                  </button>
                </div>
              </div>

              {rxLoadedAlert && (
                <div className="px-4 py-2 bg-cyan-100/70 border-b border-cyan-200 text-cyan-900 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
                  <span>{rxLoadedAlert}</span>
                </div>
              )}

              {attachPrescription ? (
                <div className="p-4 space-y-4 text-xs">
                  {/* OD (Right Eye) & OS (Left Eye) Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* OD Card: Right Eye */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="font-bold text-xs text-cyan-900 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-cyan-600" />
                          Right Eye (OD - Oculus Dexter)
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-bold">
                          OD
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            SPH (D)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="-20.00"
                            max="20.00"
                            placeholder="-1.50"
                            value={rxData.od_sph}
                            onChange={(e) => setRxData({ ...rxData, od_sph: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            CYL (D)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="-6.00"
                            max="6.00"
                            placeholder="-0.50"
                            value={rxData.od_cyl}
                            onChange={(e) => setRxData({ ...rxData, od_cyl: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            AXIS (°)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="180"
                            placeholder="90"
                            value={rxData.od_axis}
                            onChange={(e) => setRxData({ ...rxData, od_axis: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            ADD (Near)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0.75"
                            max="4.00"
                            placeholder="+1.75"
                            value={rxData.od_add}
                            onChange={(e) => setRxData({ ...rxData, od_add: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* OS Card: Left Eye */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          Left Eye (OS - Oculus Sinister)
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                          OS
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            SPH (D)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="-20.00"
                            max="20.00"
                            placeholder="-1.25"
                            value={rxData.os_sph}
                            onChange={(e) => setRxData({ ...rxData, os_sph: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            CYL (D)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="-6.00"
                            max="6.00"
                            placeholder="-0.75"
                            value={rxData.os_cyl}
                            onChange={(e) => setRxData({ ...rxData, os_cyl: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            AXIS (°)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="180"
                            placeholder="85"
                            value={rxData.os_axis}
                            onChange={(e) => setRxData({ ...rxData, os_axis: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            ADD (Near)
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0.75"
                            max="4.00"
                            placeholder="+1.75"
                            value={rxData.os_add}
                            onChange={(e) => setRxData({ ...rxData, os_add: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center text-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PD & Lens Selection Radio Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                    {/* Pupillary Distance (PD) */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          PD Distance (mm)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="50"
                          max="75"
                          value={rxData.pd_distance}
                          onChange={(e) => setRxData({ ...rxData, pd_distance: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-center font-bold text-slate-800"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          PD Near (mm)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="48"
                          max="72"
                          value={rxData.pd_near}
                          onChange={(e) => setRxData({ ...rxData, pd_near: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-center font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Lens Type Selection Radio */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Lens Optical Design Type
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key: "SINGLE_VISION", label: "Single Vision" },
                          { key: "BIFOCAL", label: "Bifocal (D-Seg / Kryptok)" },
                          { key: "PROGRESSIVE", label: "Progressive (Multifocal)" },
                        ].map((lens) => (
                          <label
                            key={lens.key}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                              rxData.lens_type === lens.key
                                ? "bg-cyan-50 border-cyan-500 text-cyan-900"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="lens_type"
                              value={lens.key}
                              checked={rxData.lens_type === lens.key}
                              onChange={(e) => setRxData({ ...rxData, lens_type: e.target.value })}
                              className="text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="truncate">{lens.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Optometrist & Lab Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Prescribing Optometrist
                      </label>
                      <input
                        type="text"
                        value={rxData.optometristName}
                        onChange={(e) => setRxData({ ...rxData, optometristName: e.target.value })}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                        placeholder="Dr. Staff Optometrist"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Lab Glazing Instructions / Frame Notes
                      </label>
                      <input
                        type="text"
                        value={rxData.notes}
                        onChange={(e) => setRxData({ ...rxData, notes: e.target.value })}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                        placeholder="e.g., High index 1.67 required, computer distance"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 italic">
                  Prescription attachment disabled for this bill (Retail OTC purchase).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Customer Lookup, Active Cart & Financials */}
        {/* ======================================================== */}
        <div className="w-full lg:w-96 xl:w-[460px] flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shadow-sm flex-shrink-0 overflow-y-auto">
          {/* SECTION 1: Customer Lookup & Auto-fill */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-600" /> Customer / Patient Profile *
              </span>
              <button
                onClick={() => setIsNewCustomerOpen(true)}
                className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md hover:bg-cyan-100 transition-colors"
              >
                <UserPlus className="w-3 h-3" /> + New Patient
              </button>
            </div>

            {/* Customer Search Input with Live Dropdown Auto-fill */}
            {!selectedCustomerId ? (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by phone number (9820...) or patient name..."
                  value={customerSearch}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
                />

                {/* Suggestions Dropdown */}
                {showCustomerDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto z-30 divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        <p>No customer found matching &ldquo;{customerSearch}&rdquo;</p>
                        <button
                          onClick={() => {
                            setShowCustomerDropdown(false);
                            setIsNewCustomerOpen(true);
                          }}
                          className="mt-2 text-cyan-700 font-bold hover:underline"
                        >
                          + Quick Register Patient
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <button
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomerId(cust.id);
                            setShowCustomerDropdown(false);
                            setCustomerSearch("");
                          }}
                          className="w-full text-left p-2.5 hover:bg-cyan-50/60 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{cust.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" /> {cust.phone}
                            </p>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {cust.loyalty_points || 0} pts
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Customer Summary Card */
              selectedCustomerDetails && (
                <div className="p-3 rounded-xl bg-white border border-cyan-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {selectedCustomerDetails.name}
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5" /> {selectedCustomerDetails.loyalty_points || 0} pts
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                        {selectedCustomerDetails.phone}
                        {selectedCustomerDetails.dob && (
                          <span> • DOB: {formatDate(selectedCustomerDetails.dob)}</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCustomerId("");
                        setSelectedCustomerDetails(null);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Previous Unpaid Dues Alert */}
                  {pastUnpaidDues > 0 ? (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Previous Unpaid Dues:</span>
                        <span className="text-rose-700 font-black">{formatCurrency(pastUnpaidDues)}</span>
                      </div>
                      <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="text-[10px] font-bold underline hover:text-rose-900"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> No outstanding past dues on account.
                    </div>
                  )}

                  {/* Actions: Past Prescriptions Drawer Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="text-cyan-700 hover:text-cyan-900 font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <Glasses className="w-3 h-3" /> Past Prescription History ({selectedCustomerDetails.prescriptions?.length || 0})
                    </button>

                    {selectedCustomerDetails.prescriptions?.length > 0 && (
                      <button
                        onClick={() => loadPreviousRx()}
                        className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded hover:bg-cyan-100"
                      >
                        Copy Rx
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* SECTION 2: Active Cart & Item Breakdown */}
          <div className="flex-1 p-4 space-y-3">
            {/* Live Product Search & Manual Add Input (Without Physical Scanner) */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none" />
                <input
                  ref={cartSearchInputRef}
                  type="text"
                  placeholder="Search product by Model / Name / SKU / Key Number..."
                  value={cartSearchQuery}
                  onChange={(e) => {
                    setCartSearchQuery(e.target.value);
                    setIsCartSearchFocused(true);
                  }}
                  onFocus={() => setIsCartSearchFocused(true)}
                  onKeyDown={handleCartSearchKeyDown}
                  className="w-full pl-9 pr-14 py-2.5 bg-white border border-slate-300 hover:border-cyan-400 focus:border-cyan-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-2xs transition-all font-medium"
                />
                {cartSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCartSearchQuery("");
                      setIsCartSearchFocused(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded pointer-events-none">
                    Enter ↵
                  </kbd>
                )}
              </div>

              {/* Feedback Alert Banner */}
              {cartSearchFeedback && (
                <div
                  className={`mt-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-150 ${
                    cartSearchFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {cartSearchFeedback.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate">{cartSearchFeedback.message}</span>
                </div>
              )}

              {/* Dynamic Live Matching Dropdown */}
              {isCartSearchFocused && cartSearchQuery.trim().length > 0 && (
                <div
                  ref={cartSearchDropdownRef}
                  className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Matching Products ({cartFilteredProducts.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Press Enter or click Add</span>
                  </div>

                  {cartFilteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No products found matching &ldquo;{cartSearchQuery}&rdquo;</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Try searching brand, model code (e.g. RB3025), or barcode SKU.</p>
                    </div>
                  ) : (
                    cartFilteredProducts.map((prod) => {
                      const isOutOfStock = prod.stock_quantity <= 0;
                      return (
                        <div
                          key={prod.id}
                          onClick={() => !isOutOfStock && handleAddFromSearch(prod)}
                          className={`p-2.5 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                            isOutOfStock
                              ? "opacity-60 bg-slate-50 cursor-not-allowed"
                              : "hover:bg-cyan-50/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.brand}
                                className="w-10 h-10 rounded-lg border border-slate-200 object-cover shrink-0 bg-slate-50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center shrink-0">
                                <Glasses className="w-5 h-5 text-slate-400" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                                  {prod.type}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 font-semibold truncate">
                                  {prod.sku}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-900 truncate mt-0.5">
                                {prod.brand} - {prod.model || prod.type}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] mt-0.5">
                                <span
                                  className={`font-semibold ${
                                    isOutOfStock
                                      ? "text-rose-600 font-bold"
                                      : prod.stock_quantity <= prod.min_alert_threshold
                                      ? "text-amber-600 font-bold"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {isOutOfStock ? "Out of stock" : `${prod.stock_quantity} in stock`}
                                </span>
                                {prod.color && (
                                  <span className="text-slate-400 truncate">• {prod.color}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-black text-slate-900 text-xs">
                              {formatCurrency(prod.selling_price)}
                            </span>
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddFromSearch(prod);
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                isOutOfStock
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs hover:scale-105 active:scale-95"
                              }`}
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                              <span>Add to Bill</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-cyan-600" /> Cart Items ({cart.length})
              </span>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[10px] text-rose-600 hover:underline">
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ShoppingCart className="w-6 h-6 mb-1 opacity-40" />
                <p className="font-semibold text-slate-500">Cart is empty</p>
                <p className="text-[10px] text-slate-400">Scan barcode or pick frames & lenses.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.map((item) => (
                  <div
                    key={item.itemId}
                    className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {item.image_url ? (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                              {item.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 leading-tight mt-0.5">
                            {item.name}
                          </h5>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>

                    {/* Coating & Fitting Charges Breakdowns for Lenses or Frames */}
                    {(item.type === "LENS" || item.type === "FRAME") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[10px]">
                        <div>
                          <label className="block text-slate-500 font-semibold mb-0.5">
                            Coating Treatment:
                          </label>
                          <select
                            value={item.coating_key || "NONE"}
                            onChange={(e) => updateCoating(item.itemId, e.target.value)}
                            className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700"
                          >
                            {COATING_OPTIONS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-0.5">
                            Fitting / Edging:
                          </label>
                          <select
                            value={item.fitting_key || "FREE"}
                            onChange={(e) => updateFitting(item.itemId, e.target.value)}
                            className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700"
                          >
                            {FITTING_OPTIONS.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Qty & Delete controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.itemId, -1)}
                          className="p-1 rounded text-slate-600 hover:bg-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.itemId, 1)}
                          className="p-1 rounded text-slate-600 hover:bg-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">
                          Rate: {formatCurrency(item.unit_price)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: Live Totals & Advance/Balance Calculation */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3.5">
            {checkoutError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Items + Services):</span>
                <span className="font-semibold">{formatCurrency(rawSubtotal)}</span>
              </div>

              {/* Discount Input with ₹ / % Mode Toggle */}
              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1">
                  <span>Discount:</span>
                  <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-white text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDiscountMode("FLAT")}
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        discountMode === "FLAT" ? "bg-slate-900 text-white" : "text-slate-600"
                      }`}
                    >
                      ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode("PERCENT")}
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        discountMode === "PERCENT" ? "bg-slate-900 text-white" : "text-slate-600"
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-0.5 text-right bg-white border border-slate-300 rounded text-xs font-semibold"
                  />
                  {calculatedDiscount > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      (-{formatCurrency(calculatedDiscount)})
                    </span>
                  )}
                </div>
              </div>

              {/* GST Breakdown (12% standard) */}
              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1">
                  <span>GST Rate:</span>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value))}
                    className="px-1.5 py-0.2 bg-white border border-slate-300 rounded text-[10px] font-bold"
                  >
                    <option value={12}>12% (CGST 6% + SGST 6%)</option>
                    <option value={18}>18% (CGST 9% + SGST 9%)</option>
                    <option value={0}>0% (Tax Exempt)</option>
                  </select>
                </div>
                <span className="font-semibold">{formatCurrency(totalTax)}</span>
              </div>

              {/* Net Final Payable */}
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Final Net Payable:</span>
                <span className="text-cyan-700 text-lg font-black">{formatCurrency(finalPayable)}</span>
              </div>
            </div>

            {/* Advance & Balance Payment Card */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-600" /> Advance & Balance Calculation
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {paymentStatus === "PAID" ? "STATUS: PAID" : "STATUS: PARTIAL ADVANCE"}
                </span>
              </div>

              {/* Quick Presets for Advance */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setAdvancePaid(finalPayable);
                    setIsAdvanceUserModified(true);
                  }}
                  className="py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Full (100%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdvancePaid(Math.round(finalPayable * 0.5));
                    setIsAdvanceUserModified(true);
                  }}
                  className="py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  50% Advance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdvancePaid(Math.min(1000, finalPayable));
                    setIsAdvanceUserModified(true);
                  }}
                  className="py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  ₹1,000
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdvancePaid(0);
                    setIsAdvanceUserModified(true);
                  }}
                  className="py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Pay on Pickup
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Advance Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={finalPayable}
                    value={advancePaid}
                    onChange={(e) => {
                      setAdvancePaid(parseFloat(e.target.value) || 0);
                      setIsAdvanceUserModified(true);
                    }}
                    className="w-full px-2 py-1 bg-white border border-cyan-300 rounded text-xs font-bold text-cyan-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Balance Remaining
                  </label>
                  <div
                    className={`px-2 py-1 rounded text-xs font-extrabold ${
                      balanceRemaining > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {formatCurrency(balanceRemaining)}
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["UPI", "CASH", "CARD"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1 rounded-lg font-bold text-[11px] border transition-all ${
                        paymentMethod === m
                          ? "bg-cyan-600 text-white border-cyan-600 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Ref input for UPI / Card */}
              {paymentMethod !== "CASH" && (
                <input
                  type="text"
                  placeholder="UPI Ref ID / Card Auth Code..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800"
                />
              )}

              {/* Delivery Due Date Picker */}
              <div className="pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-600" /> Delivery Ready By:
                  </label>
                  <div className="flex gap-1 text-[9px]">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 2);
                        setDeliveryDate(d.toISOString().split("T")[0]);
                      }}
                      className="px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 font-semibold"
                    >
                      +2 Days (Std)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setDeliveryDate(d.toISOString().split("T")[0]);
                      }}
                      className="px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 font-semibold"
                    >
                      +1 Day (Urgent)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        setDeliveryDate(d.toISOString().split("T")[0]);
                      }}
                      className="px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 font-semibold"
                    >
                      Today
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* SECTION 4: Dual Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Button 1: Save & Print Lab Job Slip */}
              <button
                type="button"
                onClick={() => handleCheckout("PRINT")}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Save & Print Slip</span>
              </button>

              {/* Button 2: Save & Send WhatsApp Confirmation */}
              <button
                type="button"
                onClick={() => handleCheckout("WHATSAPP")}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Save & WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Order Receipt & Lab Job Slip Modal */}
      {completedOrder && (
        <ReceiptModal order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}

      {/* New Patient Registration Modal */}
      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onSuccess={(cust) => {
          fetchCustomers();
          setSelectedCustomerId(cust.id);
        }}
      />

      {/* Customer Prescriptions & Order History Modal */}
      <CustomerHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        customer={selectedCustomerDetails}
        onSelectPrescription={(rx) => loadPreviousRx(rx)}
      />
    </div>
  );
}
