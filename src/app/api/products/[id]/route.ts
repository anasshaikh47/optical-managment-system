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
      const item = tenant.inventory.find((i) => i.id === id);
      if (!item) {
        return NextResponse.json(
          { success: false, error: "Inventory item not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: item });
    }

    try {
      const item = await prisma.inventoryItem.findUnique({
        where: { id },
      });

      if (!item) {
        return NextResponse.json(
          { success: false, error: "Inventory item not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: item });
    } catch {
      const tenant = loadTenantState("default");
      const item = tenant.inventory.find((i) => i.id === id);
      if (!item) {
        return NextResponse.json(
          { success: false, error: "Inventory item not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: item });
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
      const index = tenant.inventory.findIndex((i) => i.id === id);
      if (index === -1) {
        return NextResponse.json(
          { success: false, error: "Inventory item not found" },
          { status: 404 }
        );
      }

      const current = tenant.inventory[index];
      const updated = {
        ...current,
        ...body,
        cost_price: body.cost_price !== undefined ? parseFloat(body.cost_price) : current.cost_price,
        selling_price: body.selling_price !== undefined ? parseFloat(body.selling_price) : current.selling_price,
        stock_quantity: body.stock_quantity !== undefined ? parseInt(body.stock_quantity, 10) : current.stock_quantity,
        min_alert_threshold: body.min_alert_threshold !== undefined ? parseInt(body.min_alert_threshold, 10) : current.min_alert_threshold,
        gst_rate: body.gst_rate !== undefined ? parseFloat(body.gst_rate) : current.gst_rate,
        updatedAt: new Date().toISOString(),
      };

      tenant.inventory[index] = updated;
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: updated });
    }

    try {
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
          ...body,
          cost_price: body.cost_price !== undefined ? parseFloat(body.cost_price) : undefined,
          selling_price: body.selling_price !== undefined ? parseFloat(body.selling_price) : undefined,
          stock_quantity: body.stock_quantity !== undefined ? parseInt(body.stock_quantity, 10) : undefined,
          min_alert_threshold: body.min_alert_threshold !== undefined ? parseInt(body.min_alert_threshold, 10) : undefined,
          gst_rate: body.gst_rate !== undefined ? parseFloat(body.gst_rate) : undefined,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    } catch {
      const tenant = loadTenantState("default");
      const index = tenant.inventory.findIndex((i) => i.id === id);
      if (index !== -1) {
        tenant.inventory[index] = { ...tenant.inventory[index], ...body, updatedAt: new Date().toISOString() };
        saveTenantState(tenant);
        return NextResponse.json({ success: true, data: tenant.inventory[index] });
      }
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
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

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      tenant.inventory = tenant.inventory.filter((i) => i.id !== id);
      saveTenantState(tenant);
      return NextResponse.json({ success: true, message: "Item deleted successfully" });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { itemId: id } });
        await tx.inventoryItem.delete({ where: { id } });
      });
      return NextResponse.json({ success: true, message: "Item deleted successfully" });
    } catch {
      const tenant = loadTenantState("default");
      tenant.inventory = tenant.inventory.filter((i) => i.id !== id);
      saveTenantState(tenant);
      return NextResponse.json({ success: true, message: "Item deleted successfully" });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
