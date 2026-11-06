import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopIdFromRequest, loadTenantState } from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query");
    const shopId = getShopIdFromRequest(request);

    try {
      const where: any = {
        OR: [
          { shopId },
          { userId: shopId },
          ...(shopId === "default" ? [{ shopId: "default" }] : []),
        ],
      };

      if (status && status !== "ALL") {
        where.status = status;
      }

      if (query && query.trim()) {
        const q = query.trim();
        where.AND = [
          {
            OR: [
              { bill_no: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { customerPhone: { contains: q, mode: "insensitive" } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
              { customer: { phone: { contains: q, mode: "insensitive" } } },
            ],
          },
        ];
      }

      const dbOrders = await prisma.order.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
      });

      const list = dbOrders.map((o) => ({
        ...o,
        subtotal: o.subtotal ?? o.total_amount,
        totalAmount: o.totalAmount ?? o.final_payable,
        paidAmount: o.paidAmount ?? o.paid_amount,
        pendingAmount: o.pendingAmount ?? o.balance_amount,
        delivery_due_date: o.delivery_due_date ? o.delivery_due_date.toISOString() : null,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        customer: o.customer
          ? {
              ...o.customer,
              dob: o.customer.dob ? o.customer.dob.toISOString() : null,
              createdAt: o.customer.createdAt.toISOString(),
              updatedAt: o.customer.updatedAt.toISOString(),
            }
          : null,
        prescription: o.prescription
          ? {
              ...o.prescription,
              createdAt: o.prescription.createdAt.toISOString(),
              updatedAt: o.prescription.updatedAt.toISOString(),
            }
          : null,
        items: o.items.map((it) => ({
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
        payments: o.payments.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
      }));

      return NextResponse.json({ success: true, data: list });
    } catch (dbError: any) {
      console.warn("Prisma GET lab-jobs fallback:", dbError.message);
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
  } catch (error: any) {
    console.error("Error fetching lab jobs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lab jobs" },
      { status: 500 }
    );
  }
}
