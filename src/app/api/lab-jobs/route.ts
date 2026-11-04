import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query");
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      let list = tenant.orders.map((o) => {
        const customer = tenant.customers.find((c) => c.id === o.customerId);
        const prescription = tenant.prescriptions.find((p) => p.id === o.prescriptionId);
        const items = o.items.map((it) => ({
          ...it,
          item: tenant.inventory.find((inv) => inv.id === it.itemId),
        }));
        const payments = tenant.payments.filter((p) => p.orderId === o.id);
        return { ...o, customer, prescription, items, payments };
      });

      if (status && status !== "ALL") {
        list = list.filter((o) => o.status === status);
      }

      if (query) {
        const q = query.toLowerCase();
        list = list.filter(
          (o) =>
            o.bill_no.toLowerCase().includes(q) ||
            (o.customer && o.customer.name.toLowerCase().includes(q)) ||
            (o.customer && o.customer.phone.toLowerCase().includes(q))
        );
      }

      return NextResponse.json({ success: true, data: list });
    }

    try {
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
    } catch {
      const tenant = loadTenantState("default");
      return NextResponse.json({ success: true, data: tenant.orders });
    }
  } catch (error: any) {
    console.error("Error fetching workshop orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch workshop orders" },
      { status: 500 }
    );
  }
}
