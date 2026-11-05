import { NextResponse } from "next/server";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    const item = await prisma.inventoryItem.findFirst({
      where: { id, shopId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching single item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch item" },
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

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(body.sku !== undefined && { sku: String(body.sku).trim() }),
        ...(body.barcode !== undefined && { barcode: body.barcode ? String(body.barcode).trim() : null }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.brand !== undefined && { brand: String(body.brand).trim() }),
        ...(body.model !== undefined && { model: body.model ? String(body.model).trim() : null }),
        ...(body.color !== undefined && { color: body.color ? String(body.color).trim() : null }),
        ...(body.size !== undefined && { size: body.size ? String(body.size).trim() : null }),
        ...(body.lens_index !== undefined && { lens_index: body.lens_index ? String(body.lens_index).trim() : null }),
        ...(body.cost_price !== undefined && { cost_price: parseFloat(body.cost_price) || 0 }),
        ...(body.selling_price !== undefined && { selling_price: parseFloat(body.selling_price) || 0 }),
        ...(body.stock_quantity !== undefined && { stock_quantity: parseInt(body.stock_quantity, 10) || 0 }),
        ...(body.min_alert_threshold !== undefined && { min_alert_threshold: parseInt(body.min_alert_threshold, 10) || 5 }),
        ...(body.gst_rate !== undefined && { gst_rate: parseFloat(body.gst_rate) || 12.0 }),
        ...(body.image_url !== undefined && { image_url: body.image_url || null }),
      },
    });

    const serializedItem = {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    // Update tenant cache
    try {
      const tenant = loadTenantState(shopId);
      const idx = tenant.inventory.findIndex((i) => i.id === id);
      if (idx !== -1) {
        tenant.inventory[idx] = serializedItem;
        saveTenantState(tenant);
      }
    } catch {}

    return NextResponse.json({ success: true, data: serializedItem });
  } catch (error: any) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update item" },
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

    await prisma.inventoryItem.deleteMany({
      where: { id, shopId },
    });

    // Update tenant cache
    try {
      const tenant = loadTenantState(shopId);
      tenant.inventory = tenant.inventory.filter((i) => i.id !== id);
      saveTenantState(tenant);
    } catch {}

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete item" },
      { status: 500 }
    );
  }
}
