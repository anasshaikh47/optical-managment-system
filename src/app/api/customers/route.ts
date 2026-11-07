import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const shopId = await getAuthenticatedShopId(request);

    try {
      const where: any = {
        OR: [
          { shopId },
          { userId: shopId },
          ...(shopId === "default" ? [{ shopId: "default" }] : []),
        ],
      };

      if (query && query.trim()) {
        const q = query.trim();
        where.AND = [
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        ];
      }

      const dbCustomers = await prisma.customer.findMany({
        where,
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
          },
          prescriptions: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const list = dbCustomers.map((c) => ({
        ...c,
        dob: c.dob ? c.dob.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        orders: c.orders.map((o) => ({
          ...o,
          delivery_due_date: o.delivery_due_date ? o.delivery_due_date.toISOString() : null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        })),
        prescriptions: c.prescriptions.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        _count: {
          prescriptions: c.prescriptions.length,
          orders: c.orders.length,
        },
      }));

      // Update tenant cache as warm fallback
      try {
        const tenant = loadTenantState(shopId);
        tenant.customers = list as any;
        saveTenantState(tenant);
      } catch {}

      return NextResponse.json({ success: true, data: list });
    } catch (dbError: any) {
      console.warn("Prisma GET customers error, using cache fallback:", dbError.message);
      const tenant = loadTenantState(shopId);
      let list = tenant.customers.map((c) => {
        const cPrescriptions = (tenant.prescriptions || []).filter((p) => p.customerId === c.id);
        const cOrders = (tenant.orders || []).filter((o) => o.customerId === c.id);
        return {
          ...c,
          prescriptions: cPrescriptions.slice(0, 1),
          orders: cOrders.map((o) => ({
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

      if (query) {
        const q = query.toLowerCase();
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
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const shopId = await getAuthenticatedShopId(request);
    const body = await request.json();
    const { name, phone, email, address, dob, loyalty_points = 0 } = body;

    const trimmedName = name ? String(name).trim() : "";
    const trimmedPhone = phone ? String(phone).trim() : "";

    if (!trimmedName || !trimmedPhone) {
      return NextResponse.json(
        { success: false, error: "Customer name and unique phone number are required" },
        { status: 400 }
      );
    }

    // Check duplicate phone in database for this shop
    const existing = await prisma.customer.findFirst({
      where: {
        phone: trimmedPhone,
        OR: [
          { shopId },
          { userId: shopId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Customer with phone "${trimmedPhone}" already registered in this store.` },
        { status: 409 }
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: trimmedName,
        phone: trimmedPhone,
        email: email ? String(email).trim() : null,
        address: address ? String(address).trim() : null,
        dob: dob ? new Date(dob) : null,
        loyalty_points: parseInt(loyalty_points, 10) || 0,
        shopId,
        userId: shopId,
      },
      include: {
        orders: true,
        prescriptions: true,
      },
    });

    const serializedCustomer = {
      ...newCustomer,
      dob: newCustomer.dob ? newCustomer.dob.toISOString() : null,
      createdAt: newCustomer.createdAt.toISOString(),
      updatedAt: newCustomer.updatedAt.toISOString(),
      orders: [],
      prescriptions: [],
      _count: { orders: 0, prescriptions: 0 },
    };

    // Update tenant cache as fallback
    try {
      const tenant = loadTenantState(shopId);
      tenant.customers = tenant.customers.filter((c) => c.id !== newCustomer.id && c.phone !== newCustomer.phone);
      tenant.customers.unshift(serializedCustomer as any);
      saveTenantState(tenant);
    } catch {}

    return NextResponse.json({ success: true, data: serializedCustomer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer in database" },
      { status: 500 }
    );
  }
}
