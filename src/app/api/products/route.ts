import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
  TenantMedicine,
} from "@/lib/tenant/store";
import { getExpiryStatus } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || searchParams.get("category");
    const query = searchParams.get("query");
    const lowStock = searchParams.get("lowStock");
    const nearExpiry = searchParams.get("nearExpiry");
    const scheduleH = searchParams.get("scheduleH");
    const outOfStock = searchParams.get("outOfStock");
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      let items = [...(tenant.medicines || tenant.inventory || [])];

      if (type && type !== "ALL") {
        items = items.filter(
          (p) =>
            p.packType?.toLowerCase() === type.toLowerCase() ||
            p.scheduleType?.toLowerCase() === type.toLowerCase() ||
            p.type?.toLowerCase() === type.toLowerCase()
        );
      }

      if (query) {
        const q = query.toLowerCase().trim();
        items = items.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.genericSaltName?.toLowerCase().includes(q) ||
            p.manufacturer?.toLowerCase().includes(q) ||
            p.batchNumber?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
            (p.rackLocation && p.rackLocation.toLowerCase().includes(q)) ||
            (p.brand && p.brand.toLowerCase().includes(q))
        );
      }

      if (lowStock === "true") {
        items = items.filter((p) => p.stripQuantity <= p.minStockAlert);
      }

      if (outOfStock === "true") {
        items = items.filter((p) => p.stripQuantity <= 0 && p.looseTabletQuantity <= 0);
      }

      if (scheduleH === "true") {
        items = items.filter(
          (p) => p.isScheduleH || p.scheduleType === "SCHEDULE_H" || p.scheduleType === "SCHEDULE_H1"
        );
      }

      if (nearExpiry === "true") {
        items = items.filter((p) => {
          const exp = getExpiryStatus(p.expiryDate);
          return exp.status === "EXPIRING_SOON" || exp.status === "EXPIRED";
        });
      }

      return NextResponse.json({ success: true, data: items });
    }

    // Default tenant fallback to Prisma
    try {
      const where: any = {};
      if (type && type !== "ALL") {
        where.OR = [
          { packType: type },
          { scheduleType: type },
        ];
      }
      if (query) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { genericSaltName: { contains: query, mode: "insensitive" } },
          { manufacturer: { contains: query, mode: "insensitive" } },
          { batchNumber: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
          { rackLocation: { contains: query, mode: "insensitive" } },
        ];
      }
      if (scheduleH === "true") {
        where.OR = [
          { isScheduleH: true },
          { scheduleType: "SCHEDULE_H" },
          { scheduleType: "SCHEDULE_H1" },
        ];
      }

      const items = await prisma.medicine.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      });

      let filtered = items.map((p) => ({
        ...p,
        // Map compatibility fields
        brand: p.name,
        model: p.genericSaltName,
        type: p.packType,
        cost_price: p.purchaseRate,
        selling_price: p.saleRate,
        stock_quantity: p.stripQuantity,
        min_alert_threshold: p.minStockAlert,
      }));

      if (lowStock === "true") {
        filtered = filtered.filter((p) => p.stripQuantity <= p.minStockAlert);
      }

      if (outOfStock === "true") {
        filtered = filtered.filter((p) => p.stripQuantity <= 0 && p.looseTabletQuantity <= 0);
      }

      if (nearExpiry === "true") {
        filtered = filtered.filter((p) => {
          const exp = getExpiryStatus(p.expiryDate);
          return exp.status === "EXPIRING_SOON" || exp.status === "EXPIRED";
        });
      }

      return NextResponse.json({ success: true, data: filtered });
    } catch {
      const tenant = loadTenantState("default");
      return NextResponse.json({ success: true, data: tenant.medicines });
    }
  } catch (error: any) {
    console.error("Error fetching medicine inventory items:", error);
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
      name,
      brand,
      genericSaltName,
      model,
      manufacturer = "General Pharma",
      packType = "Strip",
      tabletsPerStrip = 10,
      hsnCode = "3004",
      rackLocation = "Rack A-01",
      minStockAlert = 10,
      scheduleType = "GENERAL",
      isScheduleH = false,
      batchNumber = "BT-001",
      expiryDate = "12/2026",
      mrp,
      purchaseRate,
      cost_price,
      saleRate,
      selling_price,
      stripQuantity,
      stock_quantity,
      looseTabletQuantity = 0,
      gstRate = 12.0,
      image_url,
    } = body;

    const medName = name || brand;
    const medSalt = genericSaltName || model || medName;
    const medSaleRate = parseFloat(saleRate || selling_price) || 0;
    const medPurchaseRate = parseFloat(purchaseRate || cost_price) || 0;
    const medMrp = parseFloat(mrp) || medSaleRate;
    const medStripQty = parseInt(stripQuantity ?? stock_quantity, 10) || 0;
    const medLooseQty = parseInt(looseTabletQuantity, 10) || 0;
    const medMinStock = parseInt(minStockAlert, 10) || 10;
    const medGstRate = parseFloat(gstRate) || 12.0;
    const medTabletsPerStrip = parseInt(tabletsPerStrip, 10) || 10;

    if (!sku || !medName || !medSaleRate) {
      return NextResponse.json(
        { success: false, error: "SKU, Medicine Name, and Sale Rate are required" },
        { status: 400 }
      );
    }

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const existing = tenant.medicines.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Medicine with SKU "${sku}" already exists in catalog` },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();
      const newItem: TenantMedicine = {
        id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sku,
        barcode: barcode || null,
        name: medName,
        genericSaltName: medSalt,
        manufacturer,
        packType,
        tabletsPerStrip: medTabletsPerStrip,
        hsnCode,
        rackLocation,
        minStockAlert: medMinStock,
        scheduleType,
        isScheduleH: isScheduleH || scheduleType === "SCHEDULE_H" || scheduleType === "SCHEDULE_H1",
        batchNumber,
        expiryDate,
        mrp: medMrp,
        purchaseRate: medPurchaseRate,
        saleRate: medSaleRate,
        stripQuantity: medStripQty,
        looseTabletQuantity: medLooseQty,
        gstRate: medGstRate,
        image_url: image_url || null,
        // compatibility aliases
        brand: medName,
        model: medSalt,
        type: packType,
        cost_price: medPurchaseRate,
        selling_price: medSaleRate,
        stock_quantity: medStripQty,
        min_alert_threshold: medMinStock,
        shopId,
        createdAt: now,
        updatedAt: now,
      };

      tenant.medicines.unshift(newItem);
      tenant.inventory = tenant.medicines;
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: newItem }, { status: 201 });
    }

    // Default tenant via Prisma
    const existing = await prisma.medicine.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Medicine with SKU "${sku}" already exists in catalog` },
        { status: 409 }
      );
    }

    const item = await prisma.medicine.create({
      data: {
        sku,
        barcode: barcode || null,
        name: medName,
        genericSaltName: medSalt,
        manufacturer,
        packType,
        tabletsPerStrip: medTabletsPerStrip,
        hsnCode,
        rackLocation,
        minStockAlert: medMinStock,
        scheduleType,
        isScheduleH: isScheduleH || scheduleType === "SCHEDULE_H" || scheduleType === "SCHEDULE_H1",
        batchNumber,
        expiryDate,
        mrp: medMrp,
        purchaseRate: medPurchaseRate,
        saleRate: medSaleRate,
        stripQuantity: medStripQty,
        looseTabletQuantity: medLooseQty,
        gstRate: medGstRate,
        image_url: image_url || null,
      },
    });

    const mapped = {
      ...item,
      brand: item.name,
      model: item.genericSaltName,
      type: item.packType,
      cost_price: item.purchaseRate,
      selling_price: item.saleRate,
      stock_quantity: item.stripQuantity,
      min_alert_threshold: item.minStockAlert,
    };

    return NextResponse.json({ success: true, data: mapped }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating medicine item:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create medicine item" },
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
        { success: false, error: "Array of medicine IDs is required for bulk deletion" },
        { status: 400 }
      );
    }

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      tenant.medicines = tenant.medicines.filter((item) => !ids.includes(item.id));
      tenant.inventory = tenant.medicines;
      saveTenantState(tenant);

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${ids.length} medicine item(s)`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { medicineId: { in: ids } },
      });
      await tx.batch.deleteMany({
        where: { medicineId: { in: ids } },
      });
      await tx.medicine.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} medicine item(s)`,
    });
  } catch (error: any) {
    console.error("Error bulk deleting items:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete medicine items" },
      { status: 500 }
    );
  }
}
