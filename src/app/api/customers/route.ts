import { NextResponse } from "next/server";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
  TenantCustomer,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const shopId = getShopIdFromRequest(request);

    const tenant = loadTenantState(shopId);
    let list = tenant.customers.map((c) => {
      const cPrescriptions = tenant.prescriptions.filter((p) => p.customerId === c.id);
      const cOrders = tenant.orders.filter((o) => o.customerId === c.id);
      return {
        ...c,
        prescriptions: cPrescriptions.slice(0, 1),
        orders: cOrders.map((o) => ({
          id: o.id,
          bill_no: o.bill_no,
          final_payable: o.final_payable,
          paid_amount: o.paid_amount,
          balance_amount: o.balance_amount,
          status: o.status,
          createdAt: o.createdAt,
        })),
        _count: {
          prescriptions: cPrescriptions.length,
          orders: cOrders.length,
        },
      };
    });

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const { name, phone, email, address, dob, loyalty_points = 0 } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Customer name and unique phone number are required" },
        { status: 400 }
      );
    }

    const tenant = loadTenantState(shopId);
    const existing = tenant.customers.find((c) => c.phone === phone);
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Customer with phone "${phone}" already registered.` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const newCustomer: TenantCustomer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name,
      phone,
      email: email || null,
      address: address || null,
      dob: dob || null,
      loyalty_points: parseInt(loyalty_points, 10) || 0,
      shopId,
      createdAt: now,
      updatedAt: now,
    };

    tenant.customers.unshift(newCustomer);
    saveTenantState(tenant);

    return NextResponse.json({ success: true, data: newCustomer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
