import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const shopId = await getAuthenticatedShopId(request);
    const body = await request.json().catch(() => ({}));
    const { amountPaid, paymentMode = "CASH", transactionRef } = body;

    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          OR: [
            { shopId },
            { userId: shopId },
            ...(shopId === "default" ? [{ shopId: "default" }] : []),
          ],
        },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const currentPaid = parseFloat(String(order.paidAmount ?? order.paid_amount ?? 0)) || 0;
      const finalPayable = parseFloat(String(order.totalAmount ?? order.final_payable ?? 0)) || 0;
      const currentBalance = Math.max(
        0,
        parseFloat(String(order.pendingAmount ?? order.balance_amount ?? (finalPayable - currentPaid)))
      );

      const settleAmount = amountPaid !== undefined && !isNaN(parseFloat(amountPaid))
        ? parseFloat(amountPaid)
        : currentBalance;

      if (settleAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Due amount is already zero" },
          { status: 400 }
        );
      }

      const newPaidAmount = parseFloat((currentPaid + settleAmount).toFixed(2));
      const newBalance = Math.max(0, parseFloat((finalPayable - newPaidAmount).toFixed(2)));
      const newStatus = newBalance <= 0 ? "DELIVERED" : order.status;

      // 1. Create Payment record in DB
      await prisma.payment.create({
        data: {
          orderId,
          amount: settleAmount,
          method: paymentMode,
          payment_type: "BALANCE",
          transaction_ref: transactionRef || null,
        },
      });

      // 2. Update Order balances & status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paid_amount: newPaidAmount,
          paidAmount: newPaidAmount,
          balance_amount: newBalance,
          pendingAmount: newBalance,
          status: newStatus,
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

      // 3. Award loyalty points if customer ID present
      if (updatedOrder.customerId) {
        try {
          await prisma.customer.update({
            where: { id: updatedOrder.customerId },
            data: {
              loyalty_points: {
                increment: Math.floor(settleAmount / 100),
              },
            },
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: `Successfully collected payment of ₹${settleAmount.toFixed(2)} via ${paymentMode}`,
        data: updatedOrder,
      });
    } catch (dbError: any) {
      console.warn("Prisma pay-due fallback to tenant store:", dbError.message);
      const tenant = loadTenantState(shopId);
      const orderIdx = tenant.orders.findIndex((o) => o.id === orderId);
      if (orderIdx === -1) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const order = tenant.orders[orderIdx];
      const currentPaid = parseFloat(String(order.paid_amount ?? 0)) || 0;
      const finalPayable = parseFloat(String(order.final_payable ?? 0)) || 0;
      const currentBalance = Math.max(0, parseFloat(String(order.balance_amount ?? (finalPayable - currentPaid))));
      const settleAmount = amountPaid !== undefined ? parseFloat(amountPaid) : currentBalance;

      const newPaid = parseFloat((currentPaid + settleAmount).toFixed(2));
      const newBal = Math.max(0, parseFloat((finalPayable - newPaid).toFixed(2)));

      tenant.orders[orderIdx] = {
        ...order,
        paid_amount: newPaid,
        balance_amount: newBal,
        status: newBal <= 0 ? "DELIVERED" : order.status,
        updatedAt: new Date().toISOString(),
      };
      saveTenantState(tenant);

      return NextResponse.json({
        success: true,
        message: `Payment of ₹${settleAmount.toFixed(2)} recorded successfully`,
        data: tenant.orders[orderIdx],
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const PATCH = POST;
