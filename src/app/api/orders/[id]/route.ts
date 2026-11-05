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
    const order = tenant.orders.find((o) => o.id === id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const customer = tenant.customers.find((c) => c.id === order.customerId);
    const prescription = tenant.prescriptions.find((p) => p.id === order.prescriptionId);
    const items = order.items.map((it) => ({
      ...it,
      item: tenant.inventory.find((inv) => inv.id === it.itemId),
    }));
    const payments = tenant.payments.filter((p) => p.orderId === order.id);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        customer,
        prescription,
        items,
        payments,
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
    const { status, delivery_due_date, notes } = body;

    const tenant = loadTenantState(shopId);
    const orderIndex = tenant.orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const order = tenant.orders[orderIndex];
    if (status) order.status = status;
    if (delivery_due_date) order.delivery_due_date = delivery_due_date;
    order.updatedAt = new Date().toISOString();

    if (notes !== undefined && order.prescriptionId) {
      const rx = tenant.prescriptions.find((p) => p.id === order.prescriptionId);
      if (rx) {
        rx.notes = notes;
        rx.updatedAt = new Date().toISOString();
      }
    }

    saveTenantState(tenant);
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
