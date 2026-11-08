import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = await getAuthenticatedShopId(request);

    try {
      const order = await prisma.order.findFirst({
        where: {
          id,
          OR: [
            { shopId },
            { userId: shopId },
            ...(shopId === "default" ? [{ shopId: "default" }] : []),
          ],
        },
        include: {
          customer: true,
          prescription: true,
          items: {
            include: {
              item: true,
            },
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

      const serializedOrder = {
        ...order,
        subtotal: order.subtotal ?? order.total_amount,
        totalAmount: order.totalAmount ?? order.final_payable,
        paidAmount: order.paidAmount ?? order.paid_amount,
        pendingAmount: order.pendingAmount ?? order.balance_amount,
        taxAmount: order.taxAmount ?? order.tax_amount,
        customerName: order.customerName || order.customer?.name || "",
        customerPhone: order.customerPhone || order.customer?.phone || "",
        delivery_due_date: order.delivery_due_date ? order.delivery_due_date.toISOString() : null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        customer: order.customer
          ? {
              ...order.customer,
              dob: order.customer.dob ? order.customer.dob.toISOString() : null,
              createdAt: order.customer.createdAt.toISOString(),
              updatedAt: order.customer.updatedAt.toISOString(),
            }
          : null,
        prescription: order.prescription
          ? {
              ...order.prescription,
              createdAt: order.prescription.createdAt.toISOString(),
              updatedAt: order.prescription.updatedAt.toISOString(),
              rightEye: {
                sph: order.prescription.od_sph,
                cyl: order.prescription.od_cyl,
                axis: order.prescription.od_axis,
                add: order.prescription.od_add,
              },
              leftEye: {
                sph: order.prescription.os_sph,
                cyl: order.prescription.os_cyl,
                axis: order.prescription.os_axis,
                add: order.prescription.os_add,
              },
            }
          : null,
        items: order.items.map((it) => ({
          ...it,
          createdAt: it.createdAt.toISOString(),
          item: it.item
            ? {
                ...it.item,
                createdAt: it.item.createdAt.toISOString(),
                updatedAt: it.item.updatedAt.toISOString(),
              }
            : null,
        })),
        payments: order.payments.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
      };

      return NextResponse.json({ success: true, data: serializedOrder });
    } catch (dbError: any) {
      console.warn("Prisma GET order[id] fallback:", dbError.message);
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
    const shopId = await getAuthenticatedShopId(request);
    const body = await request.json();
    const { status, delivery_due_date, notes } = body;

    try {
      const existingOrder = await prisma.order.findFirst({
        where: {
          id,
          OR: [
            { shopId },
            { userId: shopId },
            ...(shopId === "default" ? [{ shopId: "default" }] : []),
          ],
        },
      });

      if (!existingOrder) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const dataToUpdate: any = {};
      if (status) dataToUpdate.status = status;
      if (delivery_due_date) dataToUpdate.delivery_due_date = new Date(delivery_due_date);

      const updatedOrder = await prisma.order.update({
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
          payments: true,
        },
      });

      if (notes !== undefined && updatedOrder.prescriptionId) {
        await prisma.prescription.update({
          where: { id: updatedOrder.prescriptionId },
          data: { notes },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updatedOrder,
          subtotal: updatedOrder.subtotal ?? updatedOrder.total_amount,
          totalAmount: updatedOrder.totalAmount ?? updatedOrder.final_payable,
          paidAmount: updatedOrder.paidAmount ?? updatedOrder.paid_amount,
          pendingAmount: updatedOrder.pendingAmount ?? updatedOrder.balance_amount,
          delivery_due_date: updatedOrder.delivery_due_date ? updatedOrder.delivery_due_date.toISOString() : null,
          createdAt: updatedOrder.createdAt.toISOString(),
          updatedAt: updatedOrder.updatedAt.toISOString(),
        },
      });
    } catch (dbError: any) {
      console.warn("Prisma PATCH order[id] fallback:", dbError.message);
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
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
