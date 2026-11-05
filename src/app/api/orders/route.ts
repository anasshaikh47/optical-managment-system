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
    const customerId = searchParams.get("customerId");
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      let list = tenant.orders.map((o) => {
        const customer = tenant.customers.find((c) => c.id === o.customerId);
        const prescription = tenant.prescriptions.find((p) => p.id === o.prescriptionId);
        const items = o.items.map((it) => {
          const med = tenant.medicines.find((inv) => inv.id === (it.medicineId || it.itemId));
          return {
            ...it,
            medicine: med,
            item: med,
          };
        });
        const payments = tenant.payments.filter((p) => p.orderId === o.id);

        return {
          ...o,
          customer,
          prescription,
          items,
          payments,
        };
      });

      if (status && status !== "ALL") {
        list = list.filter((o) => o.status === status);
      }

      if (customerId) {
        list = list.filter((o) => o.customerId === customerId);
      }

      if (query) {
        const q = query.toLowerCase();
        list = list.filter(
          (o) =>
            o.bill_no.toLowerCase().includes(q) ||
            (o.patientName && o.patientName.toLowerCase().includes(q)) ||
            (o.doctorName && o.doctorName.toLowerCase().includes(q)) ||
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

      if (customerId) {
        where.customerId = customerId;
      }

      if (query) {
        where.OR = [
          { bill_no: { contains: query, mode: "insensitive" } },
          { patientName: { contains: query, mode: "insensitive" } },
          { doctorName: { contains: query, mode: "insensitive" } },
          { customer: { name: { contains: query, mode: "insensitive" } } },
          { customer: { phone: { contains: query, mode: "insensitive" } } },
        ];
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          customer: true,
          prescription: true,
          items: {
            include: { medicine: true },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const mapped = orders.map((o) => ({
        ...o,
        items: o.items.map((it) => ({
          ...it,
          item: it.medicine,
        })),
      }));

      return NextResponse.json({ success: true, data: mapped });
    } catch {
      const tenant = loadTenantState("default");
      return NextResponse.json({ success: true, data: tenant.orders });
    }
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
