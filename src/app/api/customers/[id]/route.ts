import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const customer = tenant.customers.find((c) => c.id === id);
      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      const prescriptions = tenant.prescriptions.filter((p) => p.customerId === id);
      const orders = tenant.orders.filter((o) => o.customerId === id);

      return NextResponse.json({
        success: true,
        data: {
          ...customer,
          prescriptions,
          orders,
        },
      });
    }

    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          prescriptions: {
            orderBy: { createdAt: "desc" },
          },
          orders: {
            include: {
              items: {
                include: { medicine: true },
              },
              payments: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: customer });
    } catch {
      const tenant = loadTenantState("default");
      const customer = tenant.customers.find((c) => c.id === id);
      if (!customer) {
        return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: customer });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const index = tenant.customers.findIndex((c) => c.id === id);
      if (index === -1) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      tenant.customers[index] = {
        ...tenant.customers[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: tenant.customers[index] });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...body,
        dob: body.dob ? new Date(body.dob) : undefined,
        loyalty_points: body.loyalty_points !== undefined ? parseInt(body.loyalty_points, 10) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      tenant.customers = tenant.customers.filter((c) => c.id !== id);
      saveTenantState(tenant);
      return NextResponse.json({ success: true, message: "Customer deleted successfully" });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
