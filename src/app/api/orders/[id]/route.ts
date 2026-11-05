import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    if (shopId !== "default") {
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
      const items = order.items.map((it) => {
        const med = tenant.medicines.find((inv) => inv.id === (it.medicineId || it.itemId));
        return {
          ...it,
          medicine: med,
          item: med,
        };
      });
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
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          prescription: true,
          items: {
            include: { medicine: true },
          },
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const mapped = {
        ...order,
        items: order.items.map((it) => ({
          ...it,
          item: it.medicine,
        })),
      };

      return NextResponse.json({ success: true, data: mapped });
    } catch {
      const tenant = loadTenantState("default");
      const order = tenant.orders.find((o) => o.id === id);
      if (!order) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: order });
    }
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
    const { status, delivery_due_date } = body;

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const orderIndex = tenant.orders.findIndex((o) => o.id === id);
      if (orderIndex === -1) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const current = tenant.orders[orderIndex];
      const updated = {
        ...current,
        status: status || current.status,
        delivery_due_date: delivery_due_date ? new Date(delivery_due_date).toISOString() : current.delivery_due_date,
        updatedAt: new Date().toISOString(),
      };

      tenant.orders[orderIndex] = updated;
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: updated });
    }

    try {
      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: status || undefined,
          delivery_due_date: delivery_due_date ? new Date(delivery_due_date) : undefined,
        },
        include: {
          customer: true,
          prescription: true,
          items: {
            include: { medicine: true },
          },
          payments: true,
        },
      });

      const mapped = {
        ...updated,
        items: updated.items.map((it) => ({
          ...it,
          item: it.medicine,
        })),
      };

      return NextResponse.json({ success: true, data: mapped });
    } catch {
      const tenant = loadTenantState("default");
      const orderIndex = tenant.orders.findIndex((o) => o.id === id);
      if (orderIndex !== -1) {
        tenant.orders[orderIndex].status = status || tenant.orders[orderIndex].status;
        saveTenantState(tenant);
        return NextResponse.json({ success: true, data: tenant.orders[orderIndex] });
      }
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
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

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      tenant.orders = tenant.orders.filter((o) => o.id !== id);
      tenant.payments = tenant.payments.filter((p) => p.orderId !== id);
      saveTenantState(tenant);
      return NextResponse.json({ success: true, message: "Order deleted successfully" });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.payment.deleteMany({ where: { orderId: id } });
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await tx.order.delete({ where: { id } });
      });

      return NextResponse.json({ success: true, message: "Order deleted successfully" });
    } catch {
      const tenant = loadTenantState("default");
      tenant.orders = tenant.orders.filter((o) => o.id !== id);
      saveTenantState(tenant);
      return NextResponse.json({ success: true, message: "Order deleted successfully" });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
