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
  const storePrefix = isDefault ? "VisionPulse Optical" : "My Optical Store";
  const now = new Date().toISOString();

  // Strict multi-tenant zero state: new accounts start with completely clean registers
  const inventory: TenantInventoryItem[] = [];
  const customers: TenantCustomer[] = [];
  const prescriptions: TenantPrescription[] = [];
  const payments: TenantPayment[] = [];
  const orders: TenantOrder[] = [];

  const settings: TenantStoreSetting = {
    id: `setting-${shopId}`,
    storeName: storePrefix,
    tagline: "Clinical Optometry & Optical Retail POS",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    currencySymbol: "₹",
    currencyCode: "INR",
    defaultGstRate: 12.0,
    receiptFooter:
      "Thank you for your visit. Spectacle adaptation warranty applicable as per store policy.",
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
