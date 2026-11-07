import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = await getAuthenticatedShopId(request);
    const body = await request.json();
    const { status, delivery_due_date } = body;

    try {
      const existing = await prisma.order.findFirst({
        where: {
          id,
          OR: [
            { shopId },
            { userId: shopId },
            ...(shopId === "default" ? [{ shopId: "default" }] : []),
          ],
        },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const dataToUpdate: any = {};
      if (status) dataToUpdate.status = status;
      if (delivery_due_date) dataToUpdate.delivery_due_date = new Date(delivery_due_date);

      const updated = await prisma.order.update({
        where: { id },
        data: dataToUpdate,
        include: {
          customer: true,
          prescription: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          delivery_due_date: updated.delivery_due_date ? updated.delivery_due_date.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (dbError: any) {
      console.warn("Prisma PATCH lab-jobs fallback:", dbError.message);
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
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
