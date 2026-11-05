import { NextResponse } from "next/server";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    const tenant = loadTenantState(shopId);
    const customer = tenant.customers.find((c) => c.id === id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const prescriptions = tenant.prescriptions.filter((p) => p.customerId === id);
    const orders = tenant.orders.filter((o) => o.customerId === id);

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        prescriptions,
        orders,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();

    const tenant = loadTenantState(shopId);
    const index = tenant.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    tenant.customers[index] = {
      ...tenant.customers[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    saveTenantState(tenant);

    return NextResponse.json({ success: true, data: tenant.customers[index] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    const tenant = loadTenantState(shopId);
    tenant.customers = tenant.customers.filter((c) => c.id !== id);
    saveTenantState(tenant);
    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
