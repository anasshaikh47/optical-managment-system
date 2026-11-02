import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { amount, method = "UPI", transaction_ref } = body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid payment amount is required" },
        { status: 400 }
      );
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
    const newStatus = newBalance <= 0 && order.status === "READY_FOR_PICKUP" ? "DELIVERED" : order.status;

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
            include: { item: true },
          },
          payments: true,
        },
      }),
      prisma.customer.update({
        where: { id: order.customerId },
        data: {
          loyalty_points: {
            increment: Math.floor(paymentAmount / 100),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { payment, order: updatedOrder },
    });
  } catch (error: any) {
    console.error("Error adding balance payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
