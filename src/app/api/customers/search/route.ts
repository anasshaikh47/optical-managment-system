import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query =
      searchParams.get("query") ||
      searchParams.get("q") ||
      searchParams.get("phone") ||
      searchParams.get("search") ||
      "";
    const activeShopId = (await getAuthenticatedShopId(request)) || "default";

    const shopCondition = {
      OR: [
        { shopId: activeShopId },
        { userId: activeShopId },
        ...(activeShopId === "default" ? [{ shopId: "default" }] : []),
      ],
    };

    try {
      const where: any = {
        AND: [shopCondition],
      };

      if (query && query.trim()) {
        const q = query.trim();
        where.AND.push({
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        });
      }

      const dbCustomers = await prisma.customer.findMany({
        where,
        select: {
          id: true,
          shopId: true,
          userId: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          dob: true,
          loyalty_points: true,
          createdAt: true,
          updatedAt: true,
          prescriptions: {
            select: {
              id: true,
              lens_type: true,
              od_sph: true,
              od_cyl: true,
              od_axis: true,
              od_add: true,
              os_sph: true,
              os_cyl: true,
              os_axis: true,
              os_add: true,
              pd_distance: true,
              pd_near: true,
              optometristName: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          orders: {
            select: {
              id: true,
              bill_no: true,
              final_payable: true,
              paid_amount: true,
              balance_amount: true,
              status: true,
              delivery_due_date: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const list = dbCustomers.map((c) => ({
        ...c,
        dob: c.dob ? c.dob.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        prescriptions: c.prescriptions.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        orders: c.orders.map((o) => ({
          ...o,
          delivery_due_date: o.delivery_due_date ? o.delivery_due_date.toISOString() : null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        })),
        _count: {
          prescriptions: c.prescriptions.length,
          orders: c.orders.length,
        },
      }));

      return NextResponse.json({ success: true, data: list });
    } catch (dbError: any) {
      console.warn("Prisma GET customers/search fallback:", dbError.message);
      const tenant = loadTenantState(activeShopId);
      let list = tenant.customers.map((c) => {
        const cPrescriptions = (tenant.prescriptions || []).filter((p) => p.customerId === c.id);
        const cOrders = (tenant.orders || []).filter((o) => o.customerId === c.id);
        return {
          ...c,
          prescriptions: cPrescriptions.slice(0, 5),
          orders: cOrders.slice(0, 5).map((o) => ({
            id: o.id,
            bill_no: o.bill_no,
            final_payable: o.final_payable,
            paid_amount: o.paid_amount,
            balance_amount: o.balance_amount,
            status: o.status,
            createdAt: o.createdAt,
          })),
          _count: {
            prescriptions: cPrescriptions.length,
            orders: cOrders.length,
          },
        };
      });

      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
      }

      return NextResponse.json({ success: true, data: list });
    }
  } catch (error: any) {
    console.error("Error searching customers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search customers" },
      { status: 500 }
    );
  }
}
