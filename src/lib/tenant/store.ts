import fs from "fs";
import path from "path";

// In-memory tenant store cache
const TENANTS_DIR = path.join(process.cwd(), ".data", "tenants");

// Ensure directory exists
function ensureTenantsDir() {
  try {
    if (!fs.existsSync(TENANTS_DIR)) {
      fs.mkdirSync(TENANTS_DIR, { recursive: true });
    }
  } catch (err) {
    // In restricted environments, fallback to memory
  }
}

export interface TenantInventoryItem {
  id: string;
  sku: string;
  barcode?: string | null;
  type: string;
  brand: string;
  model?: string | null;
  color?: string | null;
  size?: string | null;
  lens_index?: string | null;
  cost_price: number;
  selling_price: number;
  gst_rate: number;
  stock_quantity: number;
  min_alert_threshold: number;
  image_url?: string | null;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  dob?: string | null;
  loyalty_points: number;
  shopId: string;
  prescriptions?: TenantPrescription[];
  orders?: any[];
  _count?: {
    prescriptions: number;
    orders: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TenantPrescription {
  id: string;
  customerId: string;
  customer?: TenantCustomer;
  optometristName?: string | null;
  od_sph?: number | null;
  od_cyl?: number | null;
  od_axis?: number | null;
  od_add?: number | null;
  os_sph?: number | null;
  os_cyl?: number | null;
  os_axis?: number | null;
  os_add?: number | null;
  pd_distance?: number | null;
  pd_near?: number | null;
  lens_type?: string | null;
  notes?: string | null;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantOrder {
  id: string;
  bill_no: string;
  customerId: string;
  customer?: TenantCustomer;
  prescriptionId?: string | null;
  prescription?: TenantPrescription | null;
  status: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_payable: number;
  paid_amount: number;
  balance_amount: number;
  delivery_due_date?: string | null;
  items: TenantOrderItem[];
  payments: TenantPayment[];
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantOrderItem {
  id: string;
  orderId: string;
  itemId: string;
  item?: TenantInventoryItem;
  quantity: number;
  unit_price: number;
  coating_charges: number;
  fitting_charges: number;
  subtotal: number;
  createdAt: string;
}

export interface TenantPayment {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  payment_type: string;
  transaction_ref?: string | null;
  createdAt: string;
}

export interface TenantStoreSetting {
  id: string;
  storeName: string;
  tagline?: string | null;
  gstin?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  currencySymbol: string;
  currencyCode: string;
  defaultGstRate: number;
  receiptFooter?: string | null;
  shopId: string;
  updatedAt: string;
}

export interface TenantState {
  shopId: string;
  inventory: TenantInventoryItem[];
  customers: TenantCustomer[];
  prescriptions: TenantPrescription[];
  orders: TenantOrder[];
  payments: TenantPayment[];
  settings: TenantStoreSetting;
}

// Global in-memory map
const memoryStore = new Map<string, TenantState>();

function getInitialStarterState(shopId: string): TenantState {
  const isDefault = shopId === "default" || !shopId;
  const storePrefix = isDefault ? "VisionPulse" : "My Optics";

  const customerId = `cust-${shopId.slice(0, 8)}-01`;
  const itemId1 = `item-${shopId.slice(0, 8)}-01`;
  const itemId2 = `item-${shopId.slice(0, 8)}-02`;
  const rxId = `rx-${shopId.slice(0, 8)}-01`;
  const orderId = `ord-${shopId.slice(0, 8)}-01`;
  const paymentId = `pay-${shopId.slice(0, 8)}-01`;

  const now = new Date().toISOString();

  const inventory: TenantInventoryItem[] = [
    {
      id: itemId1,
      sku: isDefault ? "RB-5154" : `FRM-${shopId.slice(0, 4).toUpperCase()}-01`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      type: "FRAME",
      brand: "Ray-Ban",
      model: "Clubmaster Classic",
      color: "Tortoise / Gold",
      size: "51-21-145",
      lens_index: null,
      cost_price: 3800,
      selling_price: 7890,
      gst_rate: 12.0,
      stock_quantity: 12,
      min_alert_threshold: 3,
      image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
      shopId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: itemId2,
      sku: isDefault ? "ZEISS-SV156" : `LNS-${shopId.slice(0, 4).toUpperCase()}-01`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      type: "LENS",
      brand: "Zeiss",
      model: "ClearView Single Vision",
      color: "Clear / BlueProtect",
      size: "70mm Diameter",
      lens_index: "1.56",
      cost_price: 1200,
      selling_price: 2800,
      gst_rate: 12.0,
      stock_quantity: 24,
      min_alert_threshold: 5,
      image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400&q=80",
      shopId,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const customers: TenantCustomer[] = [
    {
      id: customerId,
      name: "Aarav Patel",
      phone: "+91 98201 23456",
      email: "aarav.patel@example.com",
      address: "Sea Green Apts, Powai, Mumbai",
      dob: "1992-05-15",
      loyalty_points: 150,
      shopId,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const prescriptions: TenantPrescription[] = [
    {
      id: rxId,
      customerId,
      optometristName: "Dr. Priya Nair, M.Opt",
      od_sph: -1.75,
      od_cyl: -0.5,
      od_axis: 90,
      od_add: 1.5,
      os_sph: -1.5,
      os_cyl: -0.75,
      os_axis: 85,
      os_add: 1.5,
      pd_distance: 63.0,
      pd_near: 60.0,
      lens_type: "SINGLE_VISION",
      notes: "Anti-glare ARC with blue-cut coating for daily screen work",
      shopId,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const payments: TenantPayment[] = [
    {
      id: paymentId,
      orderId,
      method: "UPI",
      amount: 10690,
      payment_type: "FULL",
      transaction_ref: "UPI-4039281726",
      createdAt: now,
    },
  ];

  const orders: TenantOrder[] = [
    {
      id: orderId,
      bill_no: `VP-${new Date().getFullYear()}-0001`,
      customerId,
      prescriptionId: rxId,
      status: "READY_FOR_PICKUP",
      total_amount: 10690,
      discount_amount: 0,
      tax_amount: 1282.8,
      final_payable: 10690,
      paid_amount: 10690,
      balance_amount: 0,
      delivery_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      shopId,
      items: [
        {
          id: `item-order-1`,
          orderId,
          itemId: itemId1,
          quantity: 1,
          unit_price: 7890,
          coating_charges: 0,
          fitting_charges: 0,
          subtotal: 7890,
          createdAt: now,
        },
        {
          id: `item-order-2`,
          orderId,
          itemId: itemId2,
          quantity: 1,
          unit_price: 2800,
          coating_charges: 0,
          fitting_charges: 0,
          subtotal: 2800,
          createdAt: now,
        },
      ],
      payments,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const settings: TenantStoreSetting = {
    id: `setting-${shopId}`,
    storeName: `${storePrefix} Eyewear Studio`,
    tagline: "Precision Clinical Optometry & Premium Eyewear",
    gstin: "27AABCV1234F1Z8",
    phone: "+91 98201 12345",
    email: "care@opticscloud.in",
    address: "Galleria Arcade, Powai, Mumbai - 400076",
    currencySymbol: "₹",
    currencyCode: "INR",
    defaultGstRate: 12.0,
    receiptFooter:
      "1-Year warranty against frame manufacturing defects. Spectacle power adaptation guarantee for 14 days.",
    shopId,
    updatedAt: now,
  };

  return {
    shopId,
    inventory,
    customers,
    prescriptions,
    orders,
    payments,
    settings,
  };
}

export function loadTenantState(rawShopId?: string | null): TenantState {
  const shopId = rawShopId && rawShopId.trim() ? rawShopId.trim() : "default";

  if (memoryStore.has(shopId)) {
    return memoryStore.get(shopId)!;
  }

  ensureTenantsDir();
  const filePath = path.join(TENANTS_DIR, `${encodeURIComponent(shopId)}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed: TenantState = JSON.parse(data);
      memoryStore.set(shopId, parsed);
      return parsed;
    }
  } catch (err) {
    // ignore read error
  }

  const newState = getInitialStarterState(shopId);
  saveTenantState(newState);
  return newState;
}

export function saveTenantState(state: TenantState) {
  memoryStore.set(state.shopId, state);
  ensureTenantsDir();
  const filePath = path.join(TENANTS_DIR, `${encodeURIComponent(state.shopId)}.json`);

  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    // In restricted environments, memory store continues to serve requests
  }
}

export function getShopIdFromRequest(request: Request): string {
  try {
    const url = new URL(request.url);
    const fromQuery = url.searchParams.get("shopId") || url.searchParams.get("userId");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();

    const fromHeader =
      request.headers.get("x-shop-id") ||
      request.headers.get("x-user-id");
    if (fromHeader && fromHeader.trim()) return fromHeader.trim();
  } catch {
    // fallback
  }
  return "default";
}
