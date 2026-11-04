import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
  TenantPrescription,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const query = searchParams.get("query");
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
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

    try {
      const where: any = {};
      if (customerId) {
        where.customerId = customerId;
      }

      if (query) {
        where.OR = [
          { customer: { name: { contains: query } } },
          { customer: { phone: { contains: query } } },
          { optometristName: { contains: query } },
          { lens_type: { contains: query } },
        ];
      }

      const prescriptions = await prisma.prescription.findMany({
        where,
        include: {
          customer: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: prescriptions });
    } catch {
      const tenant = loadTenantState("default");
      return NextResponse.json({ success: true, data: tenant.prescriptions });
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
    const shopId = getShopIdFromRequest(request);
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

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const now = new Date().toISOString();
      const newRx: TenantPrescription = {
        id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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
        shopId,
        createdAt: now,
        updatedAt: now,
      };

      tenant.prescriptions.unshift(newRx);
      saveTenantState(tenant);

      const customer = tenant.customers.find((c) => c.id === customerId);
      return NextResponse.json(
        { success: true, data: { ...newRx, customer } },
        { status: 201 }
      );
    }

    const prescription = await prisma.prescription.create({
      data: {
        customerId,
        optometristName: optometristName || null,
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

    return NextResponse.json({ success: true, data: prescription }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create prescription" },
      { status: 500 }
    );
  }
}
