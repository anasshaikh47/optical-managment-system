import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopIdFromRequest, loadTenantState, saveTenantState } from "@/lib/tenant/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    try {
      const customer = await prisma.customer.findFirst({
        where: { id },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  item: true,
                },
              },
              payments: true,
            },
            orderBy: { createdAt: "desc" },
          },
          prescriptions: {
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

      const serializedCustomer = {
        ...customer,
        dob: customer.dob ? customer.dob.toISOString() : null,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        orders: customer.orders.map((o) => ({
          ...o,
          delivery_due_date: o.delivery_due_date ? o.delivery_due_date.toISOString() : null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
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
        })),
        prescriptions: customer.prescriptions.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      };

      return NextResponse.json({ success: true, data: serializedCustomer });
    } catch (dbError: any) {
      console.warn("Prisma GET customer[id] fallback:", dbError.message);
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

    try {
      const dataToUpdate: any = {};
      if (body.name !== undefined) dataToUpdate.name = String(body.name).trim();
      if (body.phone !== undefined) dataToUpdate.phone = String(body.phone).trim();
      if (body.email !== undefined) dataToUpdate.email = body.email ? String(body.email).trim() : null;
      if (body.address !== undefined) dataToUpdate.address = body.address ? String(body.address).trim() : null;
      if (body.dob !== undefined) dataToUpdate.dob = body.dob ? new Date(body.dob) : null;
      if (body.loyalty_points !== undefined) dataToUpdate.loyalty_points = parseInt(body.loyalty_points, 10) || 0;

      const updated = await prisma.customer.update({
        where: { id },
        data: dataToUpdate,
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          dob: updated.dob ? updated.dob.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (dbError: any) {
      console.warn("Prisma PATCH customer fallback:", dbError.message);
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

    try {
      await prisma.customer.delete({
        where: { id },
      });
    } catch (e) {
      console.warn("Prisma DELETE customer fallback:", e);
    }

    try {
      const tenant = loadTenantState(shopId);
      tenant.customers = tenant.customers.filter((c) => c.id !== id);
      saveTenantState(tenant);
    } catch {}

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
