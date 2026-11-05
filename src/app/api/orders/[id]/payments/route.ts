import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
  TenantPayment,
} from "@/lib/tenant/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const { amount, method = "UPI", transaction_ref } = body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const order = tenant.orders.find((o) => o.id === orderId);
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const newPaidAmount = order.paid_amount + paymentAmount;
      const newBalance = Math.max(0, order.final_payable - newPaidAmount);
      const newStatus =
        newBalance <= 0 && order.status === "READY_FOR_PICKUP"
          ? "DELIVERED"
          : order.status;

      order.paid_amount = parseFloat(newPaidAmount.toFixed(2));
      order.balance_amount = parseFloat(newBalance.toFixed(2));
      order.status = newStatus;
      order.updatedAt = new Date().toISOString();

      const newPayment: TenantPayment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        orderId,
        amount: paymentAmount,
        method,
        payment_type: "BALANCE",
        transaction_ref: transaction_ref || null,
        createdAt: new Date().toISOString(),
      };

      tenant.payments.unshift(newPayment);
      order.payments.unshift(newPayment);
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
          payment: newPayment,
          order: {
            ...order,
            customer,
            prescription,
            items,
          },
        },
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const newPaidAmount = order.paid_amount + paymentAmount;
    const newBalance = Math.max(0, order.final_payable - newPaidAmount);
    const newStatus =
      newBalance <= 0 && order.status === "READY_FOR_PICKUP" ? "DELIVERED" : order.status;

    const [payment, updatedOrder] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId,
          amount: paymentAmount,
          method,
          payment_type: "BALANCE",
          transaction_ref: transaction_ref || null,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          paid_amount: parseFloat(newPaidAmount.toFixed(2)),
          balance_amount: parseFloat(newBalance.toFixed(2)),
          status: newStatus,
        },
        include: {
          customer: true,
          prescription: true,
          items: {
            include: { medicine: true },
          },
          payments: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { payment, order: updatedOrder },
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}
