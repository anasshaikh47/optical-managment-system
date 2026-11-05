"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  UserPlus,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Package,
  Barcode,
  Printer,
  MessageSquare,
  Calendar,
  X,
  Phone,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  Pill,
  FileText,
  ShieldAlert,
  Camera,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { CustomerHistoryModal } from "@/components/CustomerHistoryModal";
import { formatCurrency, formatDate, getExpiryStatus } from "@/lib/utils";

export default function POSPage() {
  const { shopId, tenantFetch } = useAuth();

  // Inventory Items & Filtering
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePackType, setActivePackType] = useState("ALL");

  // Barcode Scanner Field
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeFeedback, setBarcodeFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Quick Cart Search Input
  const [cartSearchQuery, setCartSearchQuery] = useState("");
  const [isCartSearchFocused, setIsCartSearchFocused] = useState(false);
  const [cartSearchFeedback, setCartSearchFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const cartSearchInputRef = useRef<HTMLInputElement>(null);
  const cartSearchDropdownRef = useRef<HTMLDivElement>(null);

  // Search Mode & UI toggles
  const [searchMode, setSearchMode] = useState<"SEARCH" | "BARCODE">("SEARCH");
  const [isRxAccordionOpen, setIsRxAccordionOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateMedia = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    updateMedia();
    window.addEventListener("resize", updateMedia);
    return () => window.removeEventListener("resize", updateMedia);
  }, []);

  // Customer Management
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any | null>(null);

  // Doctor & Rx Details
  const [attachPrescription, setAttachPrescription] = useState(false);
  const [rxData, setRxData] = useState({
    patientName: "",
    patientAge: "",
    doctorName: "Dr. Sandeep Deshmukh, MD",
    clinicOrHospital: "Apollo Clinic & Healthcare",
    doctorRegNo: "MCI-48921",
    dosageInstructions: "1-0-1 (After Meals)",
    notes: "",
    prescriptionImage: "",
  });
  const [rxLoadedAlert, setRxLoadedAlert] = useState<string | null>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  // Cart & Financials
  const [cart, setCart] = useState<any[]>([]);
  const [discountMode, setDiscountMode] = useState<"FLAT" | "PERCENT">("FLAT");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(12.0); // Pharmacy GST standard 12%

  // Advance & Payments
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [isAdvanceUserModified, setIsAdvanceUserModified] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");

  // Delivery Due Date (Default: Today for Pharmacy counter)
  const [deliveryDate, setDeliveryDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
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
    try {
      const res = await tenantFetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCustomerDetails(data.data);
        if (data.data?.name) {
          setRxData((prev) => ({
            ...prev,
            patientName: data.data.name,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Item to Cart (Supports Strip vs Loose Tablet)
  const addToCart = (item: any, unitType: "STRIP" | "LOOSE_TABLET" = "STRIP") => {
    const isLoose = unitType === "LOOSE_TABLET";
    const tabletsPerStrip = item.tabletsPerStrip || 10;
    const unitPrice = isLoose
      ? Math.round(((item.saleRate || item.selling_price) / tabletsPerStrip) * 100) / 100
      : item.saleRate || item.selling_price;

    const cartKey = `${item.id}-${unitType}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unit_price,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          cartKey,
          itemId: item.id,
          medicineId: item.id,
          sku: item.sku,
          name: item.name || item.brand,
          genericSaltName: item.genericSaltName || item.model || "",
          manufacturer: item.manufacturer || "",
          batchNumber: item.batchNumber || "BT-DEFAULT",
          expiryDate: item.expiryDate || "12/2026",
          rackLocation: item.rackLocation || "Rack A-01",
          packType: item.packType || item.type || "Strip",
          tabletsPerStrip,
          unitType,
          unit_price: unitPrice,
          stripPrice: item.saleRate || item.selling_price,
          quantity: 1,
          subtotal: unitPrice,
          isScheduleH: item.isScheduleH || item.scheduleType === "SCHEDULE_H",
          image_url: item.image_url,
        },
      ];
    });

    if (item.isScheduleH || item.scheduleType === "SCHEDULE_H") {
      setAttachPrescription(true);
      setIsRxAccordionOpen(true);
    }
  };

  // Barcode Scanner Handler
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = barcodeInput.trim().toLowerCase();
      if (!query) return;

      const found = items.find(
        (i) =>
          (i.barcode && i.barcode.toLowerCase() === query) ||
          i.sku.toLowerCase() === query ||
          (i.name && i.name.toLowerCase() === query) ||
          (i.batchNumber && i.batchNumber.toLowerCase() === query)
      );

      if (found) {
        const qty = found.stripQuantity ?? found.stock_quantity ?? 0;
        if (qty <= 0 && (found.looseTabletQuantity || 0) <= 0) {
          setBarcodeFeedback({
            type: "error",
            message: `Batch ${found.batchNumber} of ${found.name} is Out of Stock!`,
          });
        } else {
          addToCart(found, "STRIP");
          setBarcodeFeedback({
            type: "success",
            message: `Scanned: ${found.name} (Batch: ${found.batchNumber}) - ${formatCurrency(found.saleRate || found.selling_price)}`,
          });
        }
      } else {
        setBarcodeFeedback({
          type: "error",
          message: `Barcode / SKU "${barcodeInput}" not found in pharmacy catalog.`,
        });
      }

      setBarcodeInput("");
      setTimeout(() => setBarcodeFeedback(null), 3500);
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
            item.name?.toLowerCase().includes(q) ||
            item.genericSaltName?.toLowerCase().includes(q) ||
            item.batchNumber?.toLowerCase().includes(q) ||
            item.sku?.toLowerCase().includes(q) ||
            item.manufacturer?.toLowerCase().includes(q) ||
            item.rackLocation?.toLowerCase().includes(q)
          );
        })
        .slice(0, 10)
    : [];

  const handleAddFromSearch = (item: any, unitType: "STRIP" | "LOOSE_TABLET" = "STRIP") => {
    const qty = item.stripQuantity ?? item.stock_quantity ?? 0;
    if (qty <= 0 && (item.looseTabletQuantity || 0) <= 0) {
      setCartSearchFeedback({
        type: "error",
        message: `${item.name} (Batch: ${item.batchNumber}) is Out of Stock!`,
      });
      setTimeout(() => setCartSearchFeedback(null), 3500);
      return;
    }

    addToCart(item, unitType);
    setCartSearchQuery("");
    setIsCartSearchFocused(false);
    setCartSearchFeedback({
      type: "success",
      message: `Added: ${item.name} (${unitType === "LOOSE_TABLET" ? "Loose Tablet" : "Strip"}) - ${formatCurrency(item.saleRate || item.selling_price)}`,
    });
    setTimeout(() => setCartSearchFeedback(null), 3000);
  };

  const handleCartSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = cartSearchQuery.trim().toLowerCase();
      if (!q) return;

      const exactMatch = items.find(
        (item) =>
          item.sku?.toLowerCase() === q ||
          item.name?.toLowerCase() === q ||
          item.batchNumber?.toLowerCase() === q
      );

      const targetItem = exactMatch || cartFilteredProducts[0];

      if (targetItem) {
        handleAddFromSearch(targetItem, "STRIP");
      } else {
        setCartSearchFeedback({
          type: "error",
          message: `No medicine found matching "${cartSearchQuery}"`,
        });
        setTimeout(() => setCartSearchFeedback(null), 3000);
      }
    } else if (e.key === "Escape") {
      setIsCartSearchFocused(false);
    }
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unit_price,
            };
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const toggleUnitType = (cartKey: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartKey === cartKey) {
          const nextUnit = item.unitType === "STRIP" ? "LOOSE_TABLET" : "STRIP";
          const newRate =
            nextUnit === "LOOSE_TABLET"
              ? Math.round((item.stripPrice / (item.tabletsPerStrip || 10)) * 100) / 100
              : item.stripPrice;

          return {
            ...item,
            cartKey: `${item.itemId}-${nextUnit}`,
            unitType: nextUnit,
            unit_price: newRate,
            subtotal: item.quantity * newRate,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setAdvancePaid(0);
    setIsAdvanceUserModified(false);
    setTransactionRef("");
    setCheckoutError(null);
  };

  // Copy previous prescription from patient record
  const loadPreviousRx = (customRx?: any) => {
    const targetRx = customRx || selectedCustomerDetails?.prescriptions?.[0];
    if (!targetRx) {
      setRxLoadedAlert("No prior prescription record found for this patient.");
      setTimeout(() => setRxLoadedAlert(null), 3000);
      return;
    }

    setRxData({
      patientName: targetRx.patientName || selectedCustomerDetails?.name || "",
      patientAge: targetRx.patientAge ? String(targetRx.patientAge) : "",
      doctorName: targetRx.doctorName || "Dr. Sandeep Deshmukh, MD",
      clinicOrHospital: targetRx.clinicOrHospital || "City Hospital",
      doctorRegNo: targetRx.doctorRegNo || "MCI-48921",
      dosageInstructions: targetRx.dosageInstructions || "1-0-1 (After Meals)",
      notes: targetRx.notes || "",
      prescriptionImage: targetRx.prescriptionImage || "",
    });

    setAttachPrescription(true);
    setIsRxAccordionOpen(true);
    setRxLoadedAlert(
      `Prescription copied: ${targetRx.doctorName || "Registered Doctor"} (${formatDate(targetRx.createdAt)})`
    );
    setTimeout(() => setRxLoadedAlert(null), 4000);
  };

  // Image Upload handler for prescription
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setRxData((prev) => ({
          ...prev,
          prescriptionImage: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Financial Calculations
  const rawSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const calculatedDiscount =
    discountMode === "PERCENT"
      ? Math.round((rawSubtotal * (discountValue || 0)) / 100)
      : Math.min(rawSubtotal, discountValue || 0);

  const taxableAmount = Math.max(0, rawSubtotal - calculatedDiscount);
  const totalTax = (taxableAmount * gstRate) / 100;
  const finalPayable = Math.round(taxableAmount + totalTax);

  useEffect(() => {
    if (!isAdvanceUserModified) {
      setAdvancePaid(finalPayable);
    }
  }, [finalPayable, isAdvanceUserModified]);

  const effectiveAdvancePaid = Math.min(finalPayable, Math.max(0, advancePaid || 0));
  const balanceRemaining = Math.max(0, finalPayable - effectiveAdvancePaid);
  const paymentStatus = balanceRemaining === 0 ? "PAID" : "PARTIAL";

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
    const matchesPack =
      activePackType === "ALL" ||
      (item.packType && item.packType.toUpperCase() === activePackType.toUpperCase());

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      item.name?.toLowerCase().includes(q) ||
      item.genericSaltName?.toLowerCase().includes(q) ||
      item.batchNumber?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.manufacturer?.toLowerCase().includes(q) ||
      item.rackLocation?.toLowerCase().includes(q);

    return matchesPack && matchesSearch;
  });

  // Generate WhatsApp Direct URL
  const generateWhatsAppUrl = (order: any, customer: any) => {
    if (!customer?.phone) return null;
    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const itemsSummary = order.items
      ?.map(
        (it: any) =>
          `• ${it.name || "Medicine"} (${it.unitType === "LOOSE_TABLET" ? "Loose Tablets" : "Strip"} x${it.quantity}) - ₹${it.subtotal}`
      )
      .join("\n");

    const message = `💊 *PHARMAPULSE CHEMIST & DRUGGIST*
High-Efficiency Pharmacy & Clinical Store ERP

Dear *${customer.name}*,
Thank you for visiting PharmaPulse! Your medical bill has been generated:

🧾 *Bill No*: #${order.bill_no}
📅 *Date*: ${formatDate(order.createdAt)}

💰 *Bill Summary*:
• Net Payable: ₹${order.final_payable}
• Paid Amount: ₹${order.paid_amount} (${paymentMethod})
• Balance Remaining: ₹${order.balance_amount}

📦 *Medicines Dispensed*:
${itemsSummary}

${attachPrescription && rxData.doctorName ? `👨‍⚕️ *Prescribed by*: ${rxData.doctorName} (${rxData.dosageInstructions || "As directed"})` : ""}

📍 *Location*: Shop 10 & 11, Central Avenue, Powai, Mumbai - 400076
📞 *Helpline*: +91 98201 12345`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Submit Order Execution
  const handleCheckout = async (targetAction: "PRINT" | "WHATSAPP") => {
    if (!selectedCustomerId) {
      setCheckoutError("Please select a registered patient or create a new patient profile.");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Your cart is empty. Please add at least one medicine item.");
      return;
    }

    if (effectiveAdvancePaid < 0) {
      setCheckoutError("Payment amount cannot be negative.");
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
      prescriptionData: attachPrescription ? rxData : null,
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

  {/* ======================================================== */}
  {/* SECTION 1: CUSTOMER / PATIENT SELECTION                  */}
  {/* ======================================================== */}
  const renderCustomerSection = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>Patient / Customer Profile</span>
          <span className="text-rose-500 font-bold">*</span>
        </span>
        <button
          type="button"
          onClick={() => setIsNewCustomerOpen(true)}
          className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ New Patient</span>
        </button>
      </div>

      {!selectedCustomerId ? (
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient by mobile number (9820...) or name..."
            value={customerSearch}
            onFocus={() => setShowCustomerDropdown(true)}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setShowCustomerDropdown(true);
            }}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-medium"
          />

          {showCustomerDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-64 overflow-y-auto z-40 divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  <p>No patient record found matching &ldquo;{customerSearch}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomerDropdown(false);
                      setIsNewCustomerOpen(true);
                    }}
                    className="mt-2 text-emerald-700 font-bold hover:underline inline-block cursor-pointer"
                  >
                    + Register New Patient
                  </button>
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    type="button"
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setShowCustomerDropdown(false);
                      setCustomerSearch("");
                    }}
                    className="w-full text-left p-3 sm:p-3.5 hover:bg-emerald-50/70 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm sm:text-base">{cust.name}</p>
                      <p className="text-xs sm:text-sm text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {cust.phone}
                      </p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                      {cust.loyalty_points || 0} pts
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        selectedCustomerDetails && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  {selectedCustomerDetails.name}
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    {selectedCustomerDetails.loyalty_points || 0} pts
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-mono mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomerDetails.phone}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId("");
                  setSelectedCustomerDetails(null);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                Change Patient
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Past Rx & Bills ({selectedCustomerDetails.orders?.length || 0})
              </button>

              {selectedCustomerDetails.prescriptions?.length > 0 && (
                <button
                  type="button"
                  onClick={() => loadPreviousRx()}
                  className="text-xs font-bold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copy Last Rx</span>
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 2: MEDICINE & SALT SEARCH + CATALOG              */}
  {/* ======================================================== */}
  const renderSearchBarAndCatalog = (isMobile?: boolean) => (
    <div id="pos-catalog-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Top Search / Barcode Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSearchMode("SEARCH")}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              searchMode === "SEARCH"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            <span>Search Medicine & Salt</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchMode("BARCODE")}
            className={`px-3 sm:px-4 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              searchMode === "BARCODE"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Barcode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Barcode Gun</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {searchMode === "SEARCH" ? "Instant Brand or Salt lookup" : "Ready for scanner gun"}
        </span>
      </div>

      {/* Input Mode 1: Search Field */}
      {searchMode === "SEARCH" ? (
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search brand (Dolo, Augmentin), salt (Paracetamol), batch no, rack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Input Mode 2: Barcode Scanner Field */
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-700 pointer-events-none">
            <Barcode className="w-5 h-5" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 px-1.5 py-0.5 rounded">
              SCAN
            </span>
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan product barcode / batch number and hit Enter..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            className="w-full pl-28 pr-4 py-3 bg-emerald-50/50 border-2 border-emerald-500 rounded-xl text-sm sm:text-base font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-xs"
          />
        </div>
      )}

      {/* Pack Type Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs sm:text-sm select-none scrollbar-none">
        {[
          { label: "All Formulations", key: "ALL" },
          { label: "Strips & Tablets", key: "STRIP" },
          { label: "Bottles & Syrups", key: "BOTTLE" },
          { label: "Boxes & Units", key: "BOX" },
          { label: "Ointments", key: "OINTMENT" },
          { label: "Syringes", key: "SYRINGE" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActivePackType(tab.key)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activePackType === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Available Medicine Cards */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-600" />
            Available Medicines ({filteredItems.length})
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">Add Strip or Loose Tablets</span>
        </div>

        {loadingItems ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Loading pharmacy catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Pill className="w-10 h-10 mb-2 text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-800 text-sm">
              {items.length === 0
                ? "No medicines in inventory"
                : `No medicines match "${searchQuery}"`}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              {items.length === 0
                ? "Your pharmacy catalog is empty. Add medicine batches to start counter sales."
                : "Try searching with generic salt composition or brand name."}
            </p>
            {items.length === 0 && (
              <Link
                href="/inventory"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add First Medicine</span>
              </Link>
            )}
          </div>
        ) : (
          <div className={`grid ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"} gap-3`}>
            {filteredItems.map((item) => {
              const stripQty = item.stripQuantity ?? item.stock_quantity ?? 0;
              const looseQty = item.looseTabletQuantity || 0;
              const minStock = item.minStockAlert ?? item.min_alert_threshold ?? 10;
              const isOut = stripQty <= 0 && looseQty <= 0;
              const isLow = stripQty <= minStock && !isOut;
              const expStatus = getExpiryStatus(item.expiryDate);
              const tabletsPerStrip = item.tabletsPerStrip || 10;
              const pricePerStrip = item.saleRate || item.selling_price || 0;
              const pricePerTablet = (pricePerStrip / tabletsPerStrip).toFixed(2);
              const isStripPack = (item.packType || item.type || "Strip").toLowerCase() === "strip";

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border bg-white shadow-xs transition-all ${
                    isOut
                      ? "opacity-60 border-slate-200"
                      : "border-slate-200 hover:border-emerald-400 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Expiry Badge & Schedule H Tag */}
                    <div className="flex items-center justify-between mb-1.5 gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${expStatus.badgeClass}`}>
                        Exp: {item.expiryDate} ({expStatus.label})
                      </span>
                      {item.isScheduleH && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Schedule H
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                      {item.name || item.brand}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                      {item.genericSaltName || item.model}
                    </p>

                    <div className="mt-2 text-[11px] text-slate-500 space-y-0.5 font-mono">
                      <div className="flex justify-between">
                        <span>Batch: <strong className="text-slate-800">{item.batchNumber}</strong></span>
                        <span>Rack: <strong className="text-slate-800">{item.rackLocation || "Rack A-01"}</strong></span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Stock: <strong className="text-slate-900">{stripQty} Strips</strong> {looseQty > 0 ? `+ ${looseQty} Loose` : ""}</span>
                        <span>{item.manufacturer?.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Pricing */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-black text-slate-900 text-base sm:text-lg block leading-none">
                        {formatCurrency(pricePerStrip)}
                      </span>
                      {isStripPack && tabletsPerStrip > 1 && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          ₹{pricePerTablet} / tablet
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isStripPack && tabletsPerStrip > 1 && (
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={() => addToCart(item, "LOOSE_TABLET")}
                          className="py-1.5 px-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                          title="Add loose individual tablets"
                        >
                          + Loose
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isOut}
                        onClick={() => addToCart(item, "STRIP")}
                        className={`py-1.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 transition-all cursor-pointer ${
                          isOut
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isStripPack ? "Strip" : "Add"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 3: CART & STRIP VS LOOSE SELECTION               */}
  {/* ======================================================== */}
  const renderCartSection = () => (
    <div id="pos-cart-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Search & Add input above cart */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
          <input
            ref={cartSearchInputRef}
            type="text"
            placeholder="Quick search medicine name, salt, batch..."
            value={cartSearchQuery}
            onChange={(e) => {
              setCartSearchQuery(e.target.value);
              setIsCartSearchFocused(true);
            }}
            onFocus={() => setIsCartSearchFocused(true)}
            onKeyDown={handleCartSearchKeyDown}
            className="w-full pl-11 pr-14 py-3 bg-white border border-slate-300 hover:border-emerald-400 focus:border-emerald-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all font-medium"
          />
          {cartSearchQuery ? (
            <button
              type="button"
              onClick={() => {
                setCartSearchQuery("");
                setIsCartSearchFocused(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded pointer-events-none">
              Enter ↵
            </kbd>
          )}
        </div>

        {cartSearchFeedback && (
          <div
            className={`mt-2 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
              cartSearchFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {cartSearchFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="truncate">{cartSearchFeedback.message}</span>
          </div>
        )}

        {isCartSearchFocused && cartSearchQuery.trim().length > 0 && (
          <div
            ref={cartSearchDropdownRef}
            className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto divide-y divide-slate-100 text-sm animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Matching Medicines ({cartFilteredProducts.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">Press Enter or select</span>
            </div>

            {cartFilteredProducts.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <p className="font-semibold text-slate-600">No medicine found matching &ldquo;{cartSearchQuery}&rdquo;</p>
              </div>
            ) : (
              cartFilteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleAddFromSearch(prod, "STRIP")}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-emerald-50/70 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-900 truncate text-sm sm:text-base">
                      {prod.name}
                    </h5>
                    <p className="text-xs text-slate-500 truncate">
                      {prod.genericSaltName} • Batch: {prod.batchNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {formatCurrency(prod.saleRate || prod.selling_price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFromSearch(prod, "STRIP");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-600 text-white"
                    >
                      + Strip
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-emerald-600" />
          <span>Billing Cart ({cart.length})</span>
        </span>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {cart.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Pill className="w-8 h-8 mb-2 opacity-30 text-emerald-600" />
          <p className="font-bold text-slate-600">Your billing cart is empty</p>
          <p className="text-xs text-slate-400 mt-0.5">Scan a barcode or add medicines from catalog.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item) => {
            const exp = getExpiryStatus(item.expiryDate);
            return (
              <div
                key={item.cartKey}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${exp.badgeClass}`}>
                        Exp: {item.expiryDate}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Batch: {item.batchNumber}
                      </span>
                      {item.isScheduleH && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700">
                          Rx Only
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mt-0.5">
                      {item.name}
                    </h5>
                    <p className="text-xs text-slate-500 truncate">
                      {item.genericSaltName}
                    </p>
                  </div>
                  <span className="font-black text-base sm:text-lg text-slate-900 font-mono shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>

                {/* Strip vs Loose Tablet Switcher */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-bold">Unit:</span>
                    <button
                      type="button"
                      onClick={() => toggleUnitType(item.cartKey)}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                        item.unitType === "STRIP"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {item.unitType === "STRIP" ? "📦 Whole Strip" : "💊 Loose Tablets"} (Click to Switch)
                    </button>
                  </div>
                  <span className="text-slate-500 font-mono">
                    Rate: {formatCurrency(item.unit_price)} / {item.unitType === "STRIP" ? "strip" : "tab"}
                  </span>
                </div>

                {/* Stepper & Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, -1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-black text-sm sm:text-base text-slate-900 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.cartKey)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove medicine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 4: DOCTOR & RX DETAILS MODAL / ACCORDION         */}
  {/* ======================================================== */}
  const renderRxAccordion = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsRxAccordionOpen(!isRxAccordionOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Doctor & Prescription (Rx) Details
              </h3>
              {attachPrescription && (
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Attached
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prescribing doctor, clinic, registration no. & dosage schedule
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-700 hidden sm:inline">
            {isRxAccordionOpen ? "Collapse" : "Expand"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            {isRxAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Accordion Content */}
      {isRxAccordionOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attachPrescription}
                onChange={(e) => setAttachPrescription(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Attach Doctor Rx to this Medical Bill (Schedule H Record)</span>
            </label>

            <button
              type="button"
              onClick={() => loadPreviousRx()}
              disabled={!selectedCustomerDetails?.prescriptions?.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Load Last Rx</span>
            </button>
          </div>

          {rxLoadedAlert && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{rxLoadedAlert}</span>
            </div>
          )}

          {attachPrescription ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={rxData.patientName}
                    onChange={(e) => setRxData({ ...rxData, patientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    placeholder="Patient Name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Patient Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={rxData.patientAge}
                    onChange={(e) => setRxData({ ...rxData, patientAge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    placeholder="e.g. 34"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={rxData.doctorName}
                    onChange={(e) => setRxData({ ...rxData, doctorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    placeholder="Dr. Name, MBBS / MD"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clinic / Hospital
                  </label>
                  <input
                    type="text"
                    value={rxData.clinicOrHospital}
                    onChange={(e) => setRxData({ ...rxData, clinicOrHospital: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    placeholder="Apollo / Fortis / City Clinic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Doctor Reg. No.
                  </label>
                  <input
                    type="text"
                    value={rxData.doctorRegNo}
                    onChange={(e) => setRxData({ ...rxData, doctorRegNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono font-medium"
                    placeholder="MCI-48921"
                  />
                </div>
              </div>

              {/* Dosage Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Dosage Schedule (Morning-Afternoon-Night e.g., 1-0-1, Before/After Meals)
                </label>
                <input
                  type="text"
                  value={rxData.dosageInstructions}
                  onChange={(e) => setRxData({ ...rxData, dosageInstructions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                  placeholder="e.g. 1-0-1 After Meals x 5 Days"
                />
              </div>

              {/* Optional Prescription Image Upload */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileUploadRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    <span>Upload Prescription Photo</span>
                  </button>
                  <input
                    ref={fileUploadRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {rxData.prescriptionImage && (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Image Attached
                    </span>
                  )}
                </div>

                {rxData.prescriptionImage && (
                  <button
                    type="button"
                    onClick={() => setRxData({ ...rxData, prescriptionImage: "" })}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              OTC direct purchase without prescription attachment.
            </div>
          )}
        </div>
      )}
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 5: FINANCIAL LEDGER & SETTLEMENT                 */}
  {/* ======================================================== */}
  const renderLedgerSection = () => (
    <div id="pos-checkout-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      {checkoutError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Financial Breakdown */}
      <div className="space-y-2 text-xs sm:text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal (Medicines):</span>
          <span className="font-semibold text-slate-900">{formatCurrency(rawSubtotal)}</span>
        </div>

        {/* Discount */}
        <div className="flex justify-between items-center text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>Discount:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white text-xs">
              <button
                type="button"
                onClick={() => setDiscountMode("FLAT")}
                className={`px-2 py-0.5 rounded-md font-bold ${
                  discountMode === "FLAT" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                ₹
              </button>
              <button
                type="button"
                onClick={() => setDiscountMode("PERCENT")}
                className={`px-2 py-0.5 rounded-md font-bold ${
                  discountMode === "PERCENT" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                %
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold"
            />
            {calculatedDiscount > 0 && (
              <span className="text-xs text-emerald-600 font-bold">
                (-{formatCurrency(calculatedDiscount)})
              </span>
            )}
          </div>
        </div>

        {/* GST Rate */}
        <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span>GST Rate:</span>
            <select
              value={gstRate}
              onChange={(e) => setGstRate(parseFloat(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
            >
              <option value={12}>12% (CGST 6% + SGST 6%)</option>
              <option value={5}>5% (Life Saving 2.5% + 2.5%)</option>
              <option value={18}>18% (Supplements 9% + 9%)</option>
              <option value={0}>0% (Tax Exempt)</option>
            </select>
          </div>
          <span className="font-semibold text-slate-900">{formatCurrency(totalTax)}</span>
        </div>

        {/* Final Net Payable */}
        <div className="flex justify-between items-center text-base sm:text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
          <span>Net Final Payable:</span>
          <span className="text-emerald-700 text-xl sm:text-2xl font-black font-mono">
            {formatCurrency(finalPayable)}
          </span>
        </div>
      </div>

      {/* Advance & Payment Mode Card */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-600" /> Payment & Settlement
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              paymentStatus === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {paymentStatus === "PAID" ? "STATUS: FULL PAID" : "STATUS: PARTIAL"}
          </span>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setAdvancePaid(finalPayable);
              setIsAdvanceUserModified(true);
            }}
            className="py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Full (100%)
          </button>
          <button
            type="button"
            onClick={() => {
              setAdvancePaid(Math.round(finalPayable * 0.5));
              setIsAdvanceUserModified(true);
            }}
            className="py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => {
              setAdvancePaid(Math.min(500, finalPayable));
              setIsAdvanceUserModified(true);
            }}
            className="py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            ₹500
          </button>
          <button
            type="button"
            onClick={() => {
              setAdvancePaid(0);
              setIsAdvanceUserModified(true);
            }}
            className="py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Pay Later
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Paid Amount Now (₹)
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
              className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-xl text-sm font-bold text-emerald-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Balance Due
            </label>
            <div
              className={`px-3 py-2 rounded-xl text-sm font-black font-mono ${
                balanceRemaining > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {formatCurrency(balanceRemaining)}
            </div>
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {["UPI", "CASH", "CARD"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`py-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                  paymentMethod === m
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod !== "CASH" && (
          <input
            type="text"
            placeholder="UPI Ref ID / UTR / Card Auth Code..."
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
          />
        )}
      </div>

      {/* Dual Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleCheckout("PRINT")}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Save & Print Invoice</span>
        </button>

        <button
          type="button"
          onClick={() => handleCheckout("WHATSAPP")}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Save & WhatsApp</span>
        </button>
      </div>
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 6: BOTTOM STICKY CHECKOUT BAR (Mobile & Tablet)  */}
  {/* ======================================================== */}
  const renderStickyCheckoutBar = () => (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 lg:hidden">
      <div className="min-w-0">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>Net Payable</span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
            {cart.reduce((a, b) => a + b.quantity, 0)} items
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
          {formatCurrency(finalPayable)}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {cart.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("pos-checkout-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Proceed to Bill</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("pos-catalog-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="py-2.5 px-4 rounded-xl font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            <span>Browse Medicines</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col pb-36 sm:pb-40 lg:pb-16 overflow-y-auto">
      {/* Barcode Flash Toast Feedback */}
      {barcodeFeedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xl animate-in slide-in-from-top duration-200 ${
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

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-6">
        {isDesktop ? (
          /* Desktop Cockpit Layout */
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0 space-y-6">
              {renderSearchBarAndCatalog(false)}
              {renderRxAccordion()}
            </div>

            <div className="w-[440px] xl:w-[480px] space-y-6 shrink-0">
              {renderCustomerSection()}
              {renderCartSection()}
              {renderLedgerSection()}
            </div>
          </div>
        ) : (
          /* Mobile Flow Layout */
          <div className="flex flex-col space-y-4">
            {renderCustomerSection()}
            {renderSearchBarAndCatalog(true)}
            {renderCartSection()}
            {renderRxAccordion()}
            {renderLedgerSection()}
            {renderStickyCheckoutBar()}
          </div>
        )}
      </div>

      {/* Completed Order Receipt Modal */}
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

      {/* Patient History Modal */}
      <CustomerHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        customer={selectedCustomerDetails}
        onSelectPrescription={(rx) => loadPreviousRx(rx)}
      />
    </div>
  );
}
