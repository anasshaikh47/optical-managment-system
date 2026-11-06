"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  ChevronUp,
  Zap,
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
  const router = useRouter();
  const { shopId, tenantFetch } = useAuth();
  // Inventory Items & Filtering
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL");

  // Global / Barcode Toast Feedback
  const [toastFeedback, setToastFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastFeedback({ type, message });
    setTimeout(() => {
      setToastFeedback(null);
    }, 3000);
  };

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

  // Settlement section view observer for sticky bar auto-hide
  const checkoutSectionRef = useRef<HTMLDivElement>(null);
  const [isCheckoutInView, setIsCheckoutInView] = useState(false);

  // Mode toggles & collapsible sections
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
  const [discountValue, setDiscountValue] = useState<number | string>(0);
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);
  const [gstRate, setGstRate] = useState<number>(12.0); // Optical GST standard 12%

  // Advance & Payments
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [advancePaid, setAdvancePaid] = useState<number | string>(0);
  const [isAdvanceFocused, setIsAdvanceFocused] = useState(false);
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
  const isCustomerModalOpen = isNewCustomerOpen;
  const setIsCustomerModalOpen = setIsNewCustomerOpen;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Monitor checkout section visibility to hide sticky Proceed to Bill bar
  useEffect(() => {
    const el = checkoutSectionRef.current || document.getElementById("pos-checkout-section");
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCheckoutInView(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    const handleScroll = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight - 80 && rect.bottom > 80;
      setIsCheckoutInView(inView);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
        setSelectedCustomerDetails(e.detail);
        setCustomerSearch("");
        setShowCustomerDropdown(false);
        setIsCustomerModalOpen(false);
        showToast("Customer selected");
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

  const resetPOS = () => {
    setCart([]);
    setSelectedCustomerId("");
    setSelectedCustomerDetails(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setDiscountValue(0);
    setDiscountMode("FLAT");
    setAdvancePaid(0);
    setIsAdvanceUserModified(false);
    setPaymentMethod("UPI");
    setTransactionRef("");
    setCheckoutError(null);
    setSearchQuery("");
    setCartSearchQuery("");
    setRxLoadedAlert(null);
    setRxData({
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
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setDeliveryDate(d.toISOString().split("T")[0]);
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
    setIsRxAccordionOpen(true);
    setRxLoadedAlert(
      `Prescription copied from Dr. ${targetRx.optometristName || "Optometrist"} (${formatDate(targetRx.createdAt)})`
    );
    setTimeout(() => setRxLoadedAlert(null), 4000);
  };

  // Financial Calculations
  const rawSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const numericDiscount = discountValue === "" ? 0 : Number(discountValue) || 0;

  const calculatedDiscount =
    discountMode === "PERCENT"
      ? Math.round((rawSubtotal * Math.min(100, Math.max(0, numericDiscount))) / 100)
      : Math.min(rawSubtotal, Math.max(0, numericDiscount));

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

  const numericAdvancePaid = advancePaid === "" ? 0 : Number(advancePaid) || 0;
  const effectiveAdvancePaid = Math.min(finalPayable, Math.max(0, numericAdvancePaid));
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
      customerName: selectedCustomerDetails?.name || "",
      customerPhone: selectedCustomerDetails?.phone || "",
      items: cart,
      subtotal: rawSubtotal,
      total_amount: rawSubtotal,
      discount_amount: calculatedDiscount,
      discountAmount: calculatedDiscount,
      tax_amount: parseFloat(totalTax.toFixed(2)),
      taxAmount: parseFloat(totalTax.toFixed(2)),
      final_payable: finalPayable,
      totalAmount: finalPayable,
      paid_amount: effectiveAdvancePaid,
      paidAmount: effectiveAdvancePaid,
      pendingAmount: Math.max(0, parseFloat((finalPayable - effectiveAdvancePaid).toFixed(2))),
      method: paymentMethod,
      transaction_ref: transactionRef,
      delivery_due_date: deliveryDate,
      prescriptionData:
        attachPrescription && (rxData.od_sph !== "" || rxData.os_sph !== "") ? rxData : null,
      shopId,
      userId: shopId,
    };

    try {
      const res = await tenantFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && (res.status === 200 || res.status === 201) && data.success) {
        const orderData = data.data;
        const currentCustomer = selectedCustomerDetails;
        setCompletedOrder(orderData);

        // If WhatsApp requested, open chat window
        if (targetAction === "WHATSAPP") {
          const waUrl = generateWhatsAppUrl(orderData, currentCustomer);
          if (waUrl) {
            window.open(waUrl, "_blank");
          }
        }

        resetPOS();
        fetchInventory();
        fetchCustomers();
      } else {
        const errMsg = data.error || `Checkout transaction failed (HTTP ${res.status}). Order was not saved to database.`;
        setCheckoutError(errMsg);
        alert(errMsg);
      }
    } catch (e: any) {
      const errMsg = e.message || "An unexpected error occurred during checkout";
      setCheckoutError(errMsg);
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const scrollToCheckout = () => {
    const el = document.getElementById("pos-checkout-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToCatalog = () => {
    const el = document.getElementById("pos-catalog-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  {/* ======================================================== */}
  {/* SECTION 1: CUSTOMER SELECTION (Big touch targets)       */}
  {/* ======================================================== */}
  const renderCustomerSection = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-600" />
          <span>Customer / Patient Profile</span>
          <span className="text-rose-500 font-bold">*</span>
        </span>
        <button
          type="button"
          onClick={() => setIsCustomerModalOpen(true)}
          className="text-xs sm:text-sm font-bold text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-xl hover:bg-cyan-100 transition-colors cursor-pointer active:scale-95"
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
            placeholder="Search patient by phone number (9820...) or name..."
            value={customerSearch}
            onFocus={() => setShowCustomerDropdown(true)}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setShowCustomerDropdown(true);
            }}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs font-medium"
          />

          {showCustomerDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-64 overflow-y-auto z-40 divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  <p>No customer found matching &ldquo;{customerSearch}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomerDropdown(false);
                      setIsCustomerModalOpen(true);
                    }}
                    className="mt-2 text-cyan-700 font-bold hover:underline inline-block cursor-pointer"
                  >
                    + Quick Register Patient
                  </button>
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    type="button"
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setSelectedCustomerDetails(cust);
                      setShowCustomerDropdown(false);
                      setCustomerSearch("");
                      showToast("Customer selected");
                    }}
                    className="w-full text-left p-3 sm:p-3.5 hover:bg-cyan-50/70 transition-colors flex items-center justify-between cursor-pointer"
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
                    <Award className="w-3 h-3" /> {selectedCustomerDetails.loyalty_points || 0} pts
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-mono mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomerDetails.phone}</span>
                  {selectedCustomerDetails.dob && (
                    <span>• DOB: {formatDate(selectedCustomerDetails.dob)}</span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId("");
                  setSelectedCustomerDetails(null);
                }}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-900 bg-white border border-cyan-200 px-2.5 py-1 rounded-lg hover:bg-cyan-50 transition-colors cursor-pointer"
              >
                Change Patient
              </button>
            </div>

            {pastUnpaidDues > 0 ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Previous Unpaid Dues:</span>
                  <span className="text-rose-700 font-black">{formatCurrency(pastUnpaidDues)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="text-xs font-bold underline hover:text-rose-900 cursor-pointer"
                >
                  View
                </button>
              </div>
            ) : (
              <div className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-emerald-600" /> No outstanding past dues on account.
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="text-cyan-700 hover:text-cyan-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Glasses className="w-4 h-4" /> Past Rx History ({selectedCustomerDetails.prescriptions?.length || 0})
              </button>

              {selectedCustomerDetails.prescriptions?.length > 0 && (
                <button
                  type="button"
                  onClick={() => loadPreviousRx()}
                  className="text-xs font-bold text-cyan-800 bg-cyan-100/70 hover:bg-cyan-200/80 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Copy Rx</span>
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 2: BARCODE & SEARCH BAR (Clean & Visible)       */}
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
            <Search className="w-3.5 h-3.5 text-cyan-600" />
            <span>Search Catalog</span>
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
            <Barcode className="w-3.5 h-3.5 text-cyan-600" />
            <span>Barcode Gun</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {searchMode === "SEARCH" ? "Filter or scan" : "Ready for barcode gun"}
        </span>
      </div>

      {/* Input Mode 1: Search Field */}
      {searchMode === "SEARCH" ? (
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search model, brand, SKU or code (e.g. Ray-Ban, RB3025, Zeiss)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white font-medium"
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
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-cyan-700 pointer-events-none">
            <Barcode className="w-5 h-5" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-100 px-1.5 py-0.5 rounded">
              SCAN
            </span>
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan barcode / SKU and hit Enter..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            className="w-full pl-28 pr-4 py-3 bg-cyan-50/50 border-2 border-cyan-500 rounded-xl text-sm sm:text-base font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all shadow-xs"
          />
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs sm:text-sm select-none scrollbar-none">
        {[
          { label: "All Items", key: "ALL" },
          { label: "Frames", key: "FRAME" },
          { label: "Power Lenses", key: "LENS" },
          { label: "Contact Lenses", key: "CONTACT_LENS" },
          { label: "Accessories", key: "ACCESSORY" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveType(tab.key)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeType === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Available Optical Inventory Cards */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-cyan-600" />
            Available Inventory ({filteredItems.length})
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">Tap card or button to add</span>
        </div>

        {loadingItems ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Loading optical inventory...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Package className="w-10 h-10 mb-2 text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-800 text-sm">
              {items.length === 0
                ? "Available Inventory: 0 items"
                : `No items match "${searchQuery}"`}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              {items.length === 0
                ? "No products found in store inventory. Add frames or lenses to stock to enable counter sales."
                : "Try searching another brand name or reset the category filter."}
            </p>
            {items.length === 0 && (
              <Link
                href="/inventory"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your First Product</span>
              </Link>
            )}
          </div>
        ) : (
          <div className={`grid ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"} gap-3`}>
            {filteredItems.map((item) => {
              const isOutOfStock = item.stock_quantity <= 0;
              const isLowStock = item.stock_quantity <= item.min_alert_threshold && !isOutOfStock;
              const isInCart = cart.some((c) => c.itemId === item.id);

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border transition-all ${
                    isOutOfStock
                      ? "opacity-60 border-slate-200 bg-white"
                      : isInCart
                      ? "border-slate-300 bg-slate-50/60 shadow-2xs"
                      : "border-slate-200 bg-white shadow-xs hover:border-cyan-400 hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.type.replace("_", " ")}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {item.stock_quantity} left
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {item.stock_quantity} in stock
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                      {item.brand} - {item.model || item.type}
                    </h4>
                    <p className="font-mono text-xs text-slate-400 mt-0.5 truncate">
                      SKU: {item.sku}
                    </p>
                    {item.color && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">Color: {item.color}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-slate-900 text-base sm:text-lg">
                      {formatCurrency(item.selling_price)}
                    </span>
                    {isInCart ? (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="py-2 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 bg-slate-700 text-slate-300 cursor-not-allowed transition-all"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>✓ In Cart</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(item)}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                          isOutOfStock
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs hover:scale-105 active:scale-95"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add</span>
                      </button>
                    )}
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
  {/* SECTION 3: CART & SELECTED ITEMS (Clean Stepper & Trash) */}
  {/* ======================================================== */}
  const renderCartSection = () => (
    <div id="pos-cart-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Live Search & Add Bar above Cart */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none" />
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
            className="w-full pl-11 pr-14 py-3 bg-white border border-slate-300 hover:border-cyan-400 focus:border-cyan-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-2xs transition-all font-medium"
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
              <span>Matching Products ({cartFilteredProducts.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">Press Enter or tap Add</span>
            </div>

            {cartFilteredProducts.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <p className="font-semibold text-slate-600">No products found matching &ldquo;{cartSearchQuery}&rdquo;</p>
                <p className="text-xs text-slate-400 mt-0.5">Try searching brand, model code (e.g. RB3025), or barcode SKU.</p>
              </div>
            ) : (
              cartFilteredProducts.map((prod) => {
                const isOutOfStock = prod.stock_quantity <= 0;
                const isProdInCart = cart.some((i) => i.itemId === prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && !isProdInCart && handleAddFromSearch(prod)}
                    className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                      isOutOfStock || isProdInCart
                        ? "opacity-75 bg-slate-50 cursor-not-allowed"
                        : "hover:bg-cyan-50/70 cursor-pointer"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                          {prod.type}
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-semibold truncate">
                          {prod.sku}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 truncate mt-0.5 text-sm sm:text-base">
                        {prod.brand} - {prod.model || prod.type}
                      </h5>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
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
                        {prod.color && <span className="text-slate-400 truncate">• {prod.color}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                        {formatCurrency(prod.selling_price)}
                      </span>
                      {isProdInCart ? (
                        <button
                          type="button"
                          disabled
                          aria-disabled="true"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-700 text-slate-300 cursor-not-allowed"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>✓ In Cart</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFromSearch(prod);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isOutOfStock
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs active:scale-95"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Cart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-cyan-600" />
          <span>Cart Items ({cart.length})</span>
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
          <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
          <p className="font-bold text-slate-600">Your billing cart is empty</p>
          <p className="text-xs text-slate-400 mt-0.5">Scan a barcode or add frames & lenses above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.itemId}
              className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.image_url ? (
                    <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {item.type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{item.sku}</span>
                    </div>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mt-0.5">
                      {item.name}
                    </h5>
                  </div>
                </div>
                <span className="font-black text-base sm:text-lg text-slate-900 font-mono shrink-0">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>

              {/* Coating & Fitting Dropdowns for Lenses or Frames */}
              {(item.type === "LENS" || item.type === "FRAME") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Coating Treatment:
                    </label>
                    <select
                      value={item.coating_key || "NONE"}
                      onChange={(e) => updateCoating(item.itemId, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      {COATING_OPTIONS.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Fitting / Edging:
                    </label>
                    <select
                      value={item.fitting_key || "FREE"}
                      onChange={(e) => updateFitting(item.itemId, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
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

              {/* Quantity Stepper & Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.itemId, -1)}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-black text-sm sm:text-base text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.itemId, 1)}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">
                    Rate: {formatCurrency(item.unit_price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.itemId)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 4: PRESCRIPTION (RX) MATRIX ACCORDION            */}
  {/* ======================================================== */}
  const renderRxAccordion = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsRxAccordionOpen(!isRxAccordionOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Prescription (Rx) Refraction Matrix
              </h3>
              {attachPrescription && (
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                  Attached
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diopter values (OD & OS), PD distance & lab glazing notes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-cyan-700 hidden sm:inline">
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
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <span>Attach Rx to Customer Invoice & Job Slip</span>
            </label>

            <button
              type="button"
              onClick={() => loadPreviousRx()}
              disabled={!selectedCustomerDetails?.prescriptions?.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Load Previous Rx</span>
            </button>
          </div>

          {rxLoadedAlert && (
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>{rxLoadedAlert}</span>
            </div>
          )}

          {attachPrescription ? (
            <div className="space-y-4 text-xs">
              {/* OD & OS Diopter Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OD Card: Right Eye */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-xs sm:text-sm text-cyan-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-cyan-600" />
                      Right Eye (OD - Oculus Dexter)
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">
                      OD
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">SPH (D)</label>
                      <input
                        type="number"
                        step="0.25"
                        min="-20.00"
                        max="20.00"
                        value={rxData.od_sph}
                        onChange={(e) => setRxData({ ...rxData, od_sph: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">CYL (D)</label>
                      <input
                        type="number"
                        step="0.25"
                        min="-6.00"
                        max="6.00"
                        value={rxData.od_cyl}
                        onChange={(e) => setRxData({ ...rxData, od_cyl: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">AXIS (°)</label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={rxData.od_axis}
                        onChange={(e) => setRxData({ ...rxData, od_axis: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="1-180"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ADD</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.75"
                        max="4.00"
                        value={rxData.od_add}
                        onChange={(e) => setRxData({ ...rxData, od_add: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="+2.00"
                      />
                    </div>
                  </div>
                </div>

                {/* OS Card: Left Eye */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-xs sm:text-sm text-cyan-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-cyan-600" />
                      Left Eye (OS - Oculus Sinister)
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">
                      OS
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">SPH (D)</label>
                      <input
                        type="number"
                        step="0.25"
                        min="-20.00"
                        max="20.00"
                        value={rxData.os_sph}
                        onChange={(e) => setRxData({ ...rxData, os_sph: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">CYL (D)</label>
                      <input
                        type="number"
                        step="0.25"
                        min="-6.00"
                        max="6.00"
                        value={rxData.os_cyl}
                        onChange={(e) => setRxData({ ...rxData, os_cyl: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">AXIS (°)</label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={rxData.os_axis}
                        onChange={(e) => setRxData({ ...rxData, os_axis: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="1-180"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ADD</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.75"
                        max="4.00"
                        value={rxData.os_add}
                        onChange={(e) => setRxData({ ...rxData, os_add: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                        placeholder="+2.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PD Distance & Near */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PD Dist (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="50"
                      max="75"
                      value={rxData.pd_distance}
                      onChange={(e) => setRxData({ ...rxData, pd_distance: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                      placeholder="63"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">PD Near (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="48"
                      max="72"
                      value={rxData.pd_near}
                      onChange={(e) => setRxData({ ...rxData, pd_near: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800"
                      placeholder="60"
                    />
                  </div>
                </div>

                {/* Lens Optical Design Type */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Lens Optical Design Type</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "SINGLE_VISION", label: "Single Vision" },
                      { key: "BIFOCAL", label: "Bifocal" },
                      { key: "PROGRESSIVE", label: "Progressive" },
                    ].map((lens) => (
                      <label
                        key={lens.key}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Prescribing Optometrist</label>
                  <input
                    type="text"
                    value={rxData.optometristName}
                    onChange={(e) => setRxData({ ...rxData, optometristName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    placeholder="Dr. Staff Optometrist"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Lab Glazing Instructions</label>
                  <input
                    type="text"
                    value={rxData.notes}
                    onChange={(e) => setRxData({ ...rxData, notes: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
                    placeholder="e.g., High index 1.67, anti-reflective coating"
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
      )}
    </div>
  );

  {/* ======================================================== */}
  {/* SECTION 5: FINANCIAL LEDGER & SETTLEMENT                 */}
  {/* ======================================================== */}
  const renderLedgerSection = () => (
    <div id="pos-checkout-section" ref={checkoutSectionRef} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      {checkoutError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Financial Breakdown */}
      <div className="space-y-2 text-xs sm:text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal (Items + Services):</span>
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
              value={discountValue === 0 && isDiscountFocused ? "" : discountValue}
              onFocus={(e) => {
                setIsDiscountFocused(true);
                if (discountValue === 0 || discountValue === "0") {
                  setDiscountValue("");
                } else {
                  e.target.select();
                }
              }}
              onBlur={() => {
                setIsDiscountFocused(false);
                if (discountValue === "" || isNaN(Number(discountValue))) {
                  setDiscountValue(0);
                } else {
                  setDiscountValue(Math.max(0, Number(discountValue)));
                }
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/^0+(?=\d)/, "");
                setDiscountValue(val === "" ? "" : Math.max(0, Number(val)));
              }}
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
              <option value={18}>18% (CGST 9% + SGST 9%)</option>
              <option value={0}>0% (Tax Exempt)</option>
            </select>
          </div>
          <span className="font-semibold text-slate-900">{formatCurrency(totalTax)}</span>
        </div>

        {/* Final Net Payable */}
        <div className="flex justify-between items-center text-base sm:text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
          <span>Net Final Payable:</span>
          <span className="text-cyan-700 text-xl sm:text-2xl font-black font-mono">
            {formatCurrency(finalPayable)}
          </span>
        </div>
      </div>

      {/* Advance & Balance Payment Card */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-cyan-600" /> Advance & Settlement
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              paymentStatus === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {paymentStatus === "PAID" ? "STATUS: PAID" : "STATUS: PARTIAL ADVANCE"}
          </span>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setAdvancePaid(finalPayable);
              setIsAdvanceUserModified(true);
              setIsAdvanceFocused(false);
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
              setIsAdvanceFocused(false);
            }}
            className="py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            50% Advance
          </button>
          <button
            type="button"
            onClick={() => {
              setAdvancePaid(Math.min(1000, finalPayable));
              setIsAdvanceUserModified(true);
              setIsAdvanceFocused(false);
            }}
            className="py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            ₹1,000
          </button>
          <button
            type="button"
            onClick={() => {
              setAdvancePaid(0);
              setIsAdvanceUserModified(true);
              setIsAdvanceFocused(false);
            }}
            className="py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Pay on Pickup
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Advance Paid Now (₹)
            </label>
            <input
              type="number"
              min="0"
              max={finalPayable}
              value={advancePaid === 0 && isAdvanceFocused ? "" : advancePaid}
              onFocus={(e) => {
                setIsAdvanceFocused(true);
                if (advancePaid === 0 || advancePaid === "0") {
                  setAdvancePaid("");
                } else {
                  e.target.select();
                }
              }}
              onBlur={() => {
                setIsAdvanceFocused(false);
                if (advancePaid === "" || isNaN(Number(advancePaid))) {
                  setAdvancePaid(0);
                } else {
                  setAdvancePaid(Math.max(0, Number(advancePaid)));
                }
              }}
              onChange={(e) => {
                setIsAdvanceUserModified(true);
                const val = e.target.value.replace(/^0+(?=\d)/, "");
                setAdvancePaid(val === "" ? "" : Math.max(0, Number(val)));
              }}
              className="w-full px-3 py-2 bg-white border border-cyan-400 rounded-xl text-sm font-bold text-cyan-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Balance Remaining
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
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {["UPI", "CASH", "CARD"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`py-2 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                  paymentMethod === m
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-2xs"
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
            placeholder="UPI Ref ID / Card Auth Code..."
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium"
          />
        )}

        {/* Delivery Due Date */}
        <div className="pt-2 border-t border-slate-200/60">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Delivery Ready By:
            </label>
            <div className="flex gap-1 text-[10px] sm:text-xs">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 2);
                  setDeliveryDate(d.toISOString().split("T")[0]);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                +2 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setDeliveryDate(d.toISOString().split("T")[0]);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setDeliveryDate(d.toISOString().split("T")[0]);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
          />
        </div>
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
          <span>Save & Print Slip</span>
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
  {/* (Positioned at bottom-16 to sit cleanly above BottomNav) */}
  {/* ======================================================== */}
  const renderStickyCheckoutBar = () => {
    if (isCheckoutInView) return null;

    return (
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 lg:hidden animate-in fade-in duration-150">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>Net Payable</span>
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-700 font-mono tracking-tight">
            {formatCurrency(finalPayable)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {cart.length > 0 ? (
            <button
              type="button"
              onClick={scrollToCheckout}
              className="py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-cyan-700 hover:bg-cyan-800 border border-cyan-600 shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Proceed to Bill</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={scrollToCatalog}
              className="py-2.5 px-4 rounded-xl font-bold text-xs text-cyan-800 bg-cyan-50 border border-cyan-200 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-cyan-600" />
              <span>Browse Items</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col pb-36 sm:pb-40 lg:pb-24 overflow-y-auto">
      {/* Flash Toast Feedback */}
      {(toastFeedback || barcodeFeedback) && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xl animate-in slide-in-from-top duration-200 ${
            (toastFeedback?.type || barcodeFeedback?.type) === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {(toastFeedback?.type || barcodeFeedback?.type) === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastFeedback?.message || barcodeFeedback?.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-6">
        {isDesktop ? (
          /* ======================================================== */
          /* DESKTOP 2-COLUMN COCKPIT LAYOUT                          */
          /* ======================================================== */
          <div className="flex gap-6 items-start">
            {/* Left Column: Barcode & Product Catalog, Rx Accordion */}
            <div className="flex-1 min-w-0 space-y-6">
              {renderSearchBarAndCatalog(false)}
              {renderRxAccordion()}
            </div>

            {/* Right Column: Customer Profile, Cart & Financial Ledger */}
            <div className="w-[440px] xl:w-[480px] space-y-6 shrink-0">
              {renderCustomerSection()}
              {renderCartSection()}
              {renderLedgerSection()}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MOBILE 5-SECTION NATURAL FLOW LAYOUT                     */
          /* ======================================================== */
          <div className="flex flex-col space-y-4">
            {/* Section 1: Customer Selection */}
            {renderCustomerSection()}

            {/* Section 2: Barcode & Search Bar + Catalog */}
            {renderSearchBarAndCatalog(true)}

            {/* Section 3: Cart & Selected Items */}
            {renderCartSection()}

            {/* Section 4: Prescription (Rx) Section (Accordion) */}
            {renderRxAccordion()}

            {/* Section 5: Financial Ledger & Settlement */}
            {renderLedgerSection()}

            {/* Section 6: Sticky Bottom Checkout Bar */}
            {renderStickyCheckoutBar()}
          </div>
        )}
      </div>

      {/* Completed Order Receipt & Lab Job Slip Modal */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => {
            setCompletedOrder(null);
            resetPOS();
          }}
          onGoToDashboard={() => {
            setCompletedOrder(null);
            resetPOS();
            router.push("/dashboard");
          }}
        />
      )}

      {/* New Patient Registration Modal */}
      <NewCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={(cust) => {
          fetchCustomers();
          if (cust?.id) {
            setSelectedCustomerId(cust.id);
            setSelectedCustomerDetails(cust);
          }
          setIsCustomerModalOpen(false);
          setShowCustomerDropdown(false);
          setCustomerSearch("");
          showToast("Customer selected");
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
