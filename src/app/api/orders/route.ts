import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const query = searchParams.get("query");
    const customerId = searchParams.get("customerId");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (query) {
      where.OR = [
        { orderNumber: { contains: query } },
        { customer: { name: { contains: query } } },
        { customer: { phone: { contains: query } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        prescription: true,
        items: true,
        payments: true,
        labJob: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
