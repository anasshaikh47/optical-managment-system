import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const query = searchParams.get("query");
    const shopId = await getAuthenticatedShopId(request);

    try {
      const where: any = {};
      if (customerId) {
        where.customerId = customerId;
      }
      if (shopId && shopId !== "default") {
        where.customer = {
          OR: [
            { shopId },
            { userId: shopId },
          ],
        };
      }
      if (query && query.trim()) {
        const q = query.trim();
        where.OR = [
          { optometristName: { contains: q, mode: "insensitive" } },
          { lens_type: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { customer: { phone: { contains: q, mode: "insensitive" } } },
        ];
      }

      const dbPrescriptions = await prisma.prescription.findMany({
        where,
        include: {
          customer: true,
          orders: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const list = dbPrescriptions.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        customer: p.customer
          ? {
              ...p.customer,
              dob: p.customer.dob ? p.customer.dob.toISOString() : null,
              createdAt: p.customer.createdAt.toISOString(),
              updatedAt: p.customer.updatedAt.toISOString(),
            }
          : null,
        _count: { orders: p.orders.length },
      }));

      return NextResponse.json({ success: true, data: list });
    } catch (dbError: any) {
      console.warn("Prisma GET prescriptions fallback:", dbError.message);
      const tenant = loadTenantState(shopId);
      let list = tenant.prescriptions.map((p) => {
        const customer = tenant.customers.find((c) => c.id === p.customerId);
        const orderCount = tenant.orders.filter((o) => o.prescriptionId === p.id).length;
        return {
          ...p,
          customer,
          _count: { orders: orderCount },
        };
      });

      if (customerId) {
        list = list.filter((p) => p.customerId === customerId);
      }

      if (query) {
        const q = query.toLowerCase();
        list = list.filter(
          (p) =>
            (p.customer && p.customer.name.toLowerCase().includes(q)) ||
            (p.customer && p.customer.phone.toLowerCase().includes(q)) ||
            (p.optometristName && p.optometristName.toLowerCase().includes(q)) ||
            (p.lens_type && p.lens_type.toLowerCase().includes(q))
        );
      }

      return NextResponse.json({ success: true, data: list });
    }
  } catch (error: any) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const shopId = await getAuthenticatedShopId(request);
    const body = await request.json();
    const {
      customerId,
      optometristName,
      od_sph,
      od_cyl,
      od_axis,
      od_add,
      os_sph,
      os_cyl,
      os_axis,
      os_add,
      pd_distance,
      pd_near,
      lens_type = "SINGLE_VISION",
      notes,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const newRx = await prisma.prescription.create({
      data: {
        customerId,
        optometristName: optometristName || "Dr. Staff Optometrist",
        od_sph: od_sph !== undefined && od_sph !== "" ? parseFloat(od_sph) : null,
        od_cyl: od_cyl !== undefined && od_cyl !== "" ? parseFloat(od_cyl) : null,
        od_axis: od_axis !== undefined && od_axis !== "" ? parseInt(od_axis, 10) : null,
        od_add: od_add !== undefined && od_add !== "" ? parseFloat(od_add) : null,
        os_sph: os_sph !== undefined && os_sph !== "" ? parseFloat(os_sph) : null,
        os_cyl: os_cyl !== undefined && os_cyl !== "" ? parseFloat(os_cyl) : null,
        os_axis: os_axis !== undefined && os_axis !== "" ? parseInt(os_axis, 10) : null,
        os_add: os_add !== undefined && os_add !== "" ? parseFloat(os_add) : null,
        pd_distance: pd_distance !== undefined && pd_distance !== "" ? parseFloat(pd_distance) : null,
        pd_near: pd_near !== undefined && pd_near !== "" ? parseFloat(pd_near) : null,
        lens_type,
        notes: notes || null,
      },
      include: {
        customer: true,
      },
    });

    const serialized = {
      ...newRx,
      createdAt: newRx.createdAt.toISOString(),
      updatedAt: newRx.updatedAt.toISOString(),
      customer: newRx.customer
        ? {
            ...newRx.customer,
            dob: newRx.customer.dob ? newRx.customer.dob.toISOString() : null,
            createdAt: newRx.customer.createdAt.toISOString(),
            updatedAt: newRx.customer.updatedAt.toISOString(),
          }
        : null,
    };

    return NextResponse.json({ success: true, data: serialized }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create prescription" },
      { status: 500 }
    );
  }
}
