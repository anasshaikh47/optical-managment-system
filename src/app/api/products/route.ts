import { NextResponse } from "next/server";
import {
  loadTenantState,
  saveTenantState,
  TenantInventoryItem,
} from "@/lib/tenant/store";
import prisma from "@/lib/prisma";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || searchParams.get("category");
    const query = searchParams.get("query");
    const lowStock = searchParams.get("lowStock");
    const shopId = await getAuthenticatedShopId(request);

    try {
      const where: any = { shopId };

      if (type && type !== "ALL") {
        where.type = type;
      }

      if (query && query.trim()) {
        const q = query.trim();
        where.OR = [
          { brand: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
          { color: { contains: q, mode: "insensitive" } },
        ];
      }

      const dbItems = await prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      let items: any[] = dbItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));

      if (lowStock === "true") {
        items = items.filter((p) => p.stock_quantity <= p.min_alert_threshold);
      }

      return NextResponse.json({ success: true, data: items });
    } catch (dbError: any) {
      console.warn("Prisma GET inventory error, using cache fallback:", dbError.message);
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
    const shopId = await getAuthenticatedShopId(request);
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

    if (!sku || !brand || selling_price === undefined || selling_price === "") {
      return NextResponse.json(
        { success: false, error: "SKU, Brand, and Selling Price are required" },
        { status: 400 }
      );
    }

    const cleanSku = String(sku).trim();
    const cleanBrand = String(brand).trim();

    // Check duplicate SKU for this shop in database
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        shopId,
        sku: { equals: cleanSku, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Item with SKU "${cleanSku}" already exists in your store inventory.` },
        { status: 409 }
      );
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        sku: cleanSku,
        barcode: barcode ? String(barcode).trim() : null,
        type: type || "FRAME",
        brand: cleanBrand,
        model: model ? String(model).trim() : null,
        color: color ? String(color).trim() : null,
        size: size ? String(size).trim() : null,
        lens_index: lens_index ? String(lens_index).trim() : null,
        cost_price: parseFloat(cost_price) || 0,
        selling_price: parseFloat(selling_price) || 0,
        gst_rate: parseFloat(gst_rate) || 12.0,
        stock_quantity: parseInt(stock_quantity, 10) || 0,
        min_alert_threshold: parseInt(min_alert_threshold, 10) || 5,
        image_url: image_url || null,
        shopId,
      },
    });

    const serializedItem = {
      ...newItem,
      createdAt: newItem.createdAt.toISOString(),
      updatedAt: newItem.updatedAt.toISOString(),
    };

    // Keep tenant cache synced
    try {
      const tenant = loadTenantState(shopId);
      tenant.inventory = tenant.inventory.filter((i) => i.id !== newItem.id && i.sku !== newItem.sku);
      tenant.inventory.unshift(serializedItem);
      saveTenantState(tenant);
    } catch {
      // cache sync only
    }

    return NextResponse.json({ success: true, data: serializedItem }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create inventory item in database" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const shopId = await getAuthenticatedShopId(request);
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Array of item IDs is required for bulk deletion" },
        { status: 400 }
      );
    }

    await prisma.inventoryItem.deleteMany({
      where: {
        id: { in: ids },
        shopId,
      },
    });

    // Update tenant cache
    try {
      const tenant = loadTenantState(shopId);
      tenant.inventory = tenant.inventory.filter((item) => !ids.includes(item.id));
      saveTenantState(tenant);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} inventory item(s) from database`,
    });
  } catch (error: any) {
    console.error("Error bulk deleting items:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete inventory items from database" },
      { status: 500 }
    );
  }
}
