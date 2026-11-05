import { NextResponse } from "next/server";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const { status, delivery_due_date } = body;

    const tenant = loadTenantState(shopId);
    const order = tenant.orders.find((o) => o.id === id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (status) order.status = status;
    if (delivery_due_date) order.delivery_due_date = delivery_due_date;
    order.updatedAt = new Date().toISOString();

    saveTenantState(tenant);

    const customer = tenant.customers.find((c) => c.id === order.customerId);
    const prescription = tenant.prescriptions.find((p) => p.id === order.prescriptionId);
    const items = order.items.map((it) => ({
      ...it,
      item: tenant.inventory.find((inv) => inv.id === it.itemId),
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        customer,
        prescription,
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
