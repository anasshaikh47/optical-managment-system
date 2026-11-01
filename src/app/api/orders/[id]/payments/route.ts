import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { amount, paymentMethod = "CASH", referenceNo, notes } = body;

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

    const newPaidAmount = order.paidAmount + paymentAmount;
    const newBalance = Math.max(0, order.totalAmount - newPaidAmount);
    const newPaymentStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

    const year = new Date().getFullYear();
    const payCount = await prisma.payment.count();
    const paymentNo = `PAY-${year}-${String(payCount + 1).padStart(4, "0")}`;

    const [payment, updatedOrder] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          paymentNo,
          orderId,
          amount: paymentAmount,
          paymentMethod,
          referenceNo: referenceNo || null,
          notes: notes || "Balance payment received",
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          paidAmount: parseFloat(newPaidAmount.toFixed(2)),
          balanceAmount: parseFloat(newBalance.toFixed(2)),
          paymentStatus: newPaymentStatus,
          // If status was Ready For Pickup and paid, can transition or keep as ready
          status: newPaymentStatus === "PAID" && order.status === "READY_FOR_PICKUP" ? "COMPLETED" : order.status,
        },
        include: {
          customer: true,
          items: true,
          payments: true,
          labJob: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { payment, order: updatedOrder },
    });
  } catch (error: any) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
