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

export interface TenantMedicine {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string; // Brand name (e.g. Dolo 650, Augmentin 625 Duo)
  genericSaltName: string; // Composition / Salt (e.g. Paracetamol 650mg)
  manufacturer: string; // e.g. Micro Labs Ltd, GSK
  packType: string; // Strip, Bottle, Box, Syringe, Ointment
  tabletsPerStrip: number; // for Strip vs Loose Tablet selling calculation (default 10)
  hsnCode: string; // e.g. "3004"
  rackLocation: string; // e.g. "Rack A-12"
  minStockAlert: number;
  scheduleType: string; // 'GENERAL' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'OTC'
  isScheduleH: boolean;
  image_url?: string | null;

  // Batch & Inventory details
  batchNumber: string;
  expiryDate: string; // MM/YYYY
  mrp: number;
  purchaseRate: number;
  saleRate: number;
  stripQuantity: number;
  looseTabletQuantity: number;
  gstRate: number; // 5, 12, 18

  // Compatibility aliases
  brand?: string;
  model?: string | null;
  type?: string;
  cost_price?: number;
  selling_price?: number;
  stock_quantity?: number;
  min_alert_threshold?: number;

  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export type TenantInventoryItem = TenantMedicine;

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
  patientName?: string | null;
  patientAge?: number | null;
  doctorName?: string | null;
  clinicOrHospital?: string | null;
  doctorRegNo?: string | null;
  prescriptionImage?: string | null;
  dosageInstructions?: string | null; // e.g. "1-0-1 After Meals"
  notes?: string | null;
  
  // Optical compatibility properties
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
  patientName?: string | null;
  doctorName?: string | null;
  status: string; // 'COMPLETED' | 'PENDING_RX' | 'READY_FOR_PICKUP' | 'CANCELLED'
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
  medicineId: string;
  medicine?: TenantMedicine;
  itemId?: string; // compatibility alias
  item?: TenantMedicine; // compatibility alias
  name?: string;
  batchNumber?: string;
  expiryDate?: string;
  packType?: string;
  unitType: "STRIP" | "LOOSE_TABLET" | "UNIT"; // Unit of sale
  quantity: number;
  unit_price: number;
  coating_charges?: number; // compatibility
  fitting_charges?: number; // compatibility
  subtotal: number;
  gstRate?: number;
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
  dlNumber?: string | null; // Drug License No
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
  medicines: TenantMedicine[];
  inventory: TenantMedicine[]; // alias for compatibility
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
  const storePrefix = isDefault ? "PharmaPulse Chemist & Druggist" : "PharmaPulse Branch Terminal";
  const now = new Date().toISOString();

  // Initial starter pharmacy inventory
  const medicines: TenantMedicine[] = isDefault
    ? [
        {
          id: "med-aug625",
          sku: "MED-AUG625",
          barcode: "8901030784920",
          name: "Augmentin 625 Duo Tablet",
          genericSaltName: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
          manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
          packType: "Strip",
          tabletsPerStrip: 10,
          hsnCode: "30041010",
          rackLocation: "Rack A-01",
          minStockAlert: 15,
          scheduleType: "SCHEDULE_H",
          isScheduleH: true,
          batchNumber: "AUG-8492",
          expiryDate: "08/2027",
          mrp: 223.50,
          purchaseRate: 165.00,
          saleRate: 201.15,
          stripQuantity: 45,
          looseTabletQuantity: 6,
          gstRate: 12.0,
          brand: "Augmentin 625 Duo",
          model: "Strip of 10",
          type: "Strip",
          cost_price: 165.00,
          selling_price: 201.15,
          stock_quantity: 45,
          min_alert_threshold: 15,
          image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "med-dolo650",
          sku: "MED-DOLO650",
          barcode: "8901234560012",
          name: "Dolo 650 Tablet",
          genericSaltName: "Paracetamol (650mg)",
          manufacturer: "Micro Labs Ltd",
          packType: "Strip",
          tabletsPerStrip: 15,
          hsnCode: "30049060",
          rackLocation: "Rack B-04",
          minStockAlert: 20,
          scheduleType: "OTC",
          isScheduleH: false,
          batchNumber: "DL-6501",
          expiryDate: "11/2026",
          mrp: 34.00,
          purchaseRate: 22.00,
          saleRate: 30.60,
          stripQuantity: 80,
          looseTabletQuantity: 8,
          gstRate: 12.0,
          brand: "Dolo 650",
          model: "Strip of 15",
          type: "Strip",
          cost_price: 22.00,
          selling_price: 30.60,
          stock_quantity: 80,
          min_alert_threshold: 20,
          image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80",
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "med-pand",
          sku: "MED-PAND",
          barcode: "8902145698712",
          name: "Pan-D Capsule",
          genericSaltName: "Pantoprazole (40mg) + Domperidone (30mg)",
          manufacturer: "Alkem Laboratories Ltd",
          packType: "Strip",
          tabletsPerStrip: 15,
          hsnCode: "30049099",
          rackLocation: "Rack A-08",
          minStockAlert: 10,
          scheduleType: "SCHEDULE_H",
          isScheduleH: true,
          batchNumber: "PAND-3112",
          expiryDate: "03/2027",
          mrp: 210.00,
          purchaseRate: 145.00,
          saleRate: 189.00,
          stripQuantity: 28,
          looseTabletQuantity: 4,
          gstRate: 12.0,
          brand: "Pan-D",
          model: "Strip of 15",
          type: "Strip",
          cost_price: 145.00,
          selling_price: 189.00,
          stock_quantity: 28,
          min_alert_threshold: 10,
          image_url: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&q=80",
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "med-azith500",
          sku: "MED-AZITH500",
          barcode: "8903344556677",
          name: "Azithral 500 Tablet",
          genericSaltName: "Azithromycin (500mg)",
          manufacturer: "Alembic Pharmaceuticals Ltd",
          packType: "Strip",
          tabletsPerStrip: 5,
          hsnCode: "30042099",
          rackLocation: "Rack C-02",
          minStockAlert: 12,
          scheduleType: "SCHEDULE_H",
          isScheduleH: true,
          batchNumber: "AZ-9901",
          expiryDate: "12/2026",
          mrp: 132.00,
          purchaseRate: 88.00,
          saleRate: 118.80,
          stripQuantity: 6,
          looseTabletQuantity: 0,
          gstRate: 12.0,
          brand: "Azithral 500",
          model: "Strip of 5",
          type: "Strip",
          cost_price: 88.00,
          selling_price: 118.80,
          stock_quantity: 6,
          min_alert_threshold: 12,
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "med-ascoril",
          sku: "MED-ASCORIL",
          barcode: "8904455667788",
          name: "Ascoril D Plus Syrup (100ml)",
          genericSaltName: "Dextromethorphan + Phenylephrine + Chlorpheniramine",
          manufacturer: "Glenmark Pharmaceuticals Ltd",
          packType: "Bottle",
          tabletsPerStrip: 1,
          hsnCode: "30049099",
          rackLocation: "Rack S-05",
          minStockAlert: 8,
          scheduleType: "OTC",
          isScheduleH: false,
          batchNumber: "ASC-5541",
          expiryDate: "05/2026",
          mrp: 145.00,
          purchaseRate: 95.00,
          saleRate: 130.50,
          stripQuantity: 18,
          looseTabletQuantity: 0,
          gstRate: 12.0,
          brand: "Ascoril D Plus",
          model: "100ml Bottle",
          type: "Bottle",
          cost_price: 95.00,
          selling_price: 130.50,
          stock_quantity: 18,
          min_alert_threshold: 8,
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "med-betadine",
          sku: "MED-BETADINE",
          barcode: "8905566778899",
          name: "Betadine 10% Ointment (20g)",
          genericSaltName: "Povidone Iodine (10% w/w)",
          manufacturer: "Win-Medicare Pvt Ltd",
          packType: "Ointment",
          tabletsPerStrip: 1,
          hsnCode: "30049099",
          rackLocation: "Rack O-01",
          minStockAlert: 10,
          scheduleType: "OTC",
          isScheduleH: false,
          batchNumber: "BT-2024",
          expiryDate: "10/2025",
          mrp: 110.00,
          purchaseRate: 70.00,
          saleRate: 99.00,
          stripQuantity: 3,
          looseTabletQuantity: 0,
          gstRate: 12.0,
          brand: "Betadine 10%",
          model: "20g Tube",
          type: "Ointment",
          cost_price: 70.00,
          selling_price: 99.00,
          stock_quantity: 3,
          min_alert_threshold: 10,
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "med-dispovan",
          sku: "MED-DISPOVAN",
          barcode: "8906677889900",
          name: "Dispovan 5ml Syringe with Needle",
          genericSaltName: "Sterile Single-use Hypodermic Syringe",
          manufacturer: "Hindustan Syringes & Medical Devices",
          packType: "Syringe",
          tabletsPerStrip: 1,
          hsnCode: "90183100",
          rackLocation: "Rack D-10",
          minStockAlert: 30,
          scheduleType: "GENERAL",
          isScheduleH: false,
          batchNumber: "DSP-771",
          expiryDate: "01/2029",
          mrp: 12.00,
          purchaseRate: 5.50,
          saleRate: 9.00,
          stripQuantity: 0,
          looseTabletQuantity: 0,
          gstRate: 5.0,
          brand: "Dispovan",
          model: "5ml with Needle",
          type: "Syringe",
          cost_price: 5.50,
          selling_price: 9.00,
          stock_quantity: 0,
          min_alert_threshold: 30,
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [];

  const customers: TenantCustomer[] = isDefault
    ? [
        {
          id: "cust-01",
          name: "Aarav Patel",
          phone: "+91 98201 23456",
          email: "aarav.patel@gmail.com",
          address: "A-402, Sea Green Apts, Juhu Tara Road, Mumbai - 400049",
          dob: "1992-05-15",
          loyalty_points: 150,
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [];

  const prescriptions: TenantPrescription[] = isDefault
    ? [
        {
          id: "rx-01",
          customerId: "cust-01",
          patientName: "Aarav Patel",
          patientAge: 34,
          doctorName: "Dr. Sandeep Deshmukh, MD",
          clinicOrHospital: "Apollo Clinic & Diagnostic Center",
          doctorRegNo: "MCI-48921",
          dosageInstructions: "Augmentin 625 (1-0-1 After Meals), Dolo 650 (1-0-1 if fever > 100°F)",
          notes: "Drink plenty of fluids. Complete 5-day course without skipping doses.",
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [];

  const orders: TenantOrder[] = isDefault
    ? [
        {
          id: "ord-01",
          bill_no: "RX-2026-0001",
          customerId: "cust-01",
          prescriptionId: "rx-01",
          patientName: "Aarav Patel",
          doctorName: "Dr. Sandeep Deshmukh, MD",
          status: "COMPLETED",
          total_amount: 262.35,
          discount_amount: 15.00,
          tax_amount: 29.68,
          final_payable: 277.03,
          paid_amount: 277.03,
          balance_amount: 0,
          delivery_due_date: now,
          items: [
            {
              id: "item-ord-01",
              orderId: "ord-01",
              medicineId: "med-aug625",
              itemId: "med-aug625",
              name: "Augmentin 625 Duo Tablet",
              batchNumber: "AUG-8492",
              expiryDate: "08/2027",
              packType: "Strip",
              unitType: "STRIP",
              quantity: 1,
              unit_price: 201.15,
              subtotal: 201.15,
              gstRate: 12.0,
              createdAt: now,
            },
            {
              id: "item-ord-02",
              orderId: "ord-01",
              medicineId: "med-dolo650",
              itemId: "med-dolo650",
              name: "Dolo 650 Tablet",
              batchNumber: "DL-6501",
              expiryDate: "11/2026",
              packType: "Strip",
              unitType: "STRIP",
              quantity: 2,
              unit_price: 30.60,
              subtotal: 61.20,
              gstRate: 12.0,
              createdAt: now,
            },
          ],
          payments: [
            {
              id: "pay-01",
              orderId: "ord-01",
              method: "UPI",
              amount: 277.03,
              payment_type: "FULL",
              transaction_ref: "UPI/PAYTM/9820123456",
              createdAt: now,
            },
          ],
          shopId: "default",
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [];

  const payments: TenantPayment[] = isDefault
    ? [
        {
          id: "pay-01",
          orderId: "ord-01",
          method: "UPI",
          amount: 277.03,
          payment_type: "FULL",
          transaction_ref: "UPI/PAYTM/9820123456",
          createdAt: now,
        },
      ]
    : [];

  const settings: TenantStoreSetting = {
    id: `setting-${shopId}`,
    storeName: storePrefix,
    tagline: "High-Efficiency Pharmacy & Clinical Store ERP",
    gstin: "27AABCP9876F1Z2",
    dlNumber: "DL-20B/21B-458920",
    phone: "+91 98201 12345",
    email: "care@pharmapulse.in",
    address: "Shop 10 & 11, Central Avenue, Powai, Mumbai - 400076",
    currencySymbol: "₹",
    currencyCode: "INR",
    defaultGstRate: 12.0,
    receiptFooter:
      "Medicines sold against valid registered Doctor Prescription. Please check batch number & expiry date before consumption. Thank you for choosing PharmaPulse!",
    shopId,
    updatedAt: now,
  };

  return {
    shopId,
    medicines,
    inventory: medicines,
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
    const cached = memoryStore.get(shopId)!;
    // ensure inventory & medicines are synced
    if (!cached.medicines && cached.inventory) {
      cached.medicines = cached.inventory;
    }
    if (!cached.inventory && cached.medicines) {
      cached.inventory = cached.medicines;
    }
    return cached;
  }

  ensureTenantsDir();
  const filePath = path.join(TENANTS_DIR, `${encodeURIComponent(shopId)}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed: TenantState = JSON.parse(data);
      if (!parsed.medicines && parsed.inventory) {
        parsed.medicines = parsed.inventory;
      }
      if (!parsed.inventory && parsed.medicines) {
        parsed.inventory = parsed.medicines;
      }
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
  // Sync medicines and inventory aliases
  if (state.medicines && !state.inventory) {
    state.inventory = state.medicines;
  } else if (state.inventory && !state.medicines) {
    state.medicines = state.inventory;
  }

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
