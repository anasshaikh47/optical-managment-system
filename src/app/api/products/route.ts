import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
  TenantInventoryItem,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || searchParams.get("category");
    const query = searchParams.get("query");
    const lowStock = searchParams.get("lowStock");
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      let items = [...tenant.inventory];

      if (type && type !== "ALL") {
        items = items.filter((p) => p.type === type);
      }

      if (query) {
        const q = query.toLowerCase();
        items = items.filter(
          (p) =>
            p.brand.toLowerCase().includes(q) ||
            (p.model && p.model.toLowerCase().includes(q)) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
            (p.color && p.color.toLowerCase().includes(q))
        );
      }

      if (lowStock === "true") {
        items = items.filter((p) => p.stock_quantity <= p.min_alert_threshold);
      }

      return NextResponse.json({ success: true, data: items });
    }

    // Default tenant fallback to Prisma
    try {
      const where: any = {};
      if (type && type !== "ALL") {
        where.type = type;
      }
      if (query) {
        where.OR = [
          { brand: { contains: query } },
          { model: { contains: query } },
          { sku: { contains: query } },
          { barcode: { contains: query } },
          { color: { contains: query } },
        ];
      }

      const items = await prisma.inventoryItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      });

      if (lowStock === "true") {
        const filtered = items.filter((p) => p.stock_quantity <= p.min_alert_threshold);
        return NextResponse.json({ success: true, data: filtered });
      }

      return NextResponse.json({ success: true, data: items });
    } catch {
      const tenant = loadTenantState("default");
      return NextResponse.json({ success: true, data: tenant.inventory });
    }
  } catch (error: any) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const {
      sku,
      barcode,
      type = "FRAME",
      brand,
      model,
      color,
      size,
      lens_index,
      cost_price,
      selling_price,
      gst_rate = 12.0,
      stock_quantity = 0,
      min_alert_threshold = 5,
      image_url,
    } = body;

    if (!sku || !brand || !selling_price) {
      return NextResponse.json(
        { success: false, error: "SKU, Brand, and Selling Price are required" },
        { status: 400 }
      );
    }

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const existing = tenant.inventory.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Item with SKU "${sku}" already exists` },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();
      const newItem: TenantInventoryItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sku,
        barcode: barcode || null,
        type,
        brand,
        model: model || null,
        color: color || null,
        size: size || null,
        lens_index: lens_index || null,
        cost_price: parseFloat(cost_price) || 0,
        selling_price: parseFloat(selling_price) || 0,
        gst_rate: parseFloat(gst_rate) || 12.0,
        stock_quantity: parseInt(stock_quantity, 10) || 0,
        min_alert_threshold: parseInt(min_alert_threshold, 10) || 5,
        image_url: image_url || null,
        shopId,
        createdAt: now,
        updatedAt: now,
      };

      tenant.inventory.unshift(newItem);
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: newItem }, { status: 201 });
    }

    // Default tenant via Prisma
    const existing = await prisma.inventoryItem.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Item with SKU "${sku}" already exists` },
        { status: 409 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        sku,
        barcode: barcode || null,
        type,
        brand,
        model: model || null,
        color: color || null,
        size: size || null,
        lens_index: lens_index || null,
        cost_price: parseFloat(cost_price) || 0,
        selling_price: parseFloat(selling_price) || 0,
        gst_rate: parseFloat(gst_rate) || 12.0,
        stock_quantity: parseInt(stock_quantity, 10) || 0,
        min_alert_threshold: parseInt(min_alert_threshold, 10) || 5,
        image_url: image_url || null,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create inventory item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Array of item IDs is required for bulk deletion" },
        { status: 400 }
      );
    }

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      tenant.inventory = tenant.inventory.filter((item) => !ids.includes(item.id));
      saveTenantState(tenant);

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${ids.length} inventory item(s)`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { itemId: { in: ids } },
      });
      await tx.inventoryItem.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} inventory item(s)`,
    });
  } catch (error: any) {
    console.error("Error bulk deleting items:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete inventory items" },
      { status: 500 }
    );
  }
}
