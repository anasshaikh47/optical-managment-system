import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { bill_no: { contains: query } },
        { customer: { name: { contains: query } } },
        { customer: { phone: { contains: query } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        prescription: true,
        items: {
          include: { item: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error("Error fetching workshop orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch workshop orders" },
      { status: 500 }
    );
  }
}
